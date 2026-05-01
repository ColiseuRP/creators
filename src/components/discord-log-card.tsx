import { ResendNoticeButton } from "@/components/forms/resend-notice-button";
import { StatusBadge } from "@/components/status-badge";
import {
  canResendDiscordNotice,
  getDiscordMessageTypeLabel,
  getDiscordStatusLabel,
} from "@/lib/discord-presenter";
import type { DiscordMessageLog } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function DiscordLogCard({
  log,
  showResendButton = true,
}: {
  log: DiscordMessageLog;
  showResendButton?: boolean;
}) {
  const attemptedAt = log.attempted_at ?? log.sent_at;
  const deliveredAt = log.delivered_at ?? (log.status === "sent" ? log.sent_at : null);

  return (
    <article className="rounded-[24px] border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-[var(--white)]">
            {getDiscordMessageTypeLabel(log.message_type, log.target_type)}
          </p>
          <div className="space-y-1 text-xs leading-6 text-[var(--muted)]">
            <p>Canal de destino: {log.channel_id || "Não definido"}</p>
            <p>Tentativa: {formatDate(attemptedAt)}</p>
            {deliveredAt ? <p>Envio concluído: {formatDate(deliveredAt)}</p> : null}
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 md:items-end">
          <StatusBadge
            status={log.status}
            label={getDiscordStatusLabel(log.status)}
          />
          {showResendButton && canResendDiscordNotice(log.notice_id) ? (
            <ResendNoticeButton noticeId={log.notice_id!} compact />
          ) : null}
        </div>
      </div>

      {log.error_message ? (
        <p className="mt-4 rounded-2xl border border-[rgba(139,30,30,0.4)] bg-[rgba(139,30,30,0.2)] px-4 py-3 text-sm leading-6 text-[#ffd0d0]">
          <span className="font-semibold">Motivo da falha:</span> {log.error_message}
        </p>
      ) : null}
    </article>
  );
}
