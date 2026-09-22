import { z } from "zod";
import { CHAT_MODELS } from "./models";

const partSchema = z.union([
  z.object({ type: z.literal("text"), text: z.string() }),
  z.object({
    type: z.literal("image_url"),
    image_url: z.object({ url: z.string() }),
  }),
]);

export const chatInputSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.union([z.string(), z.array(partSchema)]),
      }),
    )
    .min(1)
    .max(40),
  /** Optional preferred model id (admin console). Chain still applies after it. */
  model: z.string().max(200).optional(),
  /** Extra field names the user always wants extracted. */
  customFields: z.array(z.string().min(1).max(60)).max(20).optional(),
});

export type ChatInput = z.infer<typeof chatInputSchema>;

const BASE_PROMPT = `You are Zettafry — Bills to Excel, an intelligent invoice data extraction assistant created by Spark, aka Ravi Yadav. Your purpose is to help Indian CA firms and accountants automate their invoice processing.

For any invoice or bill, extract the data and return it in **valid JSON only**, using this schema:

{
  "vendor_name": string | null,
  "vendor_address": string | null,
  "invoice_number": string | null,
  "invoice_date": string | null,
  "due_date": string | null,
  "gst_number": string | null,
  "subtotal": number | null,
  "cgst": number | null,
  "sgst": number | null,
  "igst": number | null,
  "discount": number | null,
  "total_amount": number | null,
  "line_items": [
    {
      "description": string,
      "quantity": number | null,
      "unit_price": number | null,
      "amount": number | null
    }
  ] | null
}

Rules:
1. Only return JSON for invoices. No explanation, no extra text, no markdown fences.
2. If a field is missing, put null. If unsure, put null.
3. Dates must be YYYY-MM-DD. Amounts must be plain numbers (no currency symbols or commas).
4. Never hallucinate data.
5. Ignore irrelevant text like headers, footers, or ads.
6. Understand Indian invoice formats (GST, Tally, Zoho, etc.).
7. If the message contains no invoice or document at all (plain conversation or a question about Zettafry), reply normally in short, clear plain text instead of JSON.
8. If multiple invoices are present, return a JSON array of objects using the same schema.
9. If the user's message explicitly asks for only specific fields or columns (e.g. "only vendor name, amount and date", "sirf GST number aur total chahiye", "just give me the totals"), return ONLY those requested fields in the JSON — omit every other field entirely, don't include them as null. Match the user's wording to the closest matching field name(s) from the full schema (including any custom fields defined below, if present). If the user does not mention specific fields, return the full schema as normal.`;

function buildSystemPrompt(customFields?: string[]) {
  const fields = (customFields ?? [])
    .map((f) => f.trim())
    .filter(Boolean)
    .slice(0, 20);
  if (!fields.length) return BASE_PROMPT;
  return `${BASE_PROMPT}

Additional custom fields the user always wants extracted: ${fields
    .map((f) => `"${f}"`)
    .join(", ")}.
Return these inside a "custom_fields" object in the JSON, e.g. "custom_fields": { "${fields[0]}": value }. Use null when a custom field is not found. These custom fields are also subject to rule 9 — if the user asks for only specific fields in a message, include a custom field only if it was explicitly requested too.`;
}

export type ChatResult =
  | { ok: true; text: string; model: string; attempts: string[] }
  | { ok: false; error: string; attempts: string[] };

const ENDPOINT = "https://router.huggingface.co/v1/chat/completions";

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
/** Groq's vision-capable model. Override with GROQ_MODEL if the id changes. */
const GROQ_MODEL = "qwen/qwen3.6-27b";
/** Groq caps image parts per request for this model. */
const GROQ_MAX_IMAGES = 5;

const GEMINI_MODEL = "gemini-2.5-flash-lite";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type CallOut =
  | { text: string }
  | { error: string; retryable: boolean; rateLimited?: boolean };


