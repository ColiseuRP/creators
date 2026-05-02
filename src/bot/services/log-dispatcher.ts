import { createDiscordBotLogRecord } from "../../shared/discord-ticket-store";
import type { BotContext } from "../types";
import { logBotError } from "./logger";

interface BotLogInput {
  type: string;
  discordUserId?: string | null;
  channelId?: string | null;
  status: "success" | "failed" | "info";
  message: string;
  errorMessage?: string | null;
}

export async function dispatchBotLog(context: BotContext, input: BotLogInput) {
  try {
    await createDiscordBotLogRecord(context.supabase, {
      type: input.type,
      discordUserId: input.discordUserId ?? null,
      channelId: input.channelId ?? null,
      status: input.status,
      message: input.message,
      errorMessage: input.errorMessage ?? null,
    });
  } catch (error) {
    logBotError("Falha ao registrar log do bot no Supabase.", error);
  }
}
