import Link from "next/link";

import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { SummaryCard } from "@/components/summary-card";
import { getDashboardSnapshot } from "@/lib/data";
import { requireSession } from "@/lib/session";
import { formatDate, formatNumber } from "@/lib/utils";

export default async function DashboardPage() {
  const actor = await requireSession();
  const snapshot = await getDashboardSnapshot(actor);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          title="Creators"
          value={formatNumber(snapshot.creatorsCount)}
          subtitle="Perfis ativos visíveis para seu papel."
        />
        <SummaryCard
          title="Métricas pendentes"
          value={formatNumber(snapshot.pendingMetricsCount)}
          subtitle="Itens aguardando review ou validação."
        />
        <SummaryCard
          title="Métricas aprovadas"
          value={formatNumber(snapshot.approvedMetricsCount)}
          subtitle="Entregas já validadas no período."
        />
        <SummaryCard
          title="Inscrições pendentes"
          value={formatNumber(snapshot.pendingApplicationsCount)}
          subtitle="Novos creators aguardando triagem."
        />
        <SummaryCard
          title="Avisos visíveis"
          value={formatNumber(snapshot.noticesCount)}
          subtitle="Comunicados internos recentes."
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <SectionCard
          title="Métricas recentes"
          description="Acompanhe as submissões mais recentes e o status operacional de cada uma."
        >
          <div className="space-y-4">
            {snapshot.recentMetrics.map((metric) => (
              <article
                key={metric.id}
                className="rounded-[24px] border border-[rgba(19,32,45,0.08)] bg-white/80 p-4"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">
                      {metric.creator?.name ?? "Creator"} · {metric.platform}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {metric.content_type} · {formatNumber(metric.views)} views · enviada em{" "}
                      {formatDate(metric.submitted_at)}
                    </p>
                  </div>
                  <StatusBadge status={metric.status} />
                </div>
              </article>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Avisos e logs"
          description="Eventos recentes de comunicação interna e integrações externas."
        >
          <div className="space-y-4">
            {snapshot.recentNotices.map((notice) => (
              <article
                key={notice.id}
                className="rounded-[24px] border border-[rgba(19,32,45,0.08)] bg-white/80 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-[var(--foreground)]">{notice.title}</p>
                  <StatusBadge status={notice.type} />
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{notice.message}</p>
              </article>
            ))}

            {actor.canManageCreators ? (
              <div className="rounded-[24px] border border-dashed border-[rgba(19,32,45,0.14)] bg-[rgba(18,145,125,0.06)] p-4">
                <p className="font-semibold text-[var(--foreground)]">Logs de Discord</p>
                <div className="mt-3 space-y-3">
                  {snapshot.recentLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between gap-4 rounded-2xl bg-white/70 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[var(--foreground)]">
                          {log.message_type}
                        </p>
                        <p className="text-xs text-[var(--muted)]">
                          {formatDate(log.sent_at)}
                        </p>
                      </div>
                      <StatusBadge status={log.status} />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Atalhos do fluxo"
        description="Ações úteis para continuar o trabalho sem perder contexto."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <Link
            href={actor.role === "creator" ? "/metrics/new" : "/metrics"}
            className="rounded-[24px] border border-[rgba(19,32,45,0.08)] bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_14px_40px_rgba(19,32,45,0.08)]"
          >
            <p className="font-display text-xl font-semibold tracking-tight text-[var(--foreground)]">
              {actor.role === "creator" ? "Enviar nova métrica" : "Analisar métricas"}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              {actor.role === "creator"
                ? "Registre uma entrega com anexos e observações."
                : "Verifique pendências, aprove ou negue com observação."}
            </p>
          </Link>

          <Link
            href={actor.role === "creator" ? "/room" : "/creators"}
            className="rounded-[24px] border border-[rgba(19,32,45,0.08)] bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_14px_40px_rgba(19,32,45,0.08)]"
          >
            <p className="font-display text-xl font-semibold tracking-tight text-[var(--foreground)]">
              {actor.role === "creator" ? "Abrir minha sala" : "Gerenciar creators"}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Histórico, contexto operacional e estado dos canais individuais.
            </p>
          </Link>

          <Link
            href={actor.canManageCreators ? "/notices" : "/metrics"}
            className="rounded-[24px] border border-[rgba(19,32,45,0.08)] bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_14px_40px_rgba(19,32,45,0.08)]"
          >
            <p className="font-display text-xl font-semibold tracking-tight text-[var(--foreground)]">
              {actor.canManageCreators ? "Enviar avisos" : "Revisar histórico"}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              {actor.canManageCreators
                ? "Publique avisos internos com opção de envio no Discord."
                : "Consulte aprovações, anexos e observações anteriores."}
            </p>
          </Link>
        </div>
      </SectionCard>
    </div>
  );
}
