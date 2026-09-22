import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createRemoteJWKSet, jwtVerify } from "jose";

import { DEFAULT_LIMITS } from "./quota";

/** Service-role client — server only, never expose this key to the browser. */
let admin: SupabaseClient | null = null;

function getAdmin(): SupabaseClient {
  if (!admin) {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
    if (!url || !key) throw new Error("Supabase service role credentials are not configured");
    admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return admin;
}

const firebaseJwks = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);

function firebaseProjectId(): string | null {
  const direct = process.env["FIREBASE_PROJECT_ID"];
  if (direct) return direct;
  const raw = process.env["FIREBASE_SERVICE_ACCOUNT_JSON"];
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { project_id?: string; projectId?: string };
    return parsed.project_id ?? parsed.projectId ?? null;
  } catch {
    return null;
  }
}

function stripBearer(authHeader: string): string {
  return authHeader.replace(/^Bearer\s+/i, "").trim();
}

/**
 * Returns a trusted user id for the given Authorization header, or null.
 * Tries Supabase Auth first, then a Firebase ID token.
 */
export async function verifyUser(authHeader: string): Promise<string | null> {
  const token = stripBearer(authHeader ?? "");
  if (!token) return null;

  try {
    const { data, error } = await getAdmin().auth.getUser(token);
    if (!error && data.user) return data.user.id;
  } catch {
    /* fall through to Firebase */
  }

  const projectId = firebaseProjectId();
  if (!projectId) return null;
  try {
    const { payload } = await jwtVerify(token, firebaseJwks, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });
    const uid = (payload.sub ?? (payload["user_id"] as string | undefined)) || null;
    return uid;
  } catch {
    return null;
  }
}

const today = () => new Date().toISOString().slice(0, 10);

export type UsageTotals = { messages: number; files: number };

export type UsageResult =
  | { ok: true; usage: UsageTotals }
  | { ok: false; error: string; status: number; usage?: UsageTotals };

async function readUsage(userId: string): Promise<UsageTotals> {
  const { data, error } = await getAdmin()
    .from("usage_daily")
    .select("messages, files")
    .eq("user_id", userId)
    .eq("day", today())
    .maybeSingle();
  if (error) throw new Error(error.message);
  return { messages: Number(data?.["messages"]) || 0, files: Number(data?.["files"]) || 0 };
}

/** Admin-configured limits live client-side today; server falls back to defaults. */
function serverLimits(override?: Partial<UsageTotals>): UsageTotals {
  return {
    messages: Number(override?.messages) || DEFAULT_LIMITS.messages,
    files: Number(override?.files) || DEFAULT_LIMITS.files,
  };
}

export async function getUsageServer(authHeader: string): Promise<UsageResult> {
  const userId = await verifyUser(authHeader);
  if (!userId) return { ok: false, error: "Unauthorized", status: 401 };
  return { ok: true, usage: await readUsage(userId) };
}

export async function addUsageServer(
  authHeader: string,
  delta: { messages?: number; files?: number },
  limitsOverride?: Partial<UsageTotals>,
  unlimited = false,
): Promise<UsageResult> {
  const userId = await verifyUser(authHeader);
  if (!userId) return { ok: false, error: "Unauthorized", status: 401 };

  const current = await readUsage(userId);
  const limits = serverLimits(limitsOverride);
  const next: UsageTotals = {
    messages: current.messages + (delta.messages ?? 0),
    files: current.files + (delta.files ?? 0),
  };

  if (!unlimited && (next.messages > limits.messages || next.files > limits.files)) {
    return { ok: false, error: "Daily limit reached", status: 429, usage: current };
  }

  const { error } = await getAdmin()
    .from("usage_daily")
    .upsert({ user_id: userId, day: today(), ...next }, { onConflict: "user_id,day" });
  if (error) throw new Error(error.message);

  return { ok: true, usage: next };
}

export async function saveExtractionServer(
  authHeader: string,
  sourceName: string | null,
  result: unknown,
): Promise<{ ok: boolean; error?: string }> {
  const userId = await verifyUser(authHeader);
  if (!userId) return { ok: false, error: "Unauthorized" };
  const { error } = await getAdmin()
    .from("extraction_history")
    .insert({ user_id: userId, source_name: sourceName, result: result as never });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
export async function resetUsageServer(authHeader: string): Promise<UsageResult> {
  const userId = await verifyUser(authHeader);
  if (!userId) return { ok: false, error: "Unauthorized", status: 401 };

  const zero: UsageTotals = { messages: 0, files: 0 };
  const { error } = await getAdmin()
    .from("usage_daily")
    .upsert({ user_id: userId, day: today(), ...zero }, { onConflict: "user_id,day" });
  if (error) throw new Error(error.message);

  return { ok: true, usage: zero };
}
export type HistoryRow = {
  id: string;
  created_at: string;
  source_name: string | null;
  result: unknown;
};

export async function getHistoryServer(
  authHeader: string,
  limit = 50,
): Promise<{ ok: boolean; rows: HistoryRow[]; error?: string }> {
  const userId = await verifyUser(authHeader);
  if (!userId) return { ok: false, rows: [], error: "Unauthorized" };
  const { data, error } = await getAdmin()
    .from("extraction_history")
    .select("id, created_at, source_name, result")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 200));
  if (error) return { ok: false, rows: [], error: error.message };
  return { ok: true, rows: (data ?? []) as HistoryRow[] };
}
