import { Crown, Shield, Swords, Trophy } from "lucide-react";

import { ApplicationForm } from "@/components/forms/application-form";
import { PublicShell } from "@/components/public-shell";
import { getSessionContext } from "@/lib/session";

export default async function ApplyPage() {
  const actor = await getSessionContext();

  return (
    <PublicShell actor={actor} activeHref="/inscricao">
      <section className="page-shell pb-14 pt-10 lg:pb-20 lg:pt-14">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="surface-card p-6 lg:p-8">
            <p className="eyebrow">Inscrição oficial</p>
            <h1 className="mt-4 font-display text-5xl font-semibold tracking-tight text-[var(--white)]">
              Quer representar o Coliseu RP como creator?
            </h1>
            <p className="mt-5 text-base leading-8 text-[var(--muted)]">
              Envie sua inscrição para análise da equipe. Avaliaremos seu perfil,
              frequência de conteúdo e postura dentro da comunidade.
            </p>

            <div className="mt-8 grid gap-4">
              {[
                {
                  title: "Postura e presença",
                  text: "A equipe observa sua conduta, sua constância e a forma como você representa a cidade.",
                  icon: Shield,
                },
                {
                  title: "Conteúdo alinhado",
                  text: "Seu material precisa conversar com a atmosfera, a história e os momentos do Coliseu RP.",
                  icon: Swords,
                },
                {
                  title: "Destaque oficial",
                  text: "Creators aprovados ganham visibilidade, espaço próprio e proximidade com a equipe.",
                  icon: Trophy,
                },
              ].map(({ title, text, icon: Icon }) => (
                <article key={title} className="surface-card-strong p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(245,197,66,0.18)] bg-[rgba(245,197,66,0.08)] text-[var(--gold)]">
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

          <div className="surface-card gold-frame p-6 lg:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(245,197,66,0.2)] bg-[rgba(245,197,66,0.08)] text-[var(--gold)]">
                <Crown className="h-5 w-5" />
              </div>
              <div>
                <p className="eyebrow">Formulário de entrada</p>
                <p className="text-sm leading-7 text-[var(--muted)]">
                  Preencha com calma e mostre por que seu conteúdo merece um lugar na arena.
                </p>
              </div>
            </div>

            <ApplicationForm />
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
