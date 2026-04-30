import Link from "next/link";

import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { getRoomView } from "@/lib/data";
import { requireSession } from "@/lib/session";

export default async function RoomPage() {
  const actor = await requireSession();
  const roomView = await getRoomView(actor);

  if (actor.role === "creator" && roomView && !Array.isArray(roomView)) {
    return (
      <SectionCard
        title={roomView.room?.title ?? "Minha sala"}
        description="Seu espaço individual com contexto, Discord e regras de operação."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-[24px] bg-white p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
              Creator
            </p>
            <p className="mt-3 font-display text-2xl font-semibold tracking-tight text-[var(--foreground)]">
              {roomView.name}
            </p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {roomView.city_name} · {roomView.category}
            </p>
          </div>

          <div className="rounded-[24px] bg-white p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
              Status
            </p>
            <div className="mt-3">
              <StatusBadge status={roomView.status} />
            </div>
          </div>

          <div className="rounded-[24px] bg-white p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
              Canal Discord
            </p>
            <p className="mt-3 break-all text-sm font-semibold text-[var(--foreground)]">
              {roomView.discord_channel_id || "Ainda não configurado"}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-[28px] border border-[rgba(19,32,45,0.08)] bg-[rgba(18,145,125,0.08)] p-5">
          <p className="font-semibold text-[var(--foreground)]">Descrição da sala</p>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
            {roomView.room?.description || "Nenhuma descrição registrada para sua sala."}
          </p>
          <Link
            href="/metrics/new"
            className="mt-5 inline-flex rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent)]"
          >
            Enviar nova métrica
          </Link>
        </div>
      </SectionCard>
    );
  }

  const rooms = Array.isArray(roomView) ? roomView : [];

  return (
    <SectionCard
      title="Salas dos creators"
      description="Visão consolidada das salas individuais existentes no ecossistema."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {rooms.map((creator) => (
          <article
            key={creator.id}
            className="rounded-[28px] border border-[rgba(19,32,45,0.08)] bg-white/88 p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-display text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                {creator.room?.title ?? creator.name}
              </p>
              <StatusBadge status={creator.status} />
            </div>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              {creator.room?.description || creator.bio || "Sem contexto adicional."}
            </p>
          </article>
        ))}
      </div>
    </SectionCard>
  );
}
