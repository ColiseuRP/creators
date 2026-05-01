import "server-only";

import { env } from "@/lib/env";
import type { Creator, MetricSubmission, NoticeTargetType, NoticeType } from "@/lib/types";

export interface DiscordSendResult {
  status: "sent" | "failed" | "skipped";
  channelId: string | null;
  errorMessage: string | null;
}

function parseDiscordErrorMessage(rawBody: string) {
  if (!rawBody) {
    return "O Discord não retornou detalhes sobre a falha.";
  }

  try {
    const parsed = JSON.parse(rawBody) as {
      code?: number | string;
      message?: string;
    };

    const parts = [parsed.message, parsed.code ? `código ${parsed.code}` : null].filter(
      Boolean,
    );

    if (parts.length > 0) {
      return `Discord: ${parts.join(" / ")}.`;
    }
  } catch {
    // Mantém o corpo bruto abaixo quando não vier em JSON.
  }

  return rawBody.slice(0, 500);
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
  type: NoticeType,
) {
  const headerMap: Record<NoticeTargetType, string> = {
    general: "📢 Aviso geral — Creators Coliseu",
    category: "📢 Aviso por categoria — Creators Coliseu",
    individual: "📌 Aviso para você — Creators Coliseu",
  };

  const normalizedMessage = type === "warning" ? message : message;

  return [
    headerMap[targetType],
    "",
    title,
    "",
    normalizedMessage,
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
  if (!channelId) {
    return {
      status: "failed",
      channelId: null,
      errorMessage:
        options?.missingChannelMessage ??
        "Nenhum canal de destino foi configurado para este envio.",
    };
  }

  if (!env.DISCORD_BOT_TOKEN) {
    return {
      status: "failed",
      channelId,
      errorMessage: "O envio para o Discord não está configurado corretamente no momento.",
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
