export type ModelInfo = {
  id: string;
  label: string;
  note: string;
  /** false = document specialist that the HF chat router cannot serve. */
  chat?: boolean;
};

/** Fallback chain — tried in order until one answers. */
export const MODEL_CHAIN: ModelInfo[] = [
  {
    id: "Qwen/Qwen3-VL-8B-Instruct:featherless-ai",
    label: "Qwen3-VL 8B",
    note: "Primary — best all-round invoice + image reading",
    chat: true,
  },
  {
    id: "meta-llama/Llama-4-Scout-17B-16E-Instruct",
    label: "Llama 4 Scout 17B",
    note: "Fallback 2 — strong vision + long documents",
    chat: true,
  },
  {
    id: "google/gemma-3-27b-it",
    label: "Gemma 3 27B",
    note: "Fallback 3 — Google multimodal, good on scans",
    chat: true,
  },
  {
    id: "zai-org/GLM-4.5V",
    label: "GLM-4.5V",
    note: "Fallback 4 — vision reasoning backup",
    chat: true,
  },
  {
    id: "microsoft/Florence-2-large",
    label: "Florence-2 Large",
    note: "Specialist OCR / layout — needs a dedicated inference endpoint, not the chat router",
    chat: false,
  },
  {
    id: "microsoft/layoutlmv3-base",
    label: "LayoutLMv3 Base",
    note: "Specialist document layout — needs fine-tuning + a dedicated endpoint",
    chat: false,
  },
  {
    id: "naver-clova-ix/donut-base",
    label: "Donut Base",
    note: "Specialist OCR-free parsing — needs a dedicated endpoint",
    chat: false,
  },
];

export const CHAT_MODELS = MODEL_CHAIN.filter((m) => m.chat !== false);

const ADMIN_EMAIL = (import.meta.env["VITE_ADMIN_EMAIL"] as string | undefined)
  ?.trim()
  .toLowerCase() ?? "";

export const isAdminEmail = (email?: string | null) =>
  !!ADMIN_EMAIL && (email ?? "").trim().toLowerCase() === ADMIN_EMAIL;

/** localStorage key holding the admin's preferred first model. */
export const MODEL_PREF_KEY = "vyom.model.pref";

export const isAdminEmail = (email?: string | null) =>
  (email ?? "").trim().toLowerCase() === ADMIN_EMAIL;
