export type Attachment = {
  kind: "image" | "text";
  name: string;
  /** data URL for images, extracted text for text files */
  data: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  attachments?: Attachment[];
  error?: boolean;
  createdAt: number;
};

export type Thread = {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
};

const keyFor = (userId: string) => `vyom.threads.${userId}`;

export const uid = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export function loadThreads(userId: string): Thread[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(keyFor(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Thread[];
    if (!Array.isArray(parsed)) return [];
    return parsed.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export function saveThreads(userId: string, threads: Thread[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(keyFor(userId), JSON.stringify(threads));
  } catch {
    /* quota — ignore */
  }
}

export function newThread(): Thread {
  return { id: uid(), title: "New chat", messages: [], updatedAt: Date.now() };
}

export function titleFrom(text: string, attachments?: Attachment[]): string {
  const base = text.trim() || attachments?.[0]?.name || "New chat";
  return base.length > 42 ? `${base.slice(0, 42)}…` : base;
}
