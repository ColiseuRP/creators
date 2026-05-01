import "server-only";

import { env, isDiscordConfigured } from "@/lib/env";
import type { Creator, MetricSubmission, NoticeType } from "@/lib/types";

export interface DiscordSendResult {
  status: "sent" | "failed" | "skipped";
  channelId: string | null;
  errorMessage: string | null;
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
      status: "skipped",
      channelId: null,
      errorMessage: "Sala do Discord nao configurada para este destino.",
    };
  }

  if (!isDiscordConfigured) {
    return {
      status: "skipped",
      channelId,
      errorMessage: "A integracao com o Discord ainda nao esta pronta neste ambiente.",
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
      errorMessage: body.slice(0, 500) || "O Discord retornou um erro sem detalhes.",
    };
  }

  return {
    status: "sent",
    channelId,
    errorMessage: null,
  };
}