/** Converts the OpenAI-style messages into Gemini contents (inline base64 parts). */
function toGeminiContents(data: ChatInput) {
  return data.messages
    .filter((m) => m.role !== "system")
    .map((m) => {
      const parts: Array<
        { text: string } | { inlineData: { mimeType: string; data: string } }
      > = [];
      if (typeof m.content === "string") {
        if (m.content.trim()) parts.push({ text: m.content });
      } else {
        for (const p of m.content) {
          if (p.type === "text") {
            if (p.text.trim()) parts.push({ text: p.text });
          } else {
            const url = p.image_url.url;
            const match = /^data:([^;]+);base64,(.*)$/s.exec(url);
            if (match) {
              parts.push({
                inlineData: { mimeType: match[1] ?? "image/png", data: match[2] ?? "" },
              });
            } else {
              parts.push({ text: `[image: ${url}]` });
            }
          }
        }
      }
      if (!parts.length) parts.push({ text: "" });
      return { role: m.role === "assistant" ? "model" : "user", parts };
    });
}

/** Calls Gemini and normalizes the reply into the same { text } shape as HF. */
async function callGemini(data: ChatInput, key: string): Promise<CallOut> {
  let res: Response;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": key,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: buildSystemPrompt(data.customFields) }],
          },
          contents: toGeminiContents(data),
          generationConfig: { maxOutputTokens: 2000 },
        }),
      },
    );
  } catch {
    return { error: "Network error reaching Gemini", retryable: true };
  }

  if (!res.ok) {
    const body = await res.text();
    if (res.status === 401 || res.status === 403) {
      return {
        error: "The Gemini key was rejected — check GEMINI_API_KEY.",
        retryable: true,
      };
    }
    return {
      error: `Gemini failed (${res.status}). ${body.slice(0, 200)}`,
      retryable: true,
      ...(res.status === 429 ? { rateLimited: true } : {}),
    } as CallOut;
  }

  const json = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = (json.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? "")
    .join("")
    .trim();
  if (!text) return { error: "Gemini returned an empty answer", retryable: true };
  return { text };
}

async function callModel(
  model: string,
  data: ChatInput,
  token: string,
): Promise<CallOut> {
  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: buildSystemPrompt(data.customFields) },
          ...data.messages,
        ],
        max_tokens: 1500,
      }),
    });
  } catch {
    return { error: "Network error reaching the AI provider", retryable: true };
  }

  if (!res.ok) {
    const body = await res.text();
    if (res.status === 401) {
      return { error: "The AI token was rejected — check HF_TOKEN.", retryable: false };
    }
    return {
      error: `${model} failed (${res.status}). ${body.slice(0, 200)}`,
      retryable: true,
    };
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = json.choices?.[0]?.message?.content ?? "";
  if (!text.trim()) {
    return { error: `${model} returned an empty answer`, retryable: true };
  }
  return { text };
}

/** Counts the base64/url image parts in the conversation. */
function countImages(data: ChatInput) {
  let n = 0;
  for (const m of data.messages) {
    if (typeof m.content !== "string") {
      for (const p of m.content) if (p.type === "image_url") n++;
    }
  }
  return n;
}

/** Returns a copy of the input keeping only images with index in [from, to). */
function sliceImages(data: ChatInput, from: number, to: number): ChatInput {
  let i = 0;
  const messages = data.messages.map((m) => {
    if (typeof m.content === "string") return m;
    const content = m.content.filter((p) => {
      if (p.type !== "image_url") return true;
      const keep = i >= from && i < to;
      i++;
      return keep;
    });
    return { ...m, content: content.length ? content : "" };
  });
  return { ...data, messages } as ChatInput;
}

/** Parses a model reply into JSON when possible (strips markdown fences). */
function parseLoose(text: string): unknown | undefined {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return undefined;
  }
}

