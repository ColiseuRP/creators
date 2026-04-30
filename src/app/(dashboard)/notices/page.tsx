import { NoticeComposer } from "@/components/forms/notice-composer";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { getCreators, getNotices } from "@/lib/data";
import { requireSession } from "@/lib/session";
import { formatDate } from "@/lib/utils";

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
          title="Novo aviso"
          description="Envie avisos gerais, por categoria ou individuais, com opção de encaminhar ao Discord."
        >
          <NoticeComposer creators={creators} />
        </SectionCard>
      ) : null}

      <SectionCard
        title="Avisos internos"
        description="Histórico dos comunicados exibidos no painel conforme seu papel e escopo."
      >
        <div className="space-y-4">
          {notices.map((notice) => (
            <article
              key={notice.id}
              className="rounded-[28px] border border-[rgba(19,32,45,0.08)] bg-white/88 p-5"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-display text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                    {notice.title}
                  </p>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {formatDate(notice.sent_at)} · destino {notice.target_type}
                  </p>
                </div>
                <StatusBadge status={notice.type} />
              </div>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{notice.message}</p>
            </article>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
