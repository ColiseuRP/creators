import "server-only";

import { getDiscordChannelIdForPurpose, getDiscordMissingChannelMessage } from "@/lib/discord-channels";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { getServerEnvValue } from "@/lib/server-env";
import {
  createDiscordBotLogRecord,
  getDiscordPanelByType,
  upsertDiscordPanelRecord,
} from "@/shared/discord-ticket-store";
import {
  buildTicketPanelPayload,
  CREATOR_TICKET_PANEL_TYPE,
} from "@/shared/discord-ticketing";

interface TicketPanelPublishResult {
  success: boolean;
  message: string;
  channelId: string | null;
  messageId: string | null;
  error: string | null;
}

function buildDiscordPanelFailureMessage(status: number, rawBody: string) {
  let detailMessage: string | null = null;
  let detailCode: number | string | null = null;

  if (rawBody) {
    try {
      const payload = JSON.parse(rawBody) as { message?: string; code?: number | string };
      detailMessage = payload.message ?? null;
      detailCode = payload.code ?? null;
    } catch {
      detailMessage = rawBody.slice(0, 400);
    }
  }

  const detailSuffix =
    detailMessage || detailCode
      ? ` (${[detailMessage, detailCode ? `código ${detailCode}` : null]
          .filter(Boolean)
          .join(" / ")})`
      : "";

  if (status === 401) {
    return `Token do Discord não configurado ou inválido.${detailSuffix}`;
  }

  if (status === 403) {
    return `O bot não tem permissão para publicar o painel neste canal.${detailSuffix}`;
  }

  if (status === 404) {
    return `Canal de tickets não encontrado no servidor.${detailSuffix}`;
  }

  if (status >= 500) {
    return `Não foi possível conectar ao Discord. Tente novamente.${detailSuffix}`;
  }

  return `O Discord recusou a publicação do painel.${detailSuffix}`;
}

async function requestDiscordPanelMessage(input: {
  token: string;
  channelId: string;
  messageId?: string | null;
}) {
  const body = buildTicketPanelPayload();
  const endpoint = input.messageId
    ? `https://discord.com/api/v10/channels/${input.channelId}/messages/${input.messageId}`
    : `https://discord.com/api/v10/channels/${input.channelId}/messages`;
  const method = input.messageId ? "PATCH" : "POST";

  const response = await fetch(endpoint, {
    method,
    headers: {
      Authorization: `Bot ${input.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const rawBody = await response.text();
    throw new Error(buildDiscordPanelFailureMessage(response.status, rawBody));
  }

  const payload = (await response.json()) as { id?: string };
  return payload.id ?? null;
}

export async function publishCreatorTicketPanel(): Promise<TicketPanelPublishResult> {
  const serviceClient = createSupabaseServiceRoleClient();
  const discordBotToken = getServerEnvValue("DISCORD_BOT_TOKEN");
  const channelId = getDiscordChannelIdForPurpose("ticket");

  if (!channelId) {
    return {
      success: false,
      message: "Não foi possível publicar o painel de tickets.",
      channelId: null,
      messageId: null,
      error: getDiscordMissingChannelMessage("ticket"),
    };
  }

  if (!discordBotToken) {
    return {
      success: false,
      message: "Não foi possível publicar o painel de tickets.",
      channelId,
      messageId: null,
      error: "Token do Discord não configurado.",
    };
  }

  try {
    const currentPanel = await getDiscordPanelByType(serviceClient, CREATOR_TICKET_PANEL_TYPE);
    let messageId: string | null = null;

    try {
      messageId = await requestDiscordPanelMessage({
        token: discordBotToken,
        channelId,
        messageId: currentPanel?.channel_id === channelId ? currentPanel.message_id : null,
      });
    } catch (error) {
      if (currentPanel?.message_id) {
        messageId = await requestDiscordPanelMessage({
          token: discordBotToken,
          channelId,
        });
      } else {
        throw error;
      }
    }

    if (!messageId) {
      throw new Error("O Discord não retornou o identificador da mensagem do painel.");
    }

    await upsertDiscordPanelRecord(serviceClient, {
      type: CREATOR_TICKET_PANEL_TYPE,
      channelId,
      messageId,
    });

    await createDiscordBotLogRecord(serviceClient, {
      type: "ticket_panel_published",
      channelId,
      status: "success",
      message: "Painel de tickets publicado com sucesso.",
    });

    return {
      success: true,
      message: "Painel de tickets publicado com sucesso.",
      channelId,
      messageId,
      error: null,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Não foi possível publicar o painel de tickets.";

    try {
      await createDiscordBotLogRecord(serviceClient, {
        type: "ticket_panel_published",
        channelId,
        status: "failed",
        message: "Falha ao publicar o painel de tickets.",
        errorMessage,
      });
    } catch (logError) {
      console.error("[discord-ticket-admin] Falha ao salvar log do painel.", logError);
    }

    return {
      success: false,
      message: "Não foi possível publicar o painel de tickets.",
      channelId,
      messageId: null,
      error: errorMessage,
    };
  }
}
