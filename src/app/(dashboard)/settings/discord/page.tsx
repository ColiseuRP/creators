import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { env, isDiscordConfigured, isServiceRoleConfigured } from "@/lib/env";
import { getDiscordLogs, getDiscordSettings } from "@/lib/data";
import { requireSession } from "@/lib/session";
import { formatDate } from "@/lib/utils";

export default async function DiscordSettingsPage() {
  const actor = await requireSession(["admin_general", "responsavel_creators"]);
  const [settings, logs] = await Promise.all([
    getDiscordSettings(actor),
    getDiscordLogs(actor),
  ]);

  const checks: Array<[string, boolean]> = [
    ["Chave interna da equipe", isServiceRoleConfigured],
    ["Credencial do bot", Boolean(env.DISCORD_BOT_TOKEN)],
    ["Servidor do Coliseu", Boolean(env.DISCORD_GUILD_ID)],
    ["Categoria dos creators", Boolean(env.DISCORD_CREATORS_CATEGORY_ID)],
    ["Canal geral dos creators", Boolean(env.DISCORD_GENERAL_CREATORS_CHANNEL_ID)],
  ];

  return (
    <div className="space-y-6">
      <SectionCard
        title="Conexao com o Discord"
        description="Acompanhe se os avisos da equipe estao prontos para seguir da central ate as salas dos creators."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[28px] border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] p-5">
            <p className="font-display text-2xl font-semibold tracking-tight text-[var(--white)]">
              Comunicacao {isDiscordConfigured ? "pronta" : "incompleta"}
            </p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              Tudo o que e sensivel continua protegido. A equipe acompanha daqui apenas o estado geral da ligacao.
            </p>

            <div className="mt-5 space-y-3">
              {checks.map(([label, ready]) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-2xl border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-3"
                >
                  <p className="text-sm font-semibold text-[var(--white)]">{label}</p>
                  <StatusBadge status={ready ? "sent" : "failed"} />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] p-5">
            <p className="font-display text-2xl font-semibold tracking-tight text-[var(--white)]">
              Leitura da cidade
            </p>
            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl border border-[rgba(245,197,66,0.12)] bg-[rgba(245,197,66,0.08)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                  Servidor
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--white)]">
                  {settings?.guild_id || "Aguardando configuracao"}
                </p>
              </div>
              <div className="rounded-2xl border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                  Canal geral
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--white)]">
                  {settings?.general_creators_channel_id || "Aguardando configuracao"}
                </p>
              </div>
              <div className="rounded-2xl border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                  Envio automatico
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--white)]">
                  {settings?.auto_send_enabled ? "Ativado" : "Desativado"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Historico de envios"
        description="Se uma mensagem falhar, o registro fica salvo aqui sem interromper a decisao tomada pela equipe."
      >
        <div className="space-y-4">
          {logs.map((log) => (
            <article
              key={log.id}
              className="rounded-[28px] border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] p-5"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-semibold text-[var(--white)]">{log.message_type}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {formatDate(log.sent_at)} / canal {log.channel_id || "nao definido"}
                  </p>
                </div>
                <StatusBadge status={log.status} />
              </div>
              {log.error_message ? (
                <p className="mt-4 rounded-2xl border border-[rgba(139,30,30,0.4)] bg-[rgba(139,30,30,0.2)] px-4 py-3 text-sm text-[#ffd0d0]">
                  {log.error_message}
                </p>
              ) : null}
            </article>
          ))}

          {logs.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[rgba(245,197,66,0.18)] bg-[rgba(255,255,255,0.02)] px-4 py-5 text-sm text-[var(--muted)]">
              Ainda nao existem registros recentes de envio.
            </div>
          ) : null}
        </div>
      </SectionCard>
    </div>
  );
}
