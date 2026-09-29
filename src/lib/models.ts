const ADMIN_EMAIL =
  (import.meta.env["VITE_ADMIN_EMAIL"] as string | undefined)?.trim().toLowerCase() ?? "";

/** The owner's account gets unlimited usage instead of the free daily quota. */
export const isAdminEmail = (email?: string | null) =>
  !!ADMIN_EMAIL && (email ?? "").trim().toLowerCase() === ADMIN_EMAIL;

