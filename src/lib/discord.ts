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
      ? `A métrica de ${metric.platform} foi aprovada.`
      : `A métrica de ${metric.platform} foi negada.`;

  const reasonLine = reason ? `\nObservação: ${reason}` : "";

  return [
    `Olá, ${creator.name}!`,
    headline,
    `Conteúdo: ${metric.content_type} em ${metric.content_date}.`,
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
    info: "[Aviso]",
    success: "[Atualização]",
    warning: "[Atenção]",
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
      errorMessage: "Canal do Discord não configurado para o alvo informado.",
    };
  }

  if (!isDiscordConfigured) {
    return {
      status: "skipped",
      channelId,
      errorMessage: "Integração com Discord não configurada no ambiente.",
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
      errorMessage: body.slice(0, 500) || "Discord retornou erro sem detalhes.",
    };
  }

  return {
    status: "sent",
    channelId,
    errorMessage: null,
  };
}
