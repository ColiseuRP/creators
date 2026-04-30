import { notFound } from "next/navigation";

import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { getCreatorDetail } from "@/lib/data";
import { requireSession } from "@/lib/session";
import { formatDate, formatDuration, formatNumber } from "@/lib/utils";

interface CreatorDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CreatorDetailPage({
  params,
}: CreatorDetailPageProps) {
  const actor = await requireSession();
  const { id } = await params;
  const detail = await getCreatorDetail(actor, id);

  if (!detail) {
    notFound();
  }

  const { creator, metrics, notices, logs } = detail;

  return (
    <div className="space-y-6">
      <SectionCard
        title={creator.name}
        description={`${creator.city_name} · ${creator.category} · ${creator.room?.title ?? "Sala pendente"}`}
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-[24px] bg-white p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
              Status
            </p>
            <div className="mt-3">
              <StatusBadge status={creator.status} />
            </div>
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
              {creator.bio || "Sem biografia cadastrada."}
            </p>
          </div>

          <div className="rounded-[24px] bg-white p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
              Canal Discord
            </p>
            <p className="mt-3 break-all text-sm font-semibold text-[var(--foreground)]">
              {creator.discord_channel_id || "Ainda não configurado"}
            </p>
          </div>

          <div className="rounded-[24px] bg-white p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
              Sala individual
            </p>
            <p className="mt-3 text-sm font-semibold text-[var(--foreground)]">
              {creator.room?.description || "Sem descrição registrada."}
            </p>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          title="Histórico de métricas"
          description="Últimas submissões, anexos e status de revisão."
        >
          <div className="space-y-4">
            {metrics.map((metric) => (
              <article
                key={metric.id}
                className="rounded-[24px] border border-[rgba(19,32,45,0.08)] bg-white/85 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">
                      {metric.platform} · {metric.content_type}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {formatNumber(metric.views)} views · {formatDate(metric.submitted_at)}
                    </p>
                  </div>
                  <StatusBadge status={metric.status} />
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
              </article>
            ))}
          </div>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard
            title="Avisos relacionados"
            description="Comunicados gerais, por categoria e individuais."
          >
            <div className="space-y-3">
              {notices.map((notice) => (
                <article
                  key={notice.id}
                  className="rounded-[24px] border border-[rgba(19,32,45,0.08)] bg-white/80 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-[var(--foreground)]">{notice.title}</p>
                    <StatusBadge status={notice.type} />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    {notice.message}
                  </p>
                </article>
              ))}
            </div>
          </SectionCard>

          {actor.canManageCreators ? (
            <SectionCard
              title="Logs de Discord"
              description="Resultado do envio de mensagens para a sala do creator."
            >
              <div className="space-y-3">
                {logs.map((log) => (
                  <article
                    key={log.id}
                    className="rounded-[24px] border border-[rgba(19,32,45,0.08)] bg-white/80 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[var(--foreground)]">
                        {log.message_type}
                      </p>
                      <StatusBadge status={log.status} />
                    </div>
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      {formatDate(log.sent_at)}
                    </p>
                    {log.error_message ? (
                      <p className="mt-2 text-sm text-rose-700">{log.error_message}</p>
                    ) : null}
                  </article>
                ))}
              </div>
            </SectionCard>
          ) : null}
        </div>
      </div>
    </div>
  );
}
