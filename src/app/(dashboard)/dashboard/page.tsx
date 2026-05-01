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
  const isCreator = actor.role === "creator";
  const creatorName = actor.creator?.name ?? actor.profile?.name ?? "Creator";
  const metricsSentCount =
    snapshot.pendingMetricsCount +
    snapshot.approvedMetricsCount +
    snapshot.rejectedMetricsCount;

  const summaryCards = isCreator
    ? [
        {
          title: "Resumo do creator",
          value: creatorName,
          subtitle: actor.creator
            ? `${actor.creator.city_name} / ${actor.creator.category}`
            : "Seu nome esta registrado na equipe oficial do Coliseu RP.",
        },
        {
          title: "Metricas enviadas",
          value: formatNumber(metricsSentCount),
          subtitle: "Tudo o que voce ja entregou para a equipe analisar.",
        },
        {
          title: "Metricas aprovadas",
          value: formatNumber(snapshot.approvedMetricsCount),
          subtitle: "Conteudos validados e reconhecidos pela equipe.",
        },
        {
          title: "Metricas negadas",
          value: formatNumber(snapshot.rejectedMetricsCount),
          subtitle: "Envios que precisam de ajuste antes de voltar para a arena.",
        },
        {
          title: "Em analise",
          value: formatNumber(snapshot.pendingMetricsCount),
          subtitle: "Entregas aguardando retorno da equipe Creators Coliseu.",
        },
        {
          title: "Avisos recebidos",
          value: formatNumber(snapshot.noticesCount),
          subtitle: "Recados importantes para manter sua jornada alinhada.",
        },
      ]
    : [
        {
          title: "Creators ativos",
          value: formatNumber(snapshot.creatorsCount),
          subtitle: "Nomes hoje vinculados a operacao oficial da cidade.",
        },
        {
          title: "Metricas em analise",
          value: formatNumber(snapshot.pendingMetricsCount),
          subtitle: "Envios aguardando leitura e decisao da equipe.",
        },
        {
          title: "Metricas aprovadas",
          value: formatNumber(snapshot.approvedMetricsCount),
          subtitle: "Conteudos que ja receberam o aval da central.",
        },
        {
          title: "Inscricoes em triagem",
          value: formatNumber(snapshot.pendingApplicationsCount),
          subtitle: "Novos nomes esperando avaliacao da equipe.",
        },
        {
          title: "Avisos no radar",
          value: formatNumber(snapshot.noticesCount),
          subtitle: "Comunicados recentes circulando entre cidade e creators.",
        },
      ];

  return (
    <div className="space-y-6">
      <section className="surface-card-strong gold-frame p-6 lg:p-7">
        <p className="eyebrow">{isCreator ? "Sua jornada na arena" : "Comando da arena"}</p>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-display text-4xl font-semibold tracking-tight text-[var(--white)]">
              {isCreator ? "Sala do Creator" : "Central de Creators"}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
              {isCreator
                ? "Acompanhe seus numeros, leia os avisos da equipe e mantenha suas entregas vivas dentro do Coliseu RP."
                : "Tenha uma leitura rapida do movimento da equipe, avance nas analises e mantenha a cidade organizada."}
            </p>
          </div>

          <Link href={isCreator ? "/metrics/new" : "/metrics"} className="button-gold">
            {isCreator ? "Enviar Nova Metrica" : "Analisar Metricas"}
          </Link>
        </div>
      </section>

      <div
        className={`grid gap-4 md:grid-cols-2 ${isCreator ? "xl:grid-cols-3" : "xl:grid-cols-5"}`}
      >
        {summaryCards.map((card) => (
          <SummaryCard
            key={card.title}
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <SectionCard
          title={isCreator ? "Suas metricas recentes" : "Metricas recentes"}
          description={
            isCreator
              ? "Veja como suas ultimas entregas estao caminhando dentro da avaliacao da equipe."
              : "Acompanhe o fluxo mais recente de entregas e a situacao de cada creator."
          }
        >
          <div className="space-y-4">
            {snapshot.recentMetrics.map((metric) => (
              <article
                key={metric.id}
                className="rounded-[24px] border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] p-4"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-semibold text-[var(--white)]">
                      {metric.creator?.name ?? "Creator"} / {metric.platform}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {metric.content_type} / {formatNumber(metric.views)} views / enviada em{" "}
                      {formatDate(metric.submitted_at)}
                    </p>
                  </div>
                  <StatusBadge status={metric.status} />
                </div>
              </article>
            ))}

            {snapshot.recentMetrics.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-[rgba(245,197,66,0.18)] bg-[rgba(255,255,255,0.02)] px-4 py-5 text-sm text-[var(--muted)]">
                Nenhuma metrica apareceu por aqui ainda.
              </div>
            ) : null}
          </div>
        </SectionCard>

        <SectionCard
          title={actor.canManageCreators ? "Avisos e registros" : "Avisos da equipe"}
          description={
            actor.canManageCreators
              ? "Recados recentes e historico das mensagens que acompanham as decisoes da central."
              : "Leia os comunicados que ajudam a manter seu caminho alinhado com a cidade."
          }
        >
          <div className="space-y-4">
            {snapshot.recentNotices.map((notice) => (
              <article
                key={notice.id}
                className="rounded-[24px] border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-[var(--white)]">{notice.title}</p>
                  <StatusBadge status={notice.type} />
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{notice.message}</p>
              </article>
            ))}

            {snapshot.recentNotices.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-[rgba(245,197,66,0.18)] bg-[rgba(255,255,255,0.02)] px-4 py-5 text-sm text-[var(--muted)]">
                Ainda nao existem avisos recentes para mostrar.
              </div>
            ) : null}

            {actor.canManageCreators ? (
              <div className="rounded-[24px] border border-dashed border-[rgba(245,197,66,0.18)] bg-[rgba(245,197,66,0.06)] p-4">
                <p className="font-semibold text-[var(--white)]">Envios no Discord</p>
                <div className="mt-3 space-y-3">
                  {snapshot.recentLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between gap-4 rounded-2xl bg-[rgba(255,255,255,0.03)] px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[var(--white)]">
                          {log.message_type}
                        </p>
                        <p className="text-xs text-[var(--muted)]">
                          {formatDate(log.sent_at)}
                        </p>
                      </div>
                      <StatusBadge status={log.status} />
                    </div>
                  ))}

                  {snapshot.recentLogs.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[rgba(245,197,66,0.16)] px-4 py-3 text-sm text-[var(--muted)]">
                      Nenhum envio recente foi registrado.
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title={isCreator ? "Seus proximos passos" : "Atalhos da equipe"}
        description={
          isCreator
            ? "Retome sua rotina com rapidez e siga representando o Coliseu RP."
            : "Acesse os pontos principais da operacao sem perder o ritmo da analise."
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          <Link
            href={actor.role === "creator" ? "/metrics/new" : "/metrics"}
            className="rounded-[24px] border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] p-5 transition hover:-translate-y-0.5 hover:border-[rgba(245,197,66,0.24)] hover:shadow-[0_18px_40px_rgba(245,197,66,0.08)]"
          >
            <p className="font-display text-xl font-semibold tracking-tight text-[var(--white)]">
              {actor.role === "creator" ? "Enviar Nova Metrica" : "Analisar Metricas"}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              {actor.role === "creator"
                ? "Registre sua entrega com prints e contexto para a equipe."
                : "Veja pendencias, aprove envios e devolva retornos claros."}
            </p>
          </Link>

          <Link
            href={actor.role === "creator" ? "/room" : "/central/creators"}
            className="rounded-[24px] border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] p-5 transition hover:-translate-y-0.5 hover:border-[rgba(245,197,66,0.24)] hover:shadow-[0_18px_40px_rgba(245,197,66,0.08)]"
          >
            <p className="font-display text-xl font-semibold tracking-tight text-[var(--white)]">
              {actor.role === "creator" ? "Abrir minha sala" : "Ver creators"}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              {actor.role === "creator"
                ? "Veja seu espaco oficial, sua situacao atual e os detalhes da sala."
                : "Consulte perfis, historico e leitura rapida de cada creator."}
            </p>
          </Link>

          <Link
            href={actor.canManageCreators ? "/notices" : "/metrics"}
            className="rounded-[24px] border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] p-5 transition hover:-translate-y-0.5 hover:border-[rgba(245,197,66,0.24)] hover:shadow-[0_18px_40px_rgba(245,197,66,0.08)]"
          >
            <p className="font-display text-xl font-semibold tracking-tight text-[var(--white)]">
              {actor.canManageCreators ? "Enviar avisos" : "Revisar historico"}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              {actor.canManageCreators
                ? "Dispare avisos para a equipe, por categoria ou direto para cada sala."
                : "Consulte retornos, prints enviados e observacoes anteriores."}
            </p>
          </Link>
        </div>
      </SectionCard>
    </div>
  );
}
