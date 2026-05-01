import Link from "next/link";
import { Crown, Shield, Swords } from "lucide-react";
import { redirect } from "next/navigation";

import { signInAction } from "@/app/actions/auth";
import { ColiseuLogo } from "@/components/coliseu-logo";
import { isMockMode } from "@/lib/env";
import { getSessionContext } from "@/lib/session";

interface LoginPageProps {
  searchParams: Promise<{
    error?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const actor = await getSessionContext();

  if (actor.user && actor.profile) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const error =
    typeof params.error === "string" ? decodeURIComponent(params.error) : null;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1520px] flex-col justify-center gap-10 px-4 py-10 lg:flex-row lg:items-stretch lg:px-6">
      <section className="surface-card-strong flex flex-1 flex-col justify-between p-8 lg:p-10">
        <div>
          <ColiseuLogo priorityLabel="A arena oficial dos creators" />
          <p className="eyebrow mt-8">Acesso oficial</p>
          <h1 className="mt-5 max-w-xl font-display text-5xl font-semibold tracking-tight text-[var(--white)]">
            Acesso Creators Coliseu
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">
            Entre para acessar sua sala, enviar métricas e acompanhar seus avisos.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <article className="surface-card p-5">
            <Shield className="h-6 w-6 text-[var(--gold)]" />
            <p className="mt-4 font-semibold text-[var(--white)]">Sala do Creator</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Acompanhe sua jornada, seus avisos e o histórico das suas entregas.
            </p>
          </article>
          <article className="surface-card p-5">
            <Swords className="h-6 w-6 text-[var(--gold)]" />
            <p className="mt-4 font-semibold text-[var(--white)]">Central da equipe</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Analise entregas, envie avisos e mantenha a operação alinhada.
            </p>
          </article>
          <article className="surface-card p-5">
            <Crown className="h-6 w-6 text-[var(--gold)]" />
            <p className="mt-4 font-semibold text-[var(--white)]">Representacao oficial</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Um ambiente forte, serio e alinhado com a identidade do Coliseu RP.
            </p>
          </article>
        </div>
      </section>

      <section className="surface-card gold-frame w-full max-w-[520px] p-8">
        <div className="mb-8">
          <p className="eyebrow">Entrada da arena</p>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-[var(--white)]">
            Entrar no sistema
          </h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            {isMockMode
              ? "Escolha um perfil de demonstração para visualizar os acessos da operação."
              : "Use seu acesso para entrar na sua sala ou na central da equipe."}
          </p>
          <Link href="/" className="mt-5 inline-flex text-sm font-semibold text-[var(--gold)] hover:text-[var(--white)]">
            Voltar para o início
          </Link>
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-[rgba(139,30,30,0.45)] bg-[rgba(139,30,30,0.2)] px-4 py-3 text-sm text-[#ffd0d0]">
            {error}
          </div>
        ) : null}

        {isMockMode ? (
          <div className="space-y-4">
            {[
              {
                role: "admin_general",
                label: "Entrar como Admin Geral",
                description: "Acesso completo a creators, análises, avisos e histórico.",
              },
              {
                role: "responsavel_creators",
                label: "Entrar como Responsável Creators",
                description: "Gestão de creators, métricas, avisos e revisões.",
              },
              {
                role: "creator",
                label: "Entrar como Creator",
                description: "Acesso à própria sala, métricas e avisos recebidos.",
              },
            ].map((option) => (
              <form
                key={option.role}
                action={signInAction}
                className="surface-card p-5"
              >
                <input type="hidden" name="role" value={option.role} />
                <p className="font-display text-xl font-semibold tracking-tight text-[var(--white)]">
                  {option.label}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {option.description}
                </p>
                <button
                  type="submit"
                  className="button-gold mt-5"
                >
                  Entrar na demonstração
                </button>
              </form>
            ))}
          </div>
        ) : (
          <form action={signInAction} className="space-y-4">
            <label className="block space-y-2 text-sm font-medium text-[var(--white)]">
              <span>Email</span>
              <input
                name="email"
                type="email"
                required
                placeholder="nome@exemplo.com"
                className="field-input"
              />
            </label>

            <label className="block space-y-2 text-sm font-medium text-[var(--white)]">
              <span>Senha</span>
              <input
                name="password"
                type="password"
                required
                placeholder="Sua senha"
                className="field-input"
              />
            </label>

            <button type="submit" className="button-gold mt-2">
              Entrar
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
