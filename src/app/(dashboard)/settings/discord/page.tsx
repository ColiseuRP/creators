import { DiscordLogCard } from "@/components/discord-log-card";
import { PublishTicketPanelButton } from "@/components/forms/publish-ticket-panel-button";
import { TestDiscordButton } from "@/components/forms/test-discord-button";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { getDiscordChannelStatusItems } from "@/lib/discord-channels";
import { getDiscordLogs, getDiscordSettings, getDiscordTicketSnapshot } from "@/lib/data";
import {
  getServerEnvValue,
  isServerServiceRoleConfigured,
} from "@/lib/server-env";
import { requireSession } from "@/lib/session";
import { formatDate } from "@/lib/utils";

function getSourceLabel(source: "env" | "fallback" | "database" | "missing") {
  switch (source) {
    case "env":
      return "Variável configurada";
    case "fallback":
      return "Usando fallback";
    case "database":
      return "Usando valor interno";
    case "missing":
    default:
      return "Aguardando configuração";
  }
}

export default async function DiscordSettingsPage() {
  const actor = await requireSession(["admin_general", "responsavel_creators"]);
  const [settings, logs, ticketSnapshot] = await Promise.all([
    getDiscordSettings(actor),
    getDiscordLogs(actor),
    getDiscordTicketSnapshot(actor),
  ]);

  const channelStatuses = getDiscordChannelStatusItems(settings);
  const isDiscordBotTokenConfigured = Boolean(getServerEnvValue("DISCORD_BOT_TOKEN"));
  const isDiscordGuildConfigured = Boolean(getServerEnvValue("DISCORD_GUILD_ID"));
  const isDiscordCitizenRoleConfigured = Boolean(getServerEnvValue("DISCORD_CITIZEN_ROLE_ID"));
  const isDiscordCreatorsCategoryConfigured = Boolean(
    getServerEnvValue("DISCORD_CREATORS_CATEGORY_ID"),
  );
  const hasStaffRoleIds = Boolean(getServerEnvValue("DISCORD_STAFF_ROLE_IDS"));
  const primaryNoticeChannel = channelStatuses.find(
    (channel) => channel.purpose === "notices",
  );
  const ticketChannel = channelStatuses.find((channel) => channel.purpose === "ticket");
  const missingRequiredChannels = channelStatuses.filter(
    (channel) => channel.required && !channel.configured,
  );
  const isDiscordReady =
    isServerServiceRoleConfigured() &&
    isDiscordBotTokenConfigured &&
    isDiscordGuildConfigured &&
    isDiscordCitizenRoleConfigured &&
    isDiscordCreatorsCategoryConfigured &&
    hasStaffRoleIds &&
    Boolean(primaryNoticeChannel?.configured) &&
    Boolean(ticketChannel?.configured);

  const checks: Array<[string, boolean]> = [
    ["Chave interna da equipe", isServerServiceRoleConfigured()],
    ["Credencial do bot", isDiscordBotTokenConfigured],
    ["Servidor do Coliseu", isDiscordGuildConfigured],
    ["Cargo Cidadão", isDiscordCitizenRoleConfigured],
    ["Categoria dos creators", isDiscordCreatorsCategoryConfigured],
    ["Cargos da staff de tickets", hasStaffRoleIds],
    ["Canal principal de avisos", Boolean(primaryNoticeChannel?.configured)],
    ["Canal de tickets", Boolean(ticketChannel?.configured)],
  ];

  return (
    <div className="space-y-6">
      <SectionCard
        title="Configurações do Discord"
        description="Acompanhe a estrutura do Creators Coliseu no Discord sem expor informações sensíveis do bot ou da operação."
      >
        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <div className="rounded-[28px] border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-display text-2xl font-semibold tracking-tight text-[var(--white)]">
                    Comunicação {isDiscordReady ? "pronta" : "com pendências"}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                    O bot, os canais e o atendimento dos creators são conferidos aqui antes de qualquer envio ou abertura de ticket.
                  </p>
                </div>

                <StatusBadge status={isDiscordReady ? "sent" : "failed"} />
              </div>

              <div className="mt-5 space-y-3">
                {checks.map(([label, ready]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-2xl border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-[var(--white)]">{label}</p>
                    <StatusBadge
                      status={ready ? "sent" : "failed"}
                      label={ready ? "Configurado" : "Pendente"}
                    />
                  </div>
                ))}
              </div>

              {missingRequiredChannels.length > 0 ? (
                <div className="mt-5 rounded-[24px] border border-[rgba(139,30,30,0.42)] bg-[rgba(139,30,30,0.18)] px-4 py-4 text-sm leading-7 text-[#ffd2d2]">
                  <p className="font-semibold text-[#ffe7e7]">
                    Ainda faltam canais para completar a estrutura do Discord:
                  </p>
                  <div className="mt-2 space-y-1">
                    {missingRequiredChannels.map((channel) => (
                      <p key={channel.purpose}>• {channel.label}</p>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-[24px] border border-[rgba(46,139,87,0.32)] bg-[rgba(46,139,87,0.15)] px-4 py-4 text-sm leading-7 text-[#d8ffea]">
                  Todos os canais dedicados do Discord estão configurados para o programa.
                </div>
              )}
            </div>

            <div className="rounded-[28px] border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] p-5">
              <p className="font-display text-2xl font-semibold tracking-tight text-[var(--white)]">
                Leitura interna
              </p>
              <div className="mt-5 grid gap-3">
                <div className="rounded-2xl border border-[rgba(245,197,66,0.12)] bg-[rgba(245,197,66,0.08)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                    Servidor
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--white)]">
                    {settings?.guild_id || getServerEnvValue("DISCORD_GUILD_ID") || "Aguardando configuração"}
                  </p>
                </div>

                <div className="rounded-2xl border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                    Categoria dos creators
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--white)]">
                    {settings?.creators_category_id ||
                      getServerEnvValue("DISCORD_CREATORS_CATEGORY_ID") ||
                      "Aguardando configuração"}
                  </p>
                </div>

                <div className="rounded-2xl border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                    Cargo Cidadão
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--white)]">
                    {getServerEnvValue("DISCORD_CITIZEN_ROLE_ID") || "Aguardando configuração"}
                  </p>
                </div>

                <div className="rounded-2xl border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                    Staff dos tickets
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--white)]">
                    {getServerEnvValue("DISCORD_STAFF_ROLE_IDS") || "Aguardando configuração"}
                  </p>
                </div>

                <div className="rounded-2xl border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                    Categoria de arquivados
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--white)]">
                    {getServerEnvValue("DISCORD_ARCHIVED_TICKETS_CATEGORY_ID") ||
                      "Não configurada"}
                  </p>
                </div>

                <div className="rounded-2xl border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                    Painel de tickets
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

                <div className="rounded-2xl border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                    Envio automático
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--white)]">
                    {settings?.auto_send_enabled ? "Ativado" : "Desativado"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] p-5">
              <p className="font-display text-2xl font-semibold tracking-tight text-[var(--white)]">
                Teste de envio
              </p>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                Envie uma mensagem de teste para o canal de avisos configurado e confirme rapidamente se a integração está pronta.
              </p>
              <div className="mt-5 rounded-2xl border border-[rgba(245,197,66,0.12)] bg-[rgba(18,10,5,0.38)] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                  Canal de avisos atual
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--white)]">
                  {primaryNoticeChannel?.channelId || "Canal de avisos do Discord não configurado."}
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                  A mensagem de teste usa o canal dedicado de avisos do programa.
                </p>
                <div className="mt-4">
                  <TestDiscordButton />
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] p-5">
              <p className="font-display text-2xl font-semibold tracking-tight text-[var(--white)]">
                Painel de tickets
              </p>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                Publique ou atualize a mensagem fixa do canal de tickets com o botão de abertura da sala do creator.
              </p>
              <div className="mt-5 rounded-2xl border border-[rgba(245,197,66,0.12)] bg-[rgba(18,10,5,0.38)] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                  Canal de tickets atual
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--white)]">
                  {ticketChannel?.channelId || "Canal de tickets do Discord não configurado."}
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                  O painel é atualizado para evitar mensagens duplicadas quando já existir um registro salvo.
                </p>
                <div className="mt-4">
                  <PublishTicketPanelButton />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-display text-2xl font-semibold tracking-tight text-[var(--white)]">
                  Canais por finalidade
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                  Cada bloco mostra o canal esperado para uma finalidade específica do programa Creators Coliseu.
                </p>
              </div>
              <StatusBadge
                status={missingRequiredChannels.length === 0 ? "sent" : "failed"}
                label={
                  missingRequiredChannels.length === 0
                    ? "Tudo configurado"
                    : "Configuração pendente"
                }
              />
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {channelStatuses.map((channel) => (
                <div
                  key={channel.purpose}
                  className="rounded-[24px] border border-[rgba(245,197,66,0.12)] bg-[rgba(18,10,5,0.38)] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--white)]">
                        {channel.label}
                      </p>
                      <p className="mt-1 text-xs leading-6 text-[var(--muted)]">
                        {channel.description}
                      </p>
                    </div>

                    <StatusBadge
                      status={channel.configured ? "sent" : "failed"}
                      label={channel.configured ? "Configurado" : "Pendente"}
                    />
                  </div>

                  <div className="mt-4 rounded-2xl border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                      Canal atual
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[var(--white)]">
                      {channel.channelId || "Aguardando configuração"}
                    </p>
                    <p className="mt-2 text-xs leading-6 text-[var(--muted)]">
                      {getSourceLabel(channel.source)}
                    </p>
                    {channel.note ? (
                      <p className="mt-1 text-xs leading-6 text-[var(--muted)]">
                        {channel.note}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Histórico de envios"
        description="Cada tentativa registra tipo da mensagem, canal de destino, status do envio e o motivo da falha quando houver."
      >
        <div className="space-y-4">
          {logs.map((log) => (
            <DiscordLogCard key={log.id} log={log} />
          ))}

          {logs.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[rgba(245,197,66,0.18)] bg-[rgba(255,255,255,0.02)] px-4 py-5 text-sm text-[var(--muted)]">
              Nenhum envio para o Discord encontrado.
            </div>
          ) : null}
        </div>
      </SectionCard>
    </div>
  );
}
