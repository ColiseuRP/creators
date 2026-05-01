import Link from "next/link";
import {
  Crown,
  Radio,
  Shield,
  Swords,
  Trophy,
  Users,
} from "lucide-react";

import { ColiseuLogo } from "@/components/coliseu-logo";
import { PublicShell } from "@/components/public-shell";
import { getRoleHomePath } from "@/lib/permissions";
import { getSessionContext } from "@/lib/session";

export default async function Home() {
  const actor = await getSessionContext();
  const areaHref =
    actor.role === "creator"
      ? "/metrics/new"
      : actor.role
        ? getRoleHomePath(actor.role)
        : "/login";

  return (
    <PublicShell actor={actor} activeHref="/">
      <section className="page-shell pb-16 pt-10 lg:pb-24 lg:pt-16">
        <div className="surface-card gold-frame overflow-hidden px-6 py-8 lg:px-10 lg:py-12">
          <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="mb-6">
                <ColiseuLogo
                  priorityLabel="O espaço oficial dos criadores"
                  imageClassName="scale-[1.08]"
                />
              </div>

              <p className="eyebrow">Arena oficial de creators</p>
              <h1 className="hero-title mt-4">Creators Coliseu</h1>
              <p className="mt-4 max-w-2xl text-xl text-[var(--white)]">
                O espaço oficial dos criadores de conteúdo do Coliseu RP.
              </p>
              <p className="mt-4 max-w-2xl font-display text-2xl font-medium text-[var(--gold)]">
                Entre para a arena, represente a cidade e mostre sua história para o mundo.
              </p>
              <p className="mt-6 max-w-3xl text-base leading-8 text-[var(--muted)]">
                O Creators Coliseu foi criado para reunir e valorizar os criadores de
                conteúdo que ajudam a movimentar, divulgar e fortalecer a nossa cidade.
                Aqui, streamers, influencers e produtores de conteúdo têm um espaço
                próprio para acompanhar suas entregas, enviar métricas e receber avisos
                da equipe.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/inscricao" className="button-gold">
                  Quero ser Creator
                </Link>
                <Link href="/creators" className="button-ghost">
                  Ver Creators
                </Link>
                <Link href={areaHref} className="button-dark">
                  Enviar métricas
                </Link>
              </div>
            </div>

            <div className="grid gap-4">
              {[
                {
                  title: "Destaque dentro da comunidade",
                  text: "Ganhe espaço na cidade com uma presença forte, reconhecida e bem representada.",
                  icon: Crown,
                },
                {
                  title: "Divulgação oficial",
                  text: "Conteúdos e entregas podem entrar nas ações da equipe Creators Coliseu.",
                  icon: Radio,
                },
                {
                  title: "Sala do Creator",
                  text: "Um ambiente próprio para acompanhar métricas, avisos e o histórico da sua jornada.",
                  icon: Shield,
                },
              ].map(({ title, text, icon: Icon }) => (
                <article key={title} className="surface-card-strong p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(245,197,66,0.22)] bg-[rgba(245,197,66,0.08)] text-[var(--gold)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-display text-xl font-semibold text-[var(--white)]">
                        {title}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{text}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell pb-16">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="surface-card p-6 lg:p-8">
            <p className="eyebrow">O que move a arena</p>
            <h2 className="mt-4 font-display text-3xl font-semibold text-[var(--white)]">
              Uma frente oficial para quem dá voz, ritmo e alcance ao Coliseu RP.
            </h2>
            <p className="mt-4 text-sm leading-8 text-[var(--muted)]">
              O projeto une creators, equipe e comunidade em torno de uma identidade
              forte. Cada entrega ajuda a mostrar a cidade, valorizar histórias e
              fortalecer a presença do Coliseu para quem já vive a experiência e para
              quem ainda vai entrar nela.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                title: "Reconhecimento oficial",
                text: "Destaque como Creator Coliseu com espaço próprio dentro da operação.",
                icon: Trophy,
              },
              {
                title: "Ações especiais",
                text: "Participação em campanhas, eventos e movimentos importantes da cidade.",
                icon: Swords,
              },
              {
                title: "Cargo exclusivo no Discord",
                text: "Presença alinhada com a equipe e comunicação mais direta com a central.",
                icon: Shield,
              },
              {
                title: "Força coletiva",
                text: "Creators oficiais reunidos para ampliar a voz da cidade dentro e fora da arena.",
                icon: Users,
              },
            ].map(({ title, text, icon: Icon }) => (
              <article key={title} className="surface-card p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(245,197,66,0.2)] bg-[rgba(245,197,66,0.08)] text-[var(--gold)]">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-4 font-display text-xl font-semibold text-[var(--white)]">
                  {title}
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
