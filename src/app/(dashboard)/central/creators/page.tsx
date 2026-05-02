import Link from "next/link";

import { PublishTicketPanelButton } from "@/components/forms/publish-ticket-panel-button";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { getCreators, getDiscordTicketSnapshot } from "@/lib/data";
import { requireSession } from "@/lib/session";
import { formatDate, formatDateOnly } from "@/lib/utils";

export default async function CentralCreatorsPage() {
  const actor = await requireSession(["admin_general", "responsavel_creators"]);
  const [creators, ticketSnapshot] = await Promise.all([
    getCreators(actor),
    getDiscordTicketSnapshot(actor),
  ]);

  return (
    <div className="space-y-6">
      <SectionCard
        title="Tickets Discord"
        description="Acompanhe o movimento das salas privadas de atendimento e publique o painel oficial do Creators Coliseu sem sair da central."
      >
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-[rgba(245,197,66,0.12)] bg-[rgba(245,197,66,0.08)] px-4 py-4">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                Tickets abertos
              </p>
              <p className="mt-3 font-display text-3xl font-semibold text-[var(--white)]">
                {ticketSnapshot.openCount}
              </p>
            </div>

            <div className="rounded-[24px] border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-4">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                Tickets fechados
              </p>
              <p className="mt-3 font-display text-3xl font-semibold text-[var(--white)]">
                {ticketSnapshot.closedCount}
              </p>
            </div>

            <div className="rounded-[24px] border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-4">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                Arquivados
              </p>
              <p className="mt-3 font-display text-3xl font-semibold text-[var(--white)]">
                {ticketSnapshot.archivedCount}
              </p>
            </div>
          </div>

          <div className="rounded-[28px] border border-[rgba(245,197,66,0.12)] bg-[rgba(18,10,5,0.38)] p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="font-display text-2xl font-semibold tracking-tight text-[var(--white)]">
                  Painel de atendimento
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                  Publique ou atualize a mensagem com botão no canal de tickets para
                  abrir salas privadas dos creators.
                </p>
              </div>

              <StatusBadge
                status={ticketSnapshot.panel ? "sent" : "pending"}
                label={ticketSnapshot.panel ? "Painel ativo" : "Painel pendente"}
              />
            </div>

            <div className="mt-5 rounded-[24px] border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                Último painel registrado
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--white)]">
                {ticketSnapshot.panel
                  ? `${ticketSnapshot.panel.channel_id} / mensagem ${ticketSnapshot.panel.message_id}`
                  : "Nenhum painel publicado até o momento."}
              </p>
              {ticketSnapshot.panel ? (
                <p className="mt-2 text-xs leading-6 text-[var(--muted)]">
                  Atualizado em {formatDate(ticketSnapshot.panel.updated_at)}
                </p>
              ) : null}
            </div>

            <div className="mt-5">
              <PublishTicketPanelButton />
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-display text-2xl font-semibold tracking-tight text-[var(--white)]">
              Últimos tickets criados
            </p>
            <p className="text-sm text-[var(--muted)]">
              Total registrado: {ticketSnapshot.totalCount}
            </p>
          </div>

          {ticketSnapshot.recentTickets.length > 0 ? (
            <div className="grid gap-3">
              {ticketSnapshot.recentTickets.map((ticket) => (
                <article
                  key={ticket.id}
                  className="rounded-[24px] border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] p-4"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[var(--white)]">
                        {ticket.discord_username}
                      </p>
                      <div className="mt-1 space-y-1 text-xs leading-6 text-[var(--muted)]">
                        <p>Usuário: {ticket.discord_user_id}</p>
                        <p>Canal: {ticket.channel_id}</p>
                        <p>Criado em {formatDate(ticket.created_at)}</p>
                        {ticket.closed_at ? (
                          <p>Encerrado em {formatDate(ticket.closed_at)}</p>
                        ) : null}
                      </div>
                    </div>

                    <StatusBadge status={ticket.status} />
                  </div>

                  {ticket.close_reason ? (
                    <p className="mt-3 rounded-2xl border border-[rgba(245,197,66,0.12)] bg-[rgba(18,10,5,0.38)] px-4 py-3 text-sm leading-6 text-[var(--muted)]">
                      <span className="font-semibold text-[var(--white)]">
                        Encerramento:
                      </span>{" "}
                      {ticket.close_reason}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-[rgba(245,197,66,0.18)] bg-[rgba(255,255,255,0.02)] px-4 py-5 text-sm text-[var(--muted)]">
              Nenhum ticket registrado até o momento.
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Central de Creators"
        description="Visão geral dos nomes que hoje representam o Coliseu RP, com leitura rápida da sala, situação e entrada na equipe."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {creators.map((creator) => (
            <Link
              key={creator.id}
              href={`/central/creators/${creator.id}`}
              className="rounded-[28px] border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] p-5 transition hover:-translate-y-0.5 hover:border-[rgba(245,197,66,0.24)] hover:shadow-[0_18px_45px_rgba(245,197,66,0.08)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-display text-2xl font-semibold tracking-tight text-[var(--white)]">
                    {creator.name}
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {creator.city_name} / {creator.category}
                  </p>
                </div>
                <StatusBadge status={creator.status} />
              </div>

              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                {creator.bio ||
                  "Creator oficial da arena, pronto para fortalecer a cidade com conteúdo."}
              </p>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-[rgba(245,197,66,0.12)] bg-[rgba(245,197,66,0.08)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                    Sala do Creator
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--white)]">
                    {creator.room?.title ?? "Sala ainda não criada"}
                  </p>
                </div>
                <div className="rounded-2xl border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                    Entrou na equipe
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--white)]">
                    {formatDateOnly(creator.joined_at)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {creators.length === 0 ? (
          <div className="mt-4 rounded-[24px] border border-dashed border-[rgba(245,197,66,0.18)] bg-[rgba(255,255,255,0.02)] px-4 py-5 text-sm text-[var(--muted)]">
            Nenhum creator foi encontrado.
          </div>
        ) : null}
      </SectionCard>
    </div>
  );
}
