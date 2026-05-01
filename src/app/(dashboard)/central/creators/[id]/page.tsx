import { DiscordLogCard } from "@/components/discord-log-card";
import { NoticeDiscordPanel } from "@/components/notice-discord-panel";
import { NoticeMarkdown } from "@/components/notice-markdown";
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
  const actor = await requireSession(["admin_general", "responsavel_creators"]);
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
        description={`${creator.city_name} / ${creator.category} / ${creator.room?.title ?? "Sala pendente"}`}
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-[24px] border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] p-5">
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

          <div className="rounded-[24px] border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
              Sala no Discord
            </p>
            <p className="mt-3 break-all text-sm font-semibold text-[var(--white)]">
              {creator.discord_channel_id || "Ainda nao configurado"}
            </p>
          </div>

          <div className="rounded-[24px] border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
              Sala individual
            </p>
            <p className="mt-3 text-sm font-semibold leading-7 text-[var(--white)]">
              {creator.room?.description || "Sem descricao registrada."}
            </p>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          title="Historico de metricas"
          description="Ultimas entregas do creator, com numeros, anexos e leitura da equipe."
        >
          <div className="space-y-4">
            {metrics.map((metric) => (
              <article
                key={metric.id}
                className="rounded-[24px] border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-semibold text-[var(--white)]">
                      {metric.platform} / {metric.content_type}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {formatNumber(metric.views)} views / {formatDate(metric.submitted_at)}
                    </p>
                  </div>
                  <StatusBadge status={metric.status} />
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
              </article>
            ))}

            {metrics.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-[rgba(245,197,66,0.18)] bg-[rgba(255,255,255,0.02)] px-4 py-5 text-sm text-[var(--muted)]">
                Este creator ainda nao possui metricas registradas.
              </div>
            ) : null}
          </div>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard
            title="Avisos relacionados"
            description="Recados gerais, por categoria ou enviados direto para a sala do creator."
          >
            <div className="space-y-3">
              {notices.map((notice) => (
                <article
                  key={notice.id}
                  className="rounded-[24px] border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-[var(--white)]">{notice.title}</p>
                    <StatusBadge status={notice.type} />
                  </div>
                  <NoticeMarkdown content={notice.message} className="mt-2" />
                  <NoticeDiscordPanel notice={notice} />
                </article>
              ))}

              {notices.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-[rgba(245,197,66,0.18)] bg-[rgba(255,255,255,0.02)] px-4 py-5 text-sm text-[var(--muted)]">
                  Ainda nao existem avisos ligados a este creator.
                </div>
              ) : null}
            </div>
          </SectionCard>

          <SectionCard
            title="Historico no Discord"
            description="Resultado das mensagens enviadas para acompanhar aprovacoes, negacoes e avisos da equipe."
          >
            <div className="space-y-3">
              {logs.map((log) => (
                <DiscordLogCard key={log.id} log={log} />
              ))}

              {logs.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-[rgba(245,197,66,0.18)] bg-[rgba(255,255,255,0.02)] px-4 py-5 text-sm text-[var(--muted)]">
                  Nenhum envio ligado a este creator foi registrado ainda.
                </div>
              ) : null}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
