import { NoticeDiscordPanel } from "@/components/notice-discord-panel";
import { NoticeMarkdown } from "@/components/notice-markdown";
import { NoticeComposer } from "@/components/forms/notice-composer";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { getCreators, getNotices } from "@/lib/data";
import { requireSession } from "@/lib/session";
import { formatDate } from "@/lib/utils";

const targetLabels = {
  general: "Aviso geral",
  individual: "Aviso individual",
  category: "Aviso por categoria",
} as const;

export default async function NoticesPage() {
  const actor = await requireSession();
  const [notices, creators] = await Promise.all([
    getNotices(actor),
    actor.canManageCreators ? getCreators(actor) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      {actor.canManageCreators ? (
        <SectionCard
          title="Novo aviso da arena"
          description="Envie avisos gerais, por categoria ou individuais, com a opção de encaminhar o recado ao Discord."
        >
          <NoticeComposer creators={creators} />
        </SectionCard>
      ) : null}

      <SectionCard
        title={actor.canManageCreators ? "Histórico de avisos" : "Avisos recebidos"}
        description={
          actor.canManageCreators
            ? "Recados já enviados pela equipe para manter a operação da cidade organizada."
            : "Comunicados visíveis para você dentro da sua jornada como Creator."
        }
      >
        <div className="space-y-4">
          {notices.map((notice) => (
            <article
              key={notice.id}
              className="rounded-[28px] border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] p-5"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-display text-2xl font-semibold tracking-tight text-[var(--white)]">
                    {notice.title}
                  </p>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {formatDate(notice.sent_at)} / Destino: {targetLabels[notice.target_type]}
                  </p>
                </div>
                <StatusBadge status={notice.type} />
              </div>
              <NoticeMarkdown content={notice.message} className="mt-4" />
              {actor.canManageCreators ? <NoticeDiscordPanel notice={notice} /> : null}
            </article>
          ))}

          {notices.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[rgba(245,197,66,0.18)] bg-[rgba(255,255,255,0.02)] px-4 py-5 text-sm text-[var(--muted)]">
              Nenhum aviso registrado.
            </div>
          ) : null}
        </div>
      </SectionCard>
    </div>
  );
}
