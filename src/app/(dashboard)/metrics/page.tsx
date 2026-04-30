import Link from "next/link";

import { MetricReviewPanel } from "@/components/forms/metric-review-panel";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { getMetrics } from "@/lib/data";
import { requireSession } from "@/lib/session";
import { formatDate, formatDuration, formatNumber } from "@/lib/utils";

export default async function MetricsPage() {
  const actor = await requireSession();
  const metrics = await getMetrics(actor);

  return (
    <SectionCard
      title="Métricas"
      description="Histórico completo de submissões, anexos, observações e análises."
    >
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-[var(--muted)]">
          {actor.role === "creator"
            ? "Você enxerga apenas as próprias métricas e respectivos anexos."
            : "Seu papel permite revisar métricas, aprovar ou negar e disparar avisos automaticamente."}
        </p>
        {actor.role === "creator" ? (
          <Link
            href="/metrics/new"
            className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
          >
            Nova métrica
          </Link>
        ) : null}
      </div>

      <div className="space-y-5">
        {metrics.map((metric) => (
          <article
            key={metric.id}
            className="rounded-[28px] border border-[rgba(19,32,45,0.08)] bg-white/88 p-5"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-display text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                    {metric.creator?.name ?? "Creator"} · {metric.platform}
                  </p>
                  <StatusBadge status={metric.status} />
                </div>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {metric.content_type} · {formatDate(metric.content_date, { dateStyle: "medium" })} · {formatNumber(metric.views)} views
                </p>
                <a
                  href={metric.content_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex text-sm font-semibold text-[var(--accent-strong)] hover:text-[var(--accent)]"
                >
                  Abrir conteúdo
                </a>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:w-[420px]">
                <div className="rounded-2xl bg-[rgba(18,145,125,0.08)] px-4 py-3 text-sm">
                  Likes: {formatNumber(metric.likes)}
                </div>
                <div className="rounded-2xl bg-[rgba(20,33,43,0.06)] px-4 py-3 text-sm">
                  Comentários: {formatNumber(metric.comments)}
                </div>
                <div className="rounded-2xl bg-[rgba(20,33,43,0.06)] px-4 py-3 text-sm">
                  Compart.: {formatNumber(metric.shares)}
                </div>
                <div className="rounded-2xl bg-[rgba(20,33,43,0.06)] px-4 py-3 text-sm">
                  Live: {formatDuration(metric.live_duration)}
                </div>
              </div>
            </div>

            {metric.creator_observation ? (
              <div className="mt-4 rounded-[24px] bg-[rgba(255,250,242,0.85)] px-4 py-4 text-sm leading-7 text-[var(--muted)]">
                <span className="font-semibold text-[var(--foreground)]">Observação do creator:</span>{" "}
                {metric.creator_observation}
              </div>
            ) : null}

            {metric.attachments && metric.attachments.length > 0 ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {metric.attachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.signed_url ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="overflow-hidden rounded-[24px] border border-[rgba(19,32,45,0.08)] bg-[rgba(255,255,255,0.82)]"
                  >
                    {attachment.signed_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={attachment.signed_url}
                        alt={attachment.file_name}
                        className="h-44 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-44 items-center justify-center bg-[rgba(20,33,43,0.06)] text-sm text-[var(--muted)]">
                        Visual indisponível
                      </div>
                    )}
                    <div className="p-4">
                      <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                        {attachment.file_name}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            ) : null}

            {metric.review?.reason || metric.admin_observation || metric.rejection_reason ? (
              <div className="mt-4 rounded-[24px] bg-[rgba(20,33,43,0.06)] px-4 py-4 text-sm leading-7 text-[var(--muted)]">
                <span className="font-semibold text-[var(--foreground)]">Última análise:</span>{" "}
                {metric.review?.reason ||
                  metric.admin_observation ||
                  metric.rejection_reason}
              </div>
            ) : null}

            {actor.canManageCreators && metric.status === "pending" ? (
              <div className="mt-5">
                <MetricReviewPanel metricId={metric.id} />
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </SectionCard>
  );
}
