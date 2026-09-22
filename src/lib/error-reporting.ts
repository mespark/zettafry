// Local error logging helper.
export function reportAppError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof console === "undefined") return;
  console.error("App error:", error, context);
}
