import { createDiscordBotLogRecord } from "../../shared/discord-ticket-store";
import type { CreatorTicketType } from "../../lib/types";
import type { BotContext } from "../types";
import { logBotError } from "./logger";

interface BotLogInput {
  type: string;
  discordUserId?: string | null;
  discordUsername?: string | null;
  channelId?: string | null;
  ticketId?: string | null;
  ticketType?: CreatorTicketType | null;
  applicationId?: string | null;
  actionBy?: string | null;
  status: "success" | "failed" | "info";
  message: string;
  errorMessage?: string | null;
}

export async function dispatchBotLog(context: BotContext, input: BotLogInput) {
  try {
    await createDiscordBotLogRecord(context.supabase, {
      type: input.type,
      discordUserId: input.discordUserId ?? null,
      discordUsername: input.discordUsername ?? null,
      channelId: input.channelId ?? null,
      ticketId: input.ticketId ?? null,
      ticketType: input.ticketType ?? null,
      applicationId: input.applicationId ?? null,
      actionBy: input.actionBy ?? null,
      status: input.status,
      message: input.message,
      errorMessage: input.errorMessage ?? null,
    });
  } catch (error) {
    logBotError("Falha ao registrar log do bot no Supabase.", error);
  }
}
