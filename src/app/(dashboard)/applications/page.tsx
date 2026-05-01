import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { getApplications } from "@/lib/data";
import { requireSession } from "@/lib/session";
import { formatDate } from "@/lib/utils";

const applicationLabels = {
  pending: "Em analise",
  approved: "Aprovada",
  rejected: "Reprovado",
} as const;

export default async function ApplicationsPage() {
  const actor = await requireSession(["admin_general", "responsavel_creators"]);
  const applications = await getApplications(actor);

  return (
    <SectionCard
      title="Fila de inscricoes"
      description="Novos nomes que desejam entrar para a arena, com frequencia de conteudo e contexto para triagem."
    >
      <div className="space-y-4">
        {applications.map((application) => (
          <article
            key={application.id}
            className="rounded-[28px] border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] p-5"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="font-display text-2xl font-semibold tracking-tight text-[var(--white)]">
                  {application.name}
                </p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {application.city_name} / {application.category} / {application.frequency}
                </p>
              </div>
              <StatusBadge
                status={application.status}
                label={applicationLabels[application.status]}
              />
            </div>

            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
              {application.reason}
            </p>

            <div className="mt-5 grid gap-3 lg:grid-cols-3">
              <div className="rounded-2xl border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[var(--muted)]">
                Discord: {application.discord_name}
              </div>
              <div className="rounded-2xl border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[var(--muted)]">
                Enviado em {formatDate(application.created_at, { dateStyle: "medium" })}
              </div>
              <div className="rounded-2xl border border-[rgba(245,197,66,0.12)] bg-[rgba(245,197,66,0.08)] px-4 py-3 text-sm text-[var(--muted)]">
                Idade: {application.age}
              </div>
            </div>

            {application.observations ? (
              <div className="mt-4 rounded-[22px] border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.02)] px-4 py-4 text-sm leading-7 text-[var(--muted)]">
                <span className="font-semibold text-[var(--white)]">Observacoes:</span>{" "}
                {application.observations}
              </div>
            ) : null}
          </article>
        ))}

        {applications.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-[rgba(245,197,66,0.18)] bg-[rgba(255,255,255,0.02)] px-4 py-5 text-sm text-[var(--muted)]">
            Nenhuma inscricao aguarda triagem neste momento.
          </div>
        ) : null}
      </div>
    </SectionCard>
  );
}
