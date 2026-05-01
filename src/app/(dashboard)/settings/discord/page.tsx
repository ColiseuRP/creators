import { DiscordLogCard } from "@/components/discord-log-card";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { getDiscordChannelStatusItems } from "@/lib/discord-channels";
import { getDiscordLogs, getDiscordSettings } from "@/lib/data";
import {
  getServerEnvValue,
  isServerServiceRoleConfigured,
} from "@/lib/server-env";
import { requireSession } from "@/lib/session";

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
  const [settings, logs] = await Promise.all([
    getDiscordSettings(actor),
    getDiscordLogs(actor),
  ]);

  const channelStatuses = getDiscordChannelStatusItems(settings);
  const isDiscordBotTokenConfigured = Boolean(getServerEnvValue("DISCORD_BOT_TOKEN"));
  const isDiscordGuildConfigured = Boolean(getServerEnvValue("DISCORD_GUILD_ID"));
  const isDiscordCreatorsCategoryConfigured = Boolean(
    getServerEnvValue("DISCORD_CREATORS_CATEGORY_ID"),
  );
  const primaryNoticeChannel = channelStatuses.find(
    (channel) => channel.purpose === "notices",
  );
  const missingRequiredChannels = channelStatuses.filter(
    (channel) => channel.required && !channel.configured,
  );
  const isDiscordReady =
    isServerServiceRoleConfigured() &&
    isDiscordBotTokenConfigured &&
    isDiscordGuildConfigured &&
    isDiscordCreatorsCategoryConfigured &&
    Boolean(primaryNoticeChannel?.configured);

  const checks: Array<[string, boolean]> = [
    ["Chave interna da equipe", isServerServiceRoleConfigured()],
    ["Credencial do bot", isDiscordBotTokenConfigured],
    ["Servidor do Coliseu", isDiscordGuildConfigured],
    ["Categoria dos creators", isDiscordCreatorsCategoryConfigured],
    ["Canal principal de avisos", Boolean(primaryNoticeChannel?.configured)],
  ];

  return (
    <div className="space-y-6">
      <SectionCard
        title="Configurações do Discord"
        description="Acompanhe como cada envio do Creators Coliseu está distribuído entre os canais do servidor, sem expor informações sensíveis."
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
                    O bot, os canais e a base interna são conferidos aqui antes de qualquer
                    envio para o Discord.
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
                    {settings?.guild_id || "Aguardando configuração"}
                  </p>
                </div>
                <div className="rounded-2xl border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                    Categoria dos creators
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--white)]">
                    {settings?.creators_category_id || "Aguardando configuração"}
                  </p>
                </div>
                <div className="rounded-2xl border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                    Canal geral salvo internamente
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--white)]">
                    {settings?.general_creators_channel_id || "Aguardando configuração"}
                  </p>
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
          </div>

          <div className="rounded-[28px] border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-display text-2xl font-semibold tracking-tight text-[var(--white)]">
                  Canais por finalidade
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                  Cada bloco mostra o canal esperado para uma finalidade específica do
                  programa Creators Coliseu.
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
