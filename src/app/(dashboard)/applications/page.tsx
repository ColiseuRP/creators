import { ApplicationReviewActions } from "@/components/forms/application-review-actions";
import { PublishCreatorFormPanelButton } from "@/components/forms/publish-creator-form-panel-button";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { getApplications } from "@/lib/data";
import { requireSession } from "@/lib/session";
import { formatDate } from "@/lib/utils";
import {
  getCreatorApplicationSourceLabel,
  getCreatorApplicationStatusLabel,
} from "@/shared/creator-applications";

function getSocialLinksLabel(source: "site" | "discord" | null | undefined) {
  return source === "discord" ? "Redes/canal" : "Links de conteúdo";
}

export default async function ApplicationsPage() {
  const actor = await requireSession(["admin_general", "responsavel_creators"]);
  const applications = await getApplications(actor);

  const pendingApplications = applications.filter(
    (application) => application.status === "pending",
  ).length;
  const approvedApplications = applications.filter(
    (application) => application.status === "approved",
  ).length;
  const rejectedApplications = applications.filter(
    (application) => application.status === "rejected",
  ).length;

  return (
    <div className="space-y-6">
      <SectionCard
        title="Fila de inscrições"
        description="Acompanhe inscrições vindas do site e do Discord, aprove pedidos com agilidade e mantenha a entrada da arena organizada."
      >
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-[rgba(245,197,66,0.12)] bg-[rgba(245,197,66,0.08)] px-4 py-4">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                Em análise
              </p>
              <p className="mt-3 font-display text-3xl font-semibold text-[var(--white)]">
                {pendingApplications}
              </p>
            </div>

            <div className="rounded-[24px] border border-[rgba(245,197,66,0.12)] bg-[rgba(46,139,87,0.12)] px-4 py-4">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                Aprovadas
              </p>
              <p className="mt-3 font-display text-3xl font-semibold text-[var(--white)]">
                {approvedApplications}
              </p>
            </div>

            <div className="rounded-[24px] border border-[rgba(245,197,66,0.12)] bg-[rgba(139,30,30,0.16)] px-4 py-4">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                Negadas
              </p>
              <p className="mt-3 font-display text-3xl font-semibold text-[var(--white)]">
                {rejectedApplications}
              </p>
            </div>
          </div>

          <div className="rounded-[28px] border border-[rgba(245,197,66,0.12)] bg-[rgba(18,10,5,0.38)] p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="font-display text-2xl font-semibold tracking-tight text-[var(--white)]">
                  Formulário no Discord
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                  Publique ou atualize o painel oficial para receber inscrições
                  diretamente pelo canal do formulário.
                </p>
              </div>

              <StatusBadge
                status={pendingApplications > 0 ? "pending" : "sent"}
                label={
                  pendingApplications > 0
                    ? `${pendingApplications} na fila`
                    : "Fila em dia"
                }
              />
            </div>

            <div className="mt-5 rounded-[24px] border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] p-4">
              <p className="text-sm leading-7 text-[var(--muted)]">
                O painel publica o botão <span className="font-semibold text-[var(--white)]">Participar Creators</span> no
                Discord, abre o formulário oficial e envia cada resposta para
                análise da equipe.
              </p>

              <div className="mt-4">
                <PublishCreatorFormPanelButton />
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Inscrições recebidas"
        description="Cada card traz contexto da inscrição, origem do envio, histórico de análise e ações rápidas para aprovação ou negação."
      >
        <div className="space-y-4">
          {applications.map((application) => (
            <article
              key={application.id}
              className="rounded-[28px] border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] p-5"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-2xl font-semibold tracking-tight text-[var(--white)]">
                      {application.name}
                    </p>
                    <span className="inline-flex items-center rounded-full border border-[rgba(245,197,66,0.2)] bg-[rgba(245,197,66,0.08)] px-3 py-1 text-xs font-semibold tracking-wide text-[var(--gold)]">
                      {getCreatorApplicationSourceLabel(application.source)}
                    </span>
                  </div>

                  <p className="text-sm leading-7 text-[var(--muted)]">
                    {application.city_name} • {application.category} • {application.frequency}
                  </p>
                </div>

                <StatusBadge
                  status={application.status}
                  label={getCreatorApplicationStatusLabel(application.status)}
                />
              </div>

              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                {application.reason}
              </p>

              <div className="mt-5 grid gap-3 xl:grid-cols-4">
                <div className="rounded-2xl border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[var(--muted)]">
                  <span className="block text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                    Discord
                  </span>
                  <span className="mt-2 block font-semibold text-[var(--white)]">
                    {application.discord_name || "Não informado"}
                  </span>
                </div>

                <div className="rounded-2xl border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[var(--muted)]">
                  <span className="block text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                    Data de envio
                  </span>
                  <span className="mt-2 block font-semibold text-[var(--white)]">
                    {formatDate(application.created_at)}
                  </span>
                </div>

                <div className="rounded-2xl border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[var(--muted)]">
                  <span className="block text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                    Idade
                  </span>
                  <span className="mt-2 block font-semibold text-[var(--white)]">
                    {typeof application.age === "number" ? application.age : "Não informada"}
                  </span>
                </div>

                <div className="rounded-2xl border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[var(--muted)]">
                  <span className="block text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                    Origem
                  </span>
                  <span className="mt-2 block font-semibold text-[var(--white)]">
                    {getCreatorApplicationSourceLabel(application.source)}
                  </span>
                </div>
              </div>

              <details className="mt-4 rounded-[24px] border border-[rgba(245,197,66,0.12)] bg-[rgba(18,10,5,0.32)] p-4">
                <summary className="cursor-pointer list-none text-sm font-semibold text-[var(--gold)]">
                  Ver detalhes
                </summary>

                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                        {getSocialLinksLabel(application.source)}
                      </p>
                      <p className="mt-2 whitespace-pre-line text-sm leading-7 text-[var(--white)]">
                        {application.content_links || "Nenhum link complementar enviado."}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                        Canais informados
                      </p>
                      <div className="mt-2 space-y-2 text-sm leading-7 text-[var(--white)]">
                        <p>Twitch: {application.twitch_url || "Não informado"}</p>
                        <p>TikTok: {application.tiktok_url || "Não informado"}</p>
                        <p>YouTube: {application.youtube_url || "Não informado"}</p>
                        <p>Instagram: {application.instagram_url || "Não informado"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-2xl border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                        Observações
                      </p>
                      <p className="mt-2 text-sm leading-7 text-[var(--white)]">
                        {application.observations || "Nenhuma observação enviada."}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                        Histórico da análise
                      </p>
                      <div className="mt-2 space-y-2 text-sm leading-7 text-[var(--white)]">
                        <p>
                          Responsável:{" "}
                          {application.reviewed_by_name || "Aguardando análise"}
                        </p>
                        <p>
                          Data:{" "}
                          {application.reviewed_at
                            ? formatDate(application.reviewed_at)
                            : "Aguardando análise"}
                        </p>
                        {application.rejection_reason ? (
                          <p>
                            Motivo: <span className="text-[#ffd0d0]">{application.rejection_reason}</span>
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </details>

              <div className="mt-4">
                <ApplicationReviewActions
                  applicationId={application.id}
                  status={application.status}
                />
              </div>
            </article>
          ))}

          {applications.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[rgba(245,197,66,0.18)] bg-[rgba(255,255,255,0.02)] px-4 py-5 text-sm text-[var(--muted)]">
              Nenhuma inscrição aguarda triagem neste momento.
            </div>
          ) : null}
        </div>
      </SectionCard>
    </div>
  );
}
