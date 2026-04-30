import Link from "next/link";

import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { getCreators } from "@/lib/data";
import { requireSession } from "@/lib/session";
import { formatDate } from "@/lib/utils";

export default async function CreatorsPage() {
  const actor = await requireSession();
  const creators = await getCreators(actor);

  return (
    <SectionCard
      title="Creators"
      description="Visão operacional das salas individuais, perfis e canais do Discord."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {creators.map((creator) => (
          <Link
            key={creator.id}
            href={`/creators/${creator.id}`}
            className="rounded-[28px] border border-[rgba(19,32,45,0.08)] bg-white/85 p-5 transition hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(19,32,45,0.08)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-display text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                  {creator.name}
                </p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {creator.city_name} · {creator.category}
                </p>
              </div>
              <StatusBadge status={creator.status} />
            </div>

            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
              {creator.bio || "Sem biografia cadastrada."}
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl bg-[rgba(18,145,125,0.08)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                  Sala
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">
                  {creator.room?.title ?? "Sala ainda não criada"}
                </p>
              </div>
              <div className="rounded-2xl bg-[rgba(20,33,43,0.06)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                  Entrou em
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">
                  {formatDate(creator.joined_at, { dateStyle: "medium" })}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </SectionCard>
  );
}
