import { DiscordLogCard } from "@/components/discord-log-card";
import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import {
  isDiscordBotTokenConfigured,
  isDiscordConfigured,
  isDiscordCreatorsCategoryConfigured,
  isDiscordGeneralChannelConfigured,
  isDiscordGuildConfigured,
  isServiceRoleConfigured,
} from "@/lib/env";
import { getDiscordLogs, getDiscordSettings } from "@/lib/data";
import { requireSession } from "@/lib/session";

export default async function DiscordSettingsPage() {
  const actor = await requireSession(["admin_general", "responsavel_creators"]);
  const [settings, logs] = await Promise.all([
    getDiscordSettings(actor),
    getDiscordLogs(actor),
  ]);

  const checks: Array<[string, boolean]> = [
    ["Chave interna da equipe", isServiceRoleConfigured],
    ["Credencial do bot", isDiscordBotTokenConfigured],
    ["Servidor do Coliseu", isDiscordGuildConfigured],
    ["Categoria dos creators", isDiscordCreatorsCategoryConfigured],
    ["Canal geral dos creators", isDiscordGeneralChannelConfigured],
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
            <DiscordLogCard key={log.id} log={log} />
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