/** Merges several batch replies into a single JSON array (or plain text). */
function mergeTexts(texts: string[]): string {
  if (texts.length === 1) return texts[0] ?? "";
  const rows: unknown[] = [];
  const plain: string[] = [];
  for (const t of texts) {
    const parsed = parseLoose(t);
    if (parsed === undefined) plain.push(t.trim());
    else if (Array.isArray(parsed)) rows.push(...parsed);
    else rows.push(parsed);
  }
  if (rows.length && !plain.length) return JSON.stringify(rows, null, 2);
  if (!rows.length) return plain.join("\n\n");
  return `${JSON.stringify(rows, null, 2)}\n\n${plain.join("\n\n")}`;
}

/** One Groq chat-completions request (OpenAI-compatible, JSON mode). */
async function callGroqOnce(
  data: ChatInput,
  key: string,
  model: string,
): Promise<CallOut> {
  let res: Response;
  try {
    res = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: buildSystemPrompt(data.customFields) },
          ...data.messages,
        ],
        max_tokens: 1500,
        response_format: { type: "json_object" },
      }),
    });
  } catch {
    return { error: "Network error reaching Groq", retryable: true };
  }

  if (!res.ok) {
    const body = await res.text();
    if (res.status === 401 || res.status === 403) {
      return {
        error: "The Groq key was rejected — check GROQ_API_KEY.",
        retryable: true,
      };
    }
    return {
      error: `Groq failed (${res.status}). ${body.slice(0, 200)}`,
      retryable: true,
      rateLimited: res.status === 429,
    };
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = json.choices?.[0]?.message?.content ?? "";
  if (!text.trim()) return { error: "Groq returned an empty answer", retryable: true };
  return { text };
}

/**
 * Calls Groq, batching images 5 at a time (its per-request limit) and merging
 * the batch replies, with one 1.5s exponential-backoff retry on a 429.
 */
async function callGroq(data: ChatInput, key: string, model: string): Promise<CallOut> {
  const images = countImages(data);
  const batches =
    images > GROQ_MAX_IMAGES ? Math.ceil(images / GROQ_MAX_IMAGES) : 1;

  const texts: string[] = [];
  for (let b = 0; b < batches; b++) {
    const input =
      batches === 1
        ? data
        : sliceImages(data, b * GROQ_MAX_IMAGES, (b + 1) * GROQ_MAX_IMAGES);

    let out = await callGroqOnce(input, key, model);
    if ("error" in out && out.rateLimited) {
      await sleep(1500);
      out = await callGroqOnce(input, key, model);
    }
    if ("error" in out) return out;
    texts.push(out.text);
  }

  return { text: mergeTexts(texts) };
}

export async function runChat(data: ChatInput): Promise<ChatResult> {
  const token = process.env["HF_TOKEN"];
  const groqKey = process.env["GROQ_API_KEY"];
  const groqModel = process.env["GROQ_MODEL"] || GROQ_MODEL;

  if (!token && !groqKey) {
    return {
      ok: false,
      attempts: [],
      error:
        "AI is not configured yet — add the GROQ_API_KEY (or HF_TOKEN) environment variable and reload.",
    };
  }

  const attempts: string[] = [];
  let lastError = "All models are unavailable right now — try again shortly.";

  // Primary provider: Groq.
  if (groqKey && !data.model) {
    attempts.push(`groq:${groqModel}`);
    const out = await callGroq(data, groqKey, groqModel);
    if ("text" in out) {
      return { ok: true, text: out.text, model: `groq:${groqModel}`, attempts };
    }
    lastError = out.error;
  }

  if (!token) return { ok: false, error: lastError, attempts };

  // Fallback chain: the existing Hugging Face models, in their current order.
  const chain = CHAT_MODELS.map((m) => m.id);
  const order = data.model
    ? [data.model, ...chain.filter((m) => m !== data.model)]
    : chain;

  for (const model of order) {
    attempts.push(model);
    const out = await callModel(model, data, token);
    if ("text" in out) return { ok: true, text: out.text, model, attempts };
    lastError = out.error;
    if (!out.retryable) break;
  }

  return { ok: false, error: lastError, attempts };
}

