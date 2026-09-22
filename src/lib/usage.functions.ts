import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const authOnly = z.object({ authHeader: z.string().min(1) });

export const getUsageFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => authOnly.parse(data))
  .handler(async ({ data }) => {
    const { getUsageServer } = await import("./usage.server");
    return getUsageServer(data.authHeader);
  });

export const addUsageFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    authOnly
      .extend({
        delta: z.object({ messages: z.number().int().min(0).max(50).optional(), files: z.number().int().min(0).max(50).optional() }),
        limits: z.object({ messages: z.number().int().positive(), files: z.number().int().positive() }).optional(),
        unlimited: z.boolean().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { addUsageServer } = await import("./usage.server");
    return addUsageServer(data.authHeader, data.delta, data.limits, data.unlimited ?? false);
  });

export const resetUsageFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => authOnly.parse(data))
  .handler(async ({ data }) => {
    const { resetUsageServer } = await import("./usage.server");
    return resetUsageServer(data.authHeader);
  });

export const saveExtractionFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    authOnly.extend({ sourceName: z.string().max(300).nullable(), result: z.unknown() }).parse(data),
  )
  .handler(async ({ data }) => {
    const { saveExtractionServer } = await import("./usage.server");
    return saveExtractionServer(data.authHeader, data.sourceName, data.result);
  });

export const getHistoryFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => authOnly.extend({ limit: z.number().int().optional() }).parse(data))
  .handler(async ({ data }) => {
    const { getHistoryServer } = await import("./usage.server");
    return getHistoryServer(data.authHeader, data.limit ?? 50);
  });
