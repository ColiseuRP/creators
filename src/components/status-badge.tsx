import type {
  CreatorStatus,
  DiscordLogStatus,
  MetricStatus,
  NoticeType,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type BadgeStatus = CreatorStatus | MetricStatus | DiscordLogStatus | NoticeType;

const styles: Record<BadgeStatus, string> = {
  active: "bg-emerald-100 text-emerald-800",
  pending: "bg-amber-100 text-amber-800",
  paused: "bg-slate-200 text-slate-700",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-800",
  sent: "bg-emerald-100 text-emerald-800",
  failed: "bg-rose-100 text-rose-800",
  skipped: "bg-slate-200 text-slate-700",
  info: "bg-sky-100 text-sky-800",
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-800",
};

export function StatusBadge({ status }: { status: BadgeStatus }) {
  const labels: Record<BadgeStatus, string> = {
    active: "Ativo",
    pending: "Pendente",
    paused: "Pausado",
    approved: "Aprovado",
    rejected: "Negado",
    sent: "Enviado",
    failed: "Falhou",
    skipped: "Ignorado",
    info: "Informativo",
    success: "Sucesso",
    warning: "Atenção",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide",
        styles[status],
      )}
    >
      {labels[status]}
    </span>
  );
}
