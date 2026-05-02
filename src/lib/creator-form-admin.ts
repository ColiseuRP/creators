import "server-only";

import { getDiscordChannelIdForPurpose, getDiscordMissingChannelMessage } from "@/lib/discord-channels";
import { upsertDiscordChannelMessage } from "@/lib/discord-admin";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { buildCreatorApplicationFormPanelPayload, CREATOR_APPLICATION_FORM_PANEL_TYPE } from "@/shared/creator-applications";
import {
  createDiscordBotLogRecord,
  getDiscordPanelByType,
  upsertDiscordPanelRecord,
} from "@/shared/discord-ticket-store";

interface CreatorFormPanelPublishResult {
  success: boolean;
  message: string;
  channelId: string | null;
  messageId: string | null;
  error: string | null;
}

async function registerCreatorFormPanelLog(input: {
  type: "creator_form_panel_published" | "creator_form_panel_failed";
  channelId?: string | null;
  status: "success" | "failed";
  message: string;
  errorMessage?: string | null;
}) {
  try {
    await createDiscordBotLogRecord(createSupabaseServiceRoleClient(), {
      type: input.type,
      channelId: input.channelId ?? null,
      status: input.status,
      message: input.message,
      errorMessage: input.errorMessage ?? null,
    });
  } catch (error) {
    console.error("[creator-form-admin] Falha ao registrar log do painel.", error);
  }
}

export async function publishCreatorFormPanel(): Promise<CreatorFormPanelPublishResult> {
  const serviceClient = createSupabaseServiceRoleClient();
  const channelId = getDiscordChannelIdForPurpose("creator_form");

  if (!channelId) {
    const error = getDiscordMissingChannelMessage("creator_form");

    await registerCreatorFormPanelLog({
      type: "creator_form_panel_failed",
      channelId: null,
      status: "failed",
      message: "Falha ao publicar o painel do formulário de creators.",
      errorMessage: error,
    });

    return {
      success: false,
      message: "Não foi possível publicar o painel do formulário. Verifique as permissões do bot.",
      channelId: null,
      messageId: null,
      error,
    };
  }

  try {
    const currentPanel = await getDiscordPanelByType(
      serviceClient,
      CREATOR_APPLICATION_FORM_PANEL_TYPE,
      {
        fallbackToMemory: false,
      },
    );

    let result = await upsertDiscordChannelMessage(
      channelId,
      buildCreatorApplicationFormPanelPayload(),
      currentPanel?.channel_id === channelId ? currentPanel.message_id : null,
    );

    if (!result.success && currentPanel?.message_id) {
      result = await upsertDiscordChannelMessage(
        channelId,
        buildCreatorApplicationFormPanelPayload(),
      );
    }

    if (!result.success || !result.data?.id) {
      const errorMessage =
        result.errorMessage ??
        "Não foi possível publicar o painel do formulário de creators.";

      await registerCreatorFormPanelLog({
        type: "creator_form_panel_failed",
        channelId,
        status: "failed",
        message: "Falha ao publicar o painel do formulário de creators.",
        errorMessage,
      });

      return {
        success: false,
        message: "Não foi possível publicar o painel do formulário. Verifique as permissões do bot.",
        channelId,
        messageId: null,
        error: errorMessage,
      };
    }

    await upsertDiscordPanelRecord(serviceClient, {
      type: CREATOR_APPLICATION_FORM_PANEL_TYPE,
      channelId,
      messageId: result.data.id,
    });

    await registerCreatorFormPanelLog({
      type: "creator_form_panel_published",
      channelId,
      status: "success",
      message: "Painel do formulário publicado com sucesso.",
    });

    return {
      success: true,
      message: "Painel do formulário publicado com sucesso.",
      channelId,
      messageId: result.data.id,
      error: null,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Não foi possível publicar o painel do formulário de creators.";

    await registerCreatorFormPanelLog({
      type: "creator_form_panel_failed",
      channelId,
      status: "failed",
      message: "Falha ao publicar o painel do formulário de creators.",
      errorMessage,
    });

    return {
      success: false,
      message: "Não foi possível publicar o painel do formulário. Verifique as permissões do bot.",
      channelId,
      messageId: null,
      error: errorMessage,
    };
  }
}
