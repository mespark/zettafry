export type Provider = "groq" | "gemini" | "openrouter";

export type UserApiKey = {
  provider: Provider;
  apiKey: string;
  /** Required for OpenRouter, optional override for Groq/Gemini. */
  model?: string;
};

const STORAGE_KEY = "zettafry.user_api_key";

export function getUserApiKey(): UserApiKey | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserApiKey;
    if (!parsed.provider || !parsed.apiKey) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setUserApiKey(key: UserApiKey) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(key));
}

export function clearUserApiKey() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
