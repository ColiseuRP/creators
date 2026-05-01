import Link from "next/link";

import { MetricReviewPanel } from "@/components/forms/metric-review-panel";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { getMetrics } from "@/lib/data";
import { requireSession } from "@/lib/session";
import { formatDate, formatDuration, formatNumber } from "@/lib/utils";

function getMetricMessage(status: "pending" | "approved" | "rejected") {
  switch (status) {
    case "approved":
      return "Metrica aprovada. Continue representando o Coliseu!";
    case "rejected":
      return "Metrica negada. Verifique o motivo informado pela equipe.";
    default:
      return "Sua metrica esta em analise pela equipe.";
  }
}

export default async function MetricsPage() {
  const actor = await requireSession();
  const metrics = await getMetrics(actor);

  return (
    <SectionCard
      title="Metricas"
      description={
        actor.role === "creator"
          ? "Aqui voce acompanha o historico das suas entregas, os prints enviados e os retornos da equipe."
          : "A equipe acompanha o historico de metricas, confere os anexos e registra cada decisao da central."
      }
    >
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-[var(--muted)]">
          {actor.role === "creator"
            ? "Voce enxerga apenas as proprias metricas, seus prints e os avisos ligados ao seu caminho."
            : "Seu papel permite revisar metricas, aprovar ou negar envios e registrar retorno para cada creator."}
        </p>
        {actor.role === "creator" ? (
          <Link href="/metrics/new" className="button-gold">
            Enviar Nova Metrica
          </Link>
        ) : null}
      </div>

      <div className="space-y-5">
        {metrics.map((metric) => (
          <article
            key={metric.id}
            className="rounded-[28px] border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] p-5"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-display text-2xl font-semibold tracking-tight text-[var(--white)]">
                    {metric.creator?.name ?? "Creator"} / {metric.platform}
                  </p>
                  <StatusBadge status={metric.status} />
                </div>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {metric.content_type} /{" "}
                  {formatDate(metric.content_date, { dateStyle: "medium" })} /{" "}
                  {formatNumber(metric.views)} views
                </p>
                <a
                  href={metric.content_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex text-sm font-semibold text-[var(--gold)] hover:text-[var(--white)]"
                >
                  Abrir conteudo
                </a>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:w-[420px]">
                <div className="rounded-2xl border border-[rgba(245,197,66,0.12)] bg-[rgba(245,197,66,0.08)] px-4 py-3 text-sm text-[var(--muted)]">
                  Likes: {formatNumber(metric.likes)}
                </div>
                <div className="rounded-2xl border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[var(--muted)]">
                  Comentarios: {formatNumber(metric.comments)}
                </div>
                <div className="rounded-2xl border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[var(--muted)]">
                  Compart.: {formatNumber(metric.shares)}
                </div>
                <div className="rounded-2xl border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[var(--muted)]">
                  Live: {formatDuration(metric.live_duration)}
                </div>
              </div>
            </div>

            {actor.role === "creator" ? (
              <div className="mt-4 rounded-[24px] border border-[rgba(245,197,66,0.14)] bg-[rgba(245,197,66,0.08)] px-4 py-4 text-sm leading-7 text-[var(--muted)]">
                {getMetricMessage(metric.status)}
              </div>
            ) : null}

            {metric.creator_observation ? (
              <div className="mt-4 rounded-[24px] border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.02)] px-4 py-4 text-sm leading-7 text-[var(--muted)]">
                <span className="font-semibold text-[var(--white)]">Observacao do creator:</span>{" "}
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
                    className="overflow-hidden rounded-[24px] border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)]"
                  >
                    {attachment.signed_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={attachment.signed_url}
                        alt={attachment.file_name}
                        className="h-44 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-44 items-center justify-center bg-[rgba(255,255,255,0.03)] text-sm text-[var(--muted)]">
                        Visual indisponivel
                      </div>
                    )}
                    <div className="p-4">
                      <p className="truncate text-sm font-semibold text-[var(--white)]">
                        {attachment.file_name}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            ) : null}

            {metric.review?.reason || metric.admin_observation || metric.rejection_reason ? (
              <div className="mt-4 rounded-[24px] border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.02)] px-4 py-4 text-sm leading-7 text-[var(--muted)]">
                <span className="font-semibold text-[var(--white)]">Retorno da equipe:</span>{" "}
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

        {metrics.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-[rgba(245,197,66,0.18)] bg-[rgba(255,255,255,0.02)] px-4 py-5 text-sm text-[var(--muted)]">
            Nenhuma metrica foi registrada por aqui ainda.
          </div>
        ) : null}
      </div>
    </SectionCard>
  );
}
