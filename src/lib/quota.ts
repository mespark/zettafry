export const DEFAULT_LIMITS = { messages: 25, files: 5 };

export type Usage = { day: string; messages: number; files: number };

const key = (userId: string) => `vyom.usage.${userId}`;
const overrideKey = "vyom.limits.override";

export const today = () => new Date().toISOString().slice(0, 10);

export function getLimits(): { messages: number; files: number } {
  if (typeof window === "undefined") return DEFAULT_LIMITS;
  try {
    const raw = window.localStorage.getItem(overrideKey);
    if (!raw) return DEFAULT_LIMITS;
    const parsed = JSON.parse(raw) as Partial<typeof DEFAULT_LIMITS>;
    return {
      messages: Number(parsed.messages) || DEFAULT_LIMITS.messages,
      files: Number(parsed.files) || DEFAULT_LIMITS.files,
    };
  } catch {
    return DEFAULT_LIMITS;
  }
}

export function setLimits(limits: { messages: number; files: number }) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(overrideKey, JSON.stringify(limits));
}

export function getUsage(userId: string): Usage {
  const fresh: Usage = { day: today(), messages: 0, files: 0 };
  if (typeof window === "undefined") return fresh;
  try {
    const raw = window.localStorage.getItem(key(userId));
    if (!raw) return fresh;
    const parsed = JSON.parse(raw) as Usage;
    if (parsed.day !== today()) return fresh;
    return {
      day: parsed.day,
      messages: Number(parsed.messages) || 0,
      files: Number(parsed.files) || 0,
    };
  } catch {
    return fresh;
  }
}

export function saveUsage(userId: string, usage: Usage) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key(userId), JSON.stringify(usage));
  } catch {
    /* ignore */
  }
}

export function resetUsage(userId: string) {
  saveUsage(userId, { day: today(), messages: 0, files: 0 });
}

export function addUsage(userId: string, delta: { messages?: number; files?: number }) {
  const current = getUsage(userId);
  const next: Usage = {
    day: today(),
    messages: current.messages + (delta.messages ?? 0),
    files: current.files + (delta.files ?? 0),
  };
  saveUsage(userId, next);
  return next;
}

/** Seconds until the daily reset at local midnight. */
export function msUntilReset() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next.getTime() - now.getTime();
}

export function formatReset() {
  const ms = msUntilReset();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
