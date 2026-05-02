import Link from "next/link";
import { Crown, Shield, Swords } from "lucide-react";
import { redirect } from "next/navigation";

import { switchDemoRoleAction } from "@/app/actions/auth";
import { ColiseuLogo } from "@/components/coliseu-logo";
import { LoginForm } from "@/components/forms/login-form";
import { isMockMode } from "@/lib/env";
import { getRoleHomePath, getRoleLabel } from "@/lib/permissions";
import { getSessionContext } from "@/lib/session";
import type { AppRole } from "@/lib/types";

interface LoginPageProps {
  searchParams: Promise<{
    error?: string;
  }>;
}

const demoOptions: Array<{
  role: AppRole;
  label: string;
  description: string;
}> = [
  {
    role: "admin_general",
    label: "Entrar como Administrador Geral",
    description:
      "Acesso completo à Central de Creators, creators, métricas, avisos, tickets e configurações.",
  },
  {
    role: "responsavel_creators",
    label: "Entrar como Responsável Creators",
    description:
      "Gestão de creators, métricas, avisos e tickets da operação Creators Coliseu.",
  },
  {
    role: "creator",
    label: "Entrar como Creator",
    description: "Acesso apenas à própria sala, métricas e avisos recebidos.",
  },
];

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const actor = await getSessionContext();

  if (actor.user && actor.profile && actor.role) {
    redirect(getRoleHomePath(actor.role));
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
            <p className="mt-4 font-semibold text-[var(--white)]">Representação oficial</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Um ambiente forte, sério e alinhado com a identidade do Coliseu RP.
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
              : "Use seu acesso para entrar na sua sala ou na Central de Creators."}
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex text-sm font-semibold text-[var(--gold)] hover:text-[var(--white)]"
          >
            Voltar para o início
          </Link>
        </div>

        {error && isMockMode ? (
          <div className="mb-6 rounded-2xl border border-[rgba(139,30,30,0.45)] bg-[rgba(139,30,30,0.2)] px-4 py-3 text-sm text-[#ffd0d0]">
            {error}
          </div>
        ) : null}

        {isMockMode ? (
          <div className="space-y-4">
            {demoOptions.map((option) => (
              <form
                key={option.role}
                action={switchDemoRoleAction}
                className="surface-card p-5"
              >
                <input type="hidden" name="role" value={option.role} />
                <p className="font-display text-xl font-semibold tracking-tight text-[var(--white)]">
                  {option.label}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {option.description}
                </p>
                <div className="mt-4 rounded-2xl border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[var(--muted)]">
                  Perfil:{" "}
                  <span className="font-semibold text-[var(--white)]">
                    {getRoleLabel(option.role)}
                  </span>
                </div>
                <button type="submit" className="button-gold mt-5">
                  Entrar na demonstração
                </button>
              </form>
            ))}
          </div>
        ) : (
          <LoginForm initialError={error} />
        )}
      </section>
    </div>
  );
}
