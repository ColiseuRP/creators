import "server-only";

import { getServerEnvValue } from "@/lib/server-env";
import type { Creator, MetricSubmission, NoticeTargetType, NoticeType } from "@/lib/types";

export interface DiscordSendResult {
  success: boolean;
  status: "sent" | "failed" | "skipped";
  channelId: string | null;
  errorMessage: string | null;
  message: string;
  discordMessageId: string | null;
}

function stringifyDiscordDetail(
  detail: {
    message?: string;
    code?: number | string;
  } | null,
) {
  if (!detail?.message && !detail?.code) {
    return null;
  }

  const parts = [detail.message, detail.code ? `código ${detail.code}` : null].filter(
    Boolean,
  );

  return parts.length > 0 ? `Discord: ${parts.join(" / ")}.` : null;
}

function buildDiscordFailureMessage(
  fallbackMessage: string,
  detail: {
    message?: string;
    code?: number | string;
  } | null,
) {
  const suffix = stringifyDiscordDetail(detail);
  return suffix ? `${fallbackMessage} (${suffix})` : fallbackMessage;
}

function parseDiscordFailure(status: number, rawBody: string) {
  let detail: { code?: number | string; message?: string } | null = null;

  if (rawBody) {
    try {
      detail = JSON.parse(rawBody) as { code?: number | string; message?: string };
    } catch {
      detail = {
        message: rawBody.slice(0, 500),
      };
    }
  }

  if (status === 401) {
    return buildDiscordFailureMessage(
      "A credencial do bot do Discord é inválida ou expirou.",
      detail,
    );
  }

  if (
    status === 403 ||
    detail?.code === 50001 ||
    detail?.code === 50013
  ) {
    return buildDiscordFailureMessage(
      "O bot não tem permissão para enviar mensagens neste canal.",
      detail,
    );
  }

  if (status === 404 || detail?.code === 10003) {
    return buildDiscordFailureMessage("Canal não encontrado no servidor.", detail);
  }

  if (status >= 500) {
    return buildDiscordFailureMessage(
      "Não foi possível conectar ao Discord. Tente novamente.",
      detail,
    );
  }

  return buildDiscordFailureMessage(
    "O Discord recusou o envio da mensagem.",
    detail,
  );
}

export function formatMetricReviewDiscordMessage(
  creator: Creator,
  metric: MetricSubmission,
  decision: "approved" | "rejected",
  reason?: string,
) {
  if (decision === "approved") {
    return [
      "✅ Métrica aprovada!",
      "",
      `Olá, ${creator.name}!`,
      `Sua métrica referente à plataforma ${metric.platform} foi aprovada pela equipe Creators Coliseu.`,
      "",
      `Conteúdo: ${metric.content_url}`,
      "",
      "Continue representando o Coliseu RP com qualidade!",
    ].join("\n");
  }

  return [
    "❌ Métrica negada",
    "",
    `Olá, ${creator.name}.`,
    `Sua métrica referente à plataforma ${metric.platform} foi negada pela equipe Creators Coliseu.`,
    "",
    `Motivo: ${reason || "Não informado pela equipe."}`,
    "",
    "Caso tenha dúvidas, procure o responsável pelos creators.",
  ].join("\n");
}

export function formatNoticeDiscordMessage(
  targetType: NoticeTargetType,
  title: string,
  message: string,
  _type: NoticeType,
) {
  void _type;

  const headerMap: Record<NoticeTargetType, string> = {
    general: "📢 Aviso geral — Creators Coliseu",
    category: "📢 Aviso por categoria — Creators Coliseu",
    individual: "📌 Aviso para você — Creators Coliseu",
  };

  return [
    headerMap[targetType],
    "",
    title,
    "",
    message,
    "",
    "Atenciosamente,",
    "Equipe Coliseu RP",
  ].join("\n");
}

export async function sendDiscordChannelMessage(
  channelId: string | null,
  content: string,
  options?: {
    missingChannelMessage?: string;
  },
): Promise<DiscordSendResult> {
  const discordBotToken = getServerEnvValue("DISCORD_BOT_TOKEN");

  if (!channelId) {
    return {
      success: false,
      status: "failed",
      channelId: null,
      errorMessage:
        options?.missingChannelMessage ?? "Canal de avisos do Discord não configurado.",
      message: "O aviso foi salvo, mas não foi enviado ao Discord.",
      discordMessageId: null,
    };
  }

  if (!discordBotToken) {
    return {
      success: false,
      status: "failed",
      channelId,
      errorMessage: "Token do Discord não configurado.",
      message: "O aviso foi salvo, mas não foi enviado ao Discord.",
      discordMessageId: null,
    };
  }

  try {
    const response = await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bot ${discordBotToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text();

      return {
        success: false,
        status: "failed",
        channelId,
        errorMessage: parseDiscordFailure(response.status, body),
        message: "O aviso foi salvo, mas não foi enviado ao Discord.",
        discordMessageId: null,
      };
    }

    const payload = (await response.json()) as { id?: string };

    return {
      success: true,
      status: "sent",
      channelId,
      errorMessage: null,
      message: "Aviso enviado com sucesso.",
      discordMessageId: payload.id ?? null,
    };
  } catch (error) {
    console.error("[discord] Falha de conexão ao enviar mensagem.", {
      channelId,
      error,
    });

    return {
      success: false,
      status: "failed",
      channelId,
      errorMessage: "Não foi possível conectar ao Discord. Tente novamente.",
      message: "O aviso foi salvo, mas não foi enviado ao Discord.",
      discordMessageId: null,
    };
  }
}
