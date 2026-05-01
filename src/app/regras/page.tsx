import { CheckCircle2, Crown, ScrollText, ShieldAlert, Swords } from "lucide-react";

import { PublicShell } from "@/components/public-shell";
import { getSessionContext } from "@/lib/session";

const benefits = [
  "Destaque dentro da comunidade",
  "Divulgacao oficial",
  "Cargo exclusivo no Discord",
  "Participacao em acoes especiais",
  "Reconhecimento como Creator Coliseu",
  "Espaco proprio para envio de metricas",
];

const requirements = [
  "Ter boa conduta dentro e fora da cidade",
  "Representar bem o Coliseu RP",
  "Produzir conteudo relacionado a cidade",
  "Respeitar players, equipe e comunidade",
  "Manter frequencia de lives, videos ou postagens",
  "Nao prejudicar a imagem da cidade",
];

export default async function RulesPage() {
  const actor = await getSessionContext();

  return (
    <PublicShell actor={actor} activeHref="/regras">
      <section className="page-shell pb-14 pt-10 lg:pb-20 lg:pt-14">
        <div className="surface-card px-6 py-8 lg:px-10 lg:py-10">
          <p className="eyebrow">Regras e criterios</p>
          <h1 className="mt-4 font-display text-5xl font-semibold tracking-tight text-[var(--white)]">
            A arena valoriza quem honra o nome da cidade.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--muted)]">
            Para representar o Coliseu RP como creator oficial, a postura dentro da
            comunidade pesa tanto quanto a qualidade do conteudo. A equipe analisa
            frequencia, presenca, responsabilidade e alinhamento com a cidade.
          </p>
        </div>
      </section>

      <section className="page-shell grid gap-6 pb-16 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="surface-card p-6 lg:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(245,197,66,0.2)] bg-[rgba(245,197,66,0.08)] text-[var(--gold)]">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <p className="eyebrow">Beneficios</p>
              <h2 className="font-display text-3xl font-semibold text-[var(--white)]">
                O que o creator conquista
              </h2>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {benefits.map((benefit) => (
              <div
                key={benefit}
                className="flex items-start gap-3 rounded-2xl border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.02)] px-4 py-3"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-[var(--gold)]" />
                <p className="text-sm leading-7 text-[var(--muted)]">{benefit}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="surface-card-strong p-6 lg:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(245,197,66,0.2)] bg-[rgba(245,197,66,0.08)] text-[var(--gold)]">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <p className="eyebrow">Requisitos</p>
                <h2 className="font-display text-3xl font-semibold text-[var(--white)]">
                  O que a equipe observa
                </h2>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {requirements.map((requirement) => (
                <div
                  key={requirement}
                  className="flex items-start gap-3 rounded-2xl border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.02)] px-4 py-3"
                >
                  <Swords className="mt-0.5 h-5 w-5 text-[var(--gold)]" />
                  <p className="text-sm leading-7 text-[var(--muted)]">{requirement}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-card p-6">
            <div className="flex items-center gap-3">
              <ScrollText className="h-5 w-5 text-[var(--gold)]" />
              <p className="font-display text-2xl font-semibold text-[var(--white)]">
                Compromisso com a cidade
              </p>
            </div>
            <p className="mt-4 text-sm leading-8 text-[var(--muted)]">
              O creator oficial do Coliseu RP carrega a imagem da cidade em cada live,
              video, postagem e interacao com a comunidade. Por isso, a equipe valoriza
              constancia, maturidade e respeito em todas as frentes.
            </p>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
