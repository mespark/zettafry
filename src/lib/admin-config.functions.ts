import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getConfigFn = createServerFn({ method: "GET" }).handler(async () => {
  const { getConfigServer } = await import("./admin-config.server");
  return getConfigServer();
});

export const setConfigFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        authHeader: z.string().min(1),
        preferredModel: z.string().nullable().optional(),
        messages: z.number().int().positive().optional(),
        files: z.number().int().positive().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { setConfigServer } = await import("./admin-config.server");
    return setConfigServer(data.authHeader, {
      preferredModel: data.preferredModel,
      messages: data.messages,
      files: data.files,
    });
  });
