import Link from "next/link";

import { SectionCard } from "@/components/section-card";
import { StatusBadge } from "@/components/status-badge";
import { getCreators } from "@/lib/data";
import { requireSession } from "@/lib/session";
import { formatDate } from "@/lib/utils";

export default async function CentralCreatorsPage() {
  const actor = await requireSession(["admin_general", "responsavel_creators"]);
  const creators = await getCreators(actor);

  return (
    <SectionCard
      title="Central de Creators"
      description="Visao geral dos nomes que hoje representam o Coliseu RP, com leitura rapida da sala, situacao e entrada na equipe."
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
              {creator.bio || "Creator oficial da arena, pronto para fortalecer a cidade com conteudo."}
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-[rgba(245,197,66,0.12)] bg-[rgba(245,197,66,0.08)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                  Sala do creator
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--white)]">
                  {creator.room?.title ?? "Sala ainda nao criada"}
                </p>
              </div>
              <div className="rounded-2xl border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                  Entrou na equipe
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--white)]">
                  {formatDate(creator.joined_at, { dateStyle: "medium" })}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {creators.length === 0 ? (
        <div className="mt-4 rounded-[24px] border border-dashed border-[rgba(245,197,66,0.18)] bg-[rgba(255,255,255,0.02)] px-4 py-5 text-sm text-[var(--muted)]">
          Nenhum creator foi registrado na central ainda.
        </div>
      ) : null}
    </SectionCard>
  );
}
