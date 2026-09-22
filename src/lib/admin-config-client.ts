import { getAuthToken } from "./usage-client";
import { getConfigFn, setConfigFn } from "./admin-config.functions";

export type AppConfig = {
  preferredModel: string | null;
  limits: { messages: number; files: number };
};

/** Public — no auth needed. Every visitor needs the current model/limits. */
export async function fetchConfig(): Promise<AppConfig> {
  return getConfigFn();
}

/** Admin-only — server re-checks the email, this is just the client call. */
export async function saveConfig(
  patch: Partial<{ preferredModel: string | null; messages: number; files: number }>,
): Promise<{ ok: boolean; config?: AppConfig; error?: string }> {
  const authHeader = await getAuthToken();
  if (!authHeader) return { ok: false, error: "Not signed in" };
  const res = await setConfigFn({ data: { authHeader, ...patch } });
  if (res.ok) return { ok: true, config: res.config };
  return { ok: false, error: res.error };
}
