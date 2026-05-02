import { ChannelType, type TextChannel } from "discord.js";

import { getDiscordPanelByType, upsertDiscordPanelRecord } from "../../shared/discord-ticket-store";
import {
  buildTicketPanelPayload,
  CREATOR_TICKET_PANEL_TYPE,
} from "../../shared/discord-ticketing";
import { dispatchBotLog } from "./log-dispatcher";
import { logBotError } from "./logger";
import type { BotContext } from "../types";

interface PublishPanelResult {
  success: boolean;
  message: string;
  channelId: string | null;
  messageId: string | null;
  errorMessage: string | null;
}

async function getTextChannel(context: BotContext, channelId: string) {
  const channel = await context.client.channels.fetch(channelId);

  if (!channel || channel.type !== ChannelType.GuildText) {
    throw new Error("Canal do Discord não encontrado ou indisponível para o bot.");
  }

  return channel as TextChannel;
}

export async function publishCreatorTicketPanelFromBot(
  context: BotContext,
): Promise<PublishPanelResult> {
  try {
    const channel = await getTextChannel(context, context.config.ticketChannelId);
    const currentPanel = await getDiscordPanelByType(
      context.supabase,
      CREATOR_TICKET_PANEL_TYPE,
      {
        fallbackToMemory: false,
      },
    );

    let messageId: string | null = null;

    if (currentPanel?.channel_id === channel.id) {
      try {
        const currentMessage = await channel.messages.fetch(currentPanel.message_id);
        const updatedMessage = await currentMessage.edit(buildTicketPanelPayload());
        messageId = updatedMessage.id;
      } catch {
        messageId = null;
      }
    }

    if (!messageId) {
      const createdMessage = await channel.send(buildTicketPanelPayload());
      messageId = createdMessage.id;
    }

    await upsertDiscordPanelRecord(context.supabase, {
      type: CREATOR_TICKET_PANEL_TYPE,
      channelId: channel.id,
      messageId,
    });

    await dispatchBotLog(context, {
      type: "ticket_panel_published",
      channelId: channel.id,
      status: "success",
      message: "Painel de tickets publicado com sucesso.",
    });

    return {
      success: true,
      message: "Painel de tickets publicado com sucesso.",
      channelId: channel.id,
      messageId,
      errorMessage: null,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logBotError("Não foi possível publicar o painel de tickets.", error);

    await dispatchBotLog(context, {
      type: "ticket_panel_failed",
      channelId: context.config.ticketChannelId,
      status: "failed",
      message: "Não foi possível publicar o painel de tickets.",
      errorMessage,
    });

    return {
      success: false,
      message: "Não foi possível publicar o painel de tickets.",
      channelId: context.config.ticketChannelId,
      messageId: null,
      errorMessage,
    };
  }
}
