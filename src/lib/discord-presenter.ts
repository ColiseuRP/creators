import type { DiscordLogStatus, NoticeTargetType } from "@/lib/types";

const noticeMessageTypeMap: Record<NoticeTargetType, string> = {
  general: "notice_general",
  category: "notice_category",
  individual: "notice_individual",
};

export function getNoticeDiscordMessageType(targetType: NoticeTargetType) {
  return noticeMessageTypeMap[targetType];
}

export function getDiscordStatusLabel(status: DiscordLogStatus) {
  switch (status) {
    case "sent":
      return "Enviado";
    case "failed":
      return "Falhou";
    case "skipped":
      return "N\u00E3o enviado";
    case "pending":
    default:
      return "Pendente";
  }
}

export function getDiscordMessageTypeLabel(
  messageType: string,
  targetType?: NoticeTargetType | "metric_review",
) {
  switch (messageType) {
    case "notice_general":
      return "Aviso geral";
    case "notice_category":
      return "Aviso por categoria";
    case "notice_individual":
      return "Aviso para Creator";
    case "metric_approved":
      return "Métrica aprovada";
    case "metric_rejected":
      return "Métrica negada";
    default:
      if (targetType === "individual") {
        return "Aviso para Creator";
      }

      if (targetType === "category") {
        return "Aviso por categoria";
      }

      if (targetType === "general") {
        return "Aviso geral";
      }

      return messageType;
  }
}

export function canResendDiscordNotice(noticeId: string | null | undefined) {
  return Boolean(noticeId);
}
