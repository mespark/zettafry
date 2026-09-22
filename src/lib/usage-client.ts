import { getSupabase } from "./supabase";
import { getFirebaseAuth } from "./firebase";
import { addUsageFn, getHistoryFn, getUsageFn, resetUsageFn, saveExtractionFn } from "./usage.functions";

/** Access token for whichever provider the user signed in with. */
export async function getAuthToken(): Promise<string | null> {
  const supabase = getSupabase();
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) return token;
  }
  const auth = getFirebaseAuth();
  const fbUser = auth?.currentUser;
  if (fbUser) return fbUser.getIdToken();
  return null;
}

export type UsageTotals = { messages: number; files: number };

export async function fetchUsage(): Promise<UsageTotals | null> {
  const authHeader = await getAuthToken();
  if (!authHeader) return null;
  const res = await getUsageFn({ data: { authHeader } });
  return res.ok ? res.usage : null;
}

export async function spendUsage(
  delta: { messages?: number; files?: number },
  opts: { limits: UsageTotals; unlimited?: boolean },
): Promise<{ ok: boolean; usage: UsageTotals | null; error?: string }> {
  const authHeader = await getAuthToken();
  if (!authHeader) return { ok: false, usage: null, error: "Unauthorized" };
  const res = await addUsageFn({
    data: { authHeader, delta, limits: opts.limits, unlimited: opts.unlimited ?? false },
  });
  if (res.ok) return { ok: true, usage: res.usage };
  return { ok: false, usage: res.usage ?? null, error: res.error };
}

export async function resetUsage(): Promise<UsageTotals | null> {
  const authHeader = await getAuthToken();
  if (!authHeader) return null;
  const res = await resetUsageFn({ data: { authHeader } });
  return res.ok ? res.usage : null;
}

export async function saveExtraction(sourceName: string | null, result: unknown) {
  const authHeader = await getAuthToken();
  if (!authHeader) return;
  try {
    await saveExtractionFn({ data: { authHeader, sourceName, result } });
  } catch {
    /* history is best-effort */
  }
}

export async function fetchHistory(limit = 50) {
  const authHeader = await getAuthToken();
  if (!authHeader) return [];
  const res = await getHistoryFn({ data: { authHeader, limit } });
  return res.rows;
}
