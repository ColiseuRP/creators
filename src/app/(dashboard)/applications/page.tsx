import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { getApplications } from "@/lib/data";
import { requireSession } from "@/lib/session";
import { formatDate } from "@/lib/utils";

export default async function ApplicationsPage() {
  const actor = await requireSession(["admin_general", "responsavel_creators"]);
  const applications = await getApplications(actor);

  return (
    <SectionCard
      title="Inscrições"
      description="Fila de novos creators com links, frequência de conteúdo e observações."
    >
      <div className="space-y-4">
        {applications.map((application) => (
          <article
            key={application.id}
            className="rounded-[28px] border border-[rgba(19,32,45,0.08)] bg-white/85 p-5"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="font-display text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                  {application.name}
                </p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {application.city_name} · {application.category} · {application.frequency}
                </p>
              </div>
              <StatusBadge status={application.status} />
            </div>

            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
              {application.reason}
            </p>

            <div className="mt-5 grid gap-3 lg:grid-cols-3">
              <div className="rounded-2xl bg-[rgba(20,33,43,0.06)] px-4 py-3 text-sm">
                Discord: {application.discord_name}
              </div>
              <div className="rounded-2xl bg-[rgba(20,33,43,0.06)] px-4 py-3 text-sm">
                Enviado em {formatDate(application.created_at, { dateStyle: "medium" })}
              </div>
              <div className="rounded-2xl bg-[rgba(18,145,125,0.08)] px-4 py-3 text-sm">
                Idade: {application.age}
              </div>
            </div>
          </article>
        ))}
      </div>
    </SectionCard>
  );
}
