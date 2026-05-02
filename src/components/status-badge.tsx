import type {
  CreatorStatus,
  CreatorTicketStatus,
  DiscordLogStatus,
  MetricStatus,
  NoticeType,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type BadgeStatus =
  | CreatorStatus
  | CreatorTicketStatus
  | MetricStatus
  | DiscordLogStatus
  | NoticeType;

const styles: Record<BadgeStatus, string> = {
  active: "border-[rgba(46,139,87,0.35)] bg-[rgba(46,139,87,0.18)] text-[#d7ffe8]",
  pending: "border-[rgba(245,197,66,0.35)] bg-[rgba(245,197,66,0.12)] text-[var(--gold)]",
  paused: "border-[rgba(214,214,214,0.2)] bg-[rgba(214,214,214,0.08)] text-[var(--muted)]",
  open: "border-[rgba(245,197,66,0.35)] bg-[rgba(245,197,66,0.12)] text-[var(--gold)]",
  closed: "border-[rgba(139,30,30,0.4)] bg-[rgba(139,30,30,0.2)] text-[#ffd0d0]",
  archived: "border-[rgba(214,214,214,0.2)] bg-[rgba(214,214,214,0.08)] text-[var(--muted)]",
  approved: "border-[rgba(46,139,87,0.35)] bg-[rgba(46,139,87,0.18)] text-[#d7ffe8]",
  rejected: "border-[rgba(139,30,30,0.4)] bg-[rgba(139,30,30,0.2)] text-[#ffd0d0]",
  sent: "border-[rgba(46,139,87,0.35)] bg-[rgba(46,139,87,0.18)] text-[#d7ffe8]",
  failed: "border-[rgba(139,30,30,0.4)] bg-[rgba(139,30,30,0.2)] text-[#ffd0d0]",
  skipped: "border-[rgba(214,214,214,0.2)] bg-[rgba(214,214,214,0.08)] text-[var(--muted)]",
  info: "border-[rgba(245,197,66,0.35)] bg-[rgba(245,197,66,0.12)] text-[var(--gold)]",
  success: "border-[rgba(46,139,87,0.35)] bg-[rgba(46,139,87,0.18)] text-[#d7ffe8]",
  warning: "border-[rgba(139,30,30,0.4)] bg-[rgba(139,30,30,0.2)] text-[#ffd0d0]",
};

const labels: Record<BadgeStatus, string> = {
  active: "Ativo",
  pending: "Em análise",
  paused: "Pausado",
  open: "Aberto",
  closed: "Fechado",
  archived: "Arquivado",
  approved: "Aprovada",
  rejected: "Negada",
  sent: "Enviado",
  failed: "Falhou",
  skipped: "Não enviado",
  info: "Informativo",
  success: "Destaque",
  warning: "Atenção",
};

export function StatusBadge({
  status,
  label,
}: {
  status: BadgeStatus;
  label?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide",
        styles[status],
      )}
    >
      {label ?? labels[status]}
    </span>
  );
}
