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
        title="Sala do Creator"
        description="Seu espaço oficial para acompanhar sua identidade na cidade, sua situação atual e os detalhes da sua sala."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-[24px] border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
              Resumo do creator
            </p>
            <p className="mt-3 font-display text-2xl font-semibold tracking-tight text-[var(--white)]">
              {roomView.name}
            </p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {roomView.city_name} / {roomView.category}
            </p>
          </div>

          <div className="rounded-[24px] border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
              Status
            </p>
            <div className="mt-3">
              <StatusBadge status={roomView.status} />
            </div>
          </div>

          <div className="rounded-[24px] border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
              Sala no Discord
            </p>
            <p className="mt-3 break-all text-sm font-semibold text-[var(--white)]">
              {roomView.discord_channel_id || "Ainda não configurado"}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-[28px] border border-[rgba(245,197,66,0.14)] bg-[rgba(245,197,66,0.08)] p-5">
          <p className="font-semibold text-[var(--white)]">
            {roomView.room?.title ?? "Sua sala na arena"}
          </p>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
            {roomView.room?.description || "Nenhuma descrição foi registrada para sua sala ainda."}
          </p>
          <Link href="/metrics/new" className="button-gold mt-5">
            Enviar Nova Métrica
          </Link>
        </div>
      </SectionCard>
    );
  }

  const rooms = Array.isArray(roomView) ? roomView : [];

  return (
    <SectionCard
      title="Salas dos creators"
      description="Leitura consolidada das salas individuais que hoje fazem parte da estrutura oficial da cidade."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {rooms.map((creator) => (
          <article
            key={creator.id}
            className="rounded-[28px] border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-display text-2xl font-semibold tracking-tight text-[var(--white)]">
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

      {rooms.length === 0 ? (
        <div className="mt-4 rounded-[24px] border border-dashed border-[rgba(245,197,66,0.18)] bg-[rgba(255,255,255,0.02)] px-4 py-5 text-sm text-[var(--muted)]">
          Nenhuma sala foi registrada ainda.
        </div>
      ) : null}
    </SectionCard>
  );
}
