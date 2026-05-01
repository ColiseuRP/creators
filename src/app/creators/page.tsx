import Link from "next/link";
import { Crown, MapPin, Mic, Star } from "lucide-react";

import { PublicShell } from "@/components/public-shell";
import { getPublicCreators } from "@/lib/data";
import { getSessionContext } from "@/lib/session";

export default async function PublicCreatorsPage() {
  const actor = await getSessionContext();
  const creators = await getPublicCreators();

  return (
    <PublicShell actor={actor} activeHref="/creators">
      <section className="page-shell pb-14 pt-10 lg:pb-20 lg:pt-14">
        <div className="surface-card px-6 py-8 lg:px-10 lg:py-10">
          <p className="eyebrow">Creators Oficiais</p>
          <h1 className="mt-4 font-display text-5xl font-semibold tracking-tight text-[var(--white)]">
            Vozes que representam a cidade dentro e fora da arena.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--muted)]">
            Conheça alguns dos creators que carregam o nome do Coliseu RP em
            streams, vídeos, cortes e histórias que ajudam a fortalecer a cidade.
          </p>
        </div>
      </section>

      <section className="page-shell pb-16">
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {creators.map((creator) => (
            <article key={creator.id} className="surface-card gold-frame p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-display text-2xl font-semibold text-[var(--white)]">
                    {creator.name}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-[var(--gold)]">
                    <span className="inline-flex items-center gap-1">
                      <Mic className="h-3.5 w-3.5" />
                      {creator.category}
                    </span>
                  </div>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(245,197,66,0.18)] bg-[rgba(245,197,66,0.08)] text-[var(--gold)]">
                  <Crown className="h-5 w-5" />
                </div>
              </div>

              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                {creator.bio || "Creator oficial da arena, ativo na comunidade e na produção de conteúdo."}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.02)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    Cidade
                  </p>
                  <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[var(--white)]">
                    <MapPin className="h-4 w-4 text-[var(--gold)]" />
                    {creator.city_name}
                  </p>
                </div>
                <div className="rounded-2xl border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.02)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    Selo
                  </p>
                  <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[var(--white)]">
                    <Star className="h-4 w-4 text-[var(--gold)]" />
                    Creator Coliseu
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="surface-card-strong mt-8 flex flex-col items-start justify-between gap-4 p-6 lg:flex-row lg:items-center">
          <div>
            <p className="font-display text-2xl font-semibold text-[var(--white)]">
              Quer entrar para a equipe oficial?
            </p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              Envie sua inscrição para a análise da equipe Creators Coliseu.
            </p>
          </div>
          <Link href="/inscricao" className="button-gold">
            Quero ser Creator
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}
