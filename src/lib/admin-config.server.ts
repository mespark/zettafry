import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { isAdminEmail } from "./models";
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
 * Returns the verified email for the given Authorization header, or null.
 * Tries Supabase Auth first, then a Firebase ID token — same dual-provider
 * pattern as usage.server.ts's verifyUser, but returns email instead of id
 * since the admin check is email-based (see ADMIN_EMAIL in models.ts).
 */
async function verifyEmail(authHeader: string): Promise<string | null> {
  const token = stripBearer(authHeader ?? "");
  if (!token) return null;

  try {
    const { data, error } = await getAdmin().auth.getUser(token);
    if (!error && data.user?.email) return data.user.email;
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
    return (payload["email"] as string | undefined) ?? null;
  } catch {
    return null;
  }
}

async function verifyAdmin(authHeader: string): Promise<boolean> {
  const email = await verifyEmail(authHeader);
  return !!email && email.trim().toLowerCase() === ADMIN_EMAIL;
}

export type AppConfig = {
  preferredModel: string | null;
  limits: { messages: number; files: number };
};

const ROW_ID = "default";

/** Public read — every user needs the current model/limits to operate. No auth required. */
export async function getConfigServer(): Promise<AppConfig> {
  const { data, error } = await getAdmin()
    .from("app_config")
    .select("preferred_model, message_limit, file_limit")
    .eq("id", ROW_ID)
    .maybeSingle();

  if (error || !data) {
    return { preferredModel: null, limits: DEFAULT_LIMITS };
  }
  return {
    preferredModel: (data["preferred_model"] as string | null) ?? null,
    limits: {
      messages: Number(data["message_limit"]) || DEFAULT_LIMITS.messages,
      files: Number(data["file_limit"]) || DEFAULT_LIMITS.files,
    },
  };
}

export type SetConfigResult =
  | { ok: true; config: AppConfig }
  | { ok: false; error: string; status: number };

/** Admin-only write. Rejects with 403 if the caller isn't the Vyom owner account. */
export async function setConfigServer(
  authHeader: string,
  patch: Partial<{ preferredModel: string | null; messages: number; files: number }>,
): Promise<SetConfigResult> {
  const isAdmin = await verifyAdmin(authHeader);
  if (!isAdmin) return { ok: false, error: "Admin access only", status: 403 };

  const current = await getConfigServer();
  const next = {
    preferred_model:
      patch.preferredModel !== undefined ? patch.preferredModel : current.preferredModel,
    message_limit: patch.messages ?? current.limits.messages,
    file_limit: patch.files ?? current.limits.files,
  };

  const { error } = await getAdmin()
    .from("app_config")
    .upsert({ id: ROW_ID, ...next, updated_at: new Date().toISOString() }, { onConflict: "id" });
  if (error) return { ok: false, error: error.message, status: 500 };

  return {
    ok: true,
    config: {
      preferredModel: next.preferred_model,
      limits: { messages: next.message_limit, files: next.file_limit },
    },
  };
}
