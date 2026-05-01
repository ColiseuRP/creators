import { ResendNoticeButton } from "@/components/forms/resend-notice-button";
import { StatusBadge } from "@/components/status-badge";
import { getDiscordStatusLabel } from "@/lib/discord-presenter";
import type { CreatorNotice, DiscordLogStatus } from "@/lib/types";
import { formatDate } from "@/lib/utils";

function getNoticeStatus(notice: CreatorNotice): DiscordLogStatus {
  return (
    notice.latest_discord_log?.status ??
    notice.discord_status ??
    "skipped"
  );
}

export function NoticeDiscordPanel({ notice }: { notice: CreatorNotice }) {
  const hasTrackedDeliveryState = Boolean(
    notice.latest_discord_log ||
      notice.discord_status ||
      notice.discord_channel_id ||
      notice.discord_last_attempt_at ||
      notice.discord_error_message ||
      notice.discord_sent_at,
  );

  if (!hasTrackedDeliveryState) {
    return null;
  }

  const status = getNoticeStatus(notice);
  const channelId =
    notice.latest_discord_log?.channel_id ?? notice.discord_channel_id ?? null;
  const errorMessage =
    notice.latest_discord_log?.error_message ?? notice.discord_error_message ?? null;
  const attemptedAt =
    notice.latest_discord_log?.attempted_at ??
    notice.discord_last_attempt_at ??
    notice.latest_discord_log?.sent_at ??
    null;
  const deliveredAt =
    notice.latest_discord_log?.delivered_at ?? notice.discord_sent_at ?? null;

  return (
    <div className="mt-4 rounded-[22px] border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.02)] p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2 text-xs leading-6 text-[var(--muted)]">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={status} label={getDiscordStatusLabel(status)} />
            <span>Canal: {channelId || "Não definido"}</span>
          </div>
          {attemptedAt ? <p>Última tentativa: {formatDate(attemptedAt)}</p> : null}
          {deliveredAt ? <p>Envio concluído: {formatDate(deliveredAt)}</p> : null}
        </div>

        <ResendNoticeButton noticeId={notice.id} compact />
      </div>

      {errorMessage ? (
        <p className="mt-4 rounded-2xl border border-[rgba(139,30,30,0.4)] bg-[rgba(139,30,30,0.2)] px-4 py-3 text-sm leading-6 text-[#ffd0d0]">
          <span className="font-semibold">Motivo da falha:</span> {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
