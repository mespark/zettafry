import { createServerFn } from "@tanstack/react-start";
import { chatInputSchema, runChat } from "./chat.server";

export const sendChat = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => chatInputSchema.parse(data))
  .handler(async ({ data }) => runChat(data));
