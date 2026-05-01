import "server-only";

import { env } from "@/lib/env";
import type { Creator, MetricSubmission, NoticeType } from "@/lib/types";

export interface DiscordSendResult {
  status: "sent" | "failed" | "skipped";
  channelId: string | null;
  errorMessage: string | null;
}

function parseDiscordErrorMessage(rawBody: string) {
  if (!rawBody) {
    return "O Discord nao retornou detalhes sobre a falha.";
  }

  try {
    const parsed = JSON.parse(rawBody) as {
      code?: number | string;
      message?: string;
    };

    const parts = [parsed.message, parsed.code ? `codigo ${parsed.code}` : null].filter(
      Boolean,
    );

    if (parts.length > 0) {
      return `Discord: ${parts.join(" / ")}.`;
    }
  } catch {
    // Mantem o corpo bruto abaixo quando nao vier em JSON.
  }

  return rawBody.slice(0, 500);
}

export function formatMetricReviewDiscordMessage(
  creator: Creator,
  metric: MetricSubmission,
  decision: "approved" | "rejected",
  reason?: string,
) {
  const headline =
    decision === "approved"
      ? `Metrica aprovada. Continue representando o Coliseu!`
      : `Metrica negada. Confira a orientacao da equipe para reenviar.`;

  const reasonLine = reason ? `\nMotivo informado pela equipe: ${reason}` : "";

  return [
    `Ola, ${creator.name}!`,
    headline,
    `Conteudo analisado: ${metric.content_type} em ${metric.platform}.`,
    reasonLine,
  ]
    .join("\n")
    .trim();
}

export function formatNoticeDiscordMessage(
  title: string,
  message: string,
  type: NoticeType,
) {
  const prefixMap: Record<NoticeType, string> = {
    info: "[Aviso Coliseu]",
    success: "[Atualizacao Coliseu]",
    warning: "[Atencao Coliseu]",
  };

  return `${prefixMap[type]} ${title}\n${message}`;
}

export async function sendDiscordChannelMessage(
  channelId: string | null,
  content: string,
): Promise<DiscordSendResult> {
  if (!channelId) {
    return {
      status: "failed",
      channelId: null,
      errorMessage: "Nenhum canal de destino foi configurado para este envio.",
    };
  }

  if (!env.DISCORD_BOT_TOKEN) {
    return {
      status: "failed",
      channelId,
      errorMessage: "A variavel DISCORD_BOT_TOKEN nao foi carregada no servidor.",
    };
  }

  const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content,
    }),
  });

  if (!response.ok) {
    const body = await response.text();

    return {
      status: "failed",
      channelId,
      errorMessage: parseDiscordErrorMessage(body),
    };
  }

  return {
    status: "sent",
    channelId,
    errorMessage: null,
  };
}
