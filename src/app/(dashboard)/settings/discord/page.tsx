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
    ["SUPABASE_SERVICE_ROLE_KEY", isServiceRoleConfigured],
    ["DISCORD_BOT_TOKEN", Boolean(env.DISCORD_BOT_TOKEN)],
    ["DISCORD_GUILD_ID", Boolean(env.DISCORD_GUILD_ID)],
    ["DISCORD_CREATORS_CATEGORY_ID", Boolean(env.DISCORD_CREATORS_CATEGORY_ID)],
    [
      "DISCORD_GENERAL_CREATORS_CHANNEL_ID",
      Boolean(env.DISCORD_GENERAL_CREATORS_CHANNEL_ID),
    ],
  ];

  return (
    <div className="space-y-6">
      <SectionCard
        title="Configurações do Discord"
        description="Estado atual da integração e parâmetros carregados apenas no backend."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[28px] border border-[rgba(19,32,45,0.08)] bg-white p-5">
            <p className="font-display text-2xl font-semibold tracking-tight text-[var(--foreground)]">
              Integração {isDiscordConfigured ? "pronta" : "incompleta"}
            </p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              Tokens sensíveis continuam no backend. O frontend usa apenas as variáveis públicas do Supabase.
            </p>

            <div className="mt-5 space-y-3">
              {checks.map(([label, ready]) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-2xl bg-[rgba(20,33,43,0.06)] px-4 py-3"
                >
                  <p className="text-sm font-semibold text-[var(--foreground)]">{label}</p>
                  <StatusBadge status={ready ? "sent" : "failed"} />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-[rgba(19,32,45,0.08)] bg-white p-5">
            <p className="font-display text-2xl font-semibold tracking-tight text-[var(--foreground)]">
              Registro operacional
            </p>
            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl bg-[rgba(18,145,125,0.08)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                  Guild ID
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">
                  {settings?.guild_id || "Aguardando configuração"}
                </p>
              </div>
              <div className="rounded-2xl bg-[rgba(20,33,43,0.06)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                  Canal geral
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">
                  {settings?.general_creators_channel_id || "Aguardando configuração"}
                </p>
              </div>
              <div className="rounded-2xl bg-[rgba(20,33,43,0.06)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                  Envio automático
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">
                  {settings?.auto_send_enabled ? "Ativado" : "Desativado"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Logs recentes"
        description="Falhas de Discord não interrompem reviews ou avisos; o status fica registrado aqui."
      >
        <div className="space-y-4">
          {logs.map((log) => (
            <article
              key={log.id}
              className="rounded-[28px] border border-[rgba(19,32,45,0.08)] bg-white/88 p-5"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-semibold text-[var(--foreground)]">{log.message_type}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {formatDate(log.sent_at)} · canal {log.channel_id || "não definido"}
                  </p>
                </div>
                <StatusBadge status={log.status} />
              </div>
              {log.error_message ? (
                <p className="mt-4 rounded-2xl bg-rose-100 px-4 py-3 text-sm text-rose-700">
                  {log.error_message}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
