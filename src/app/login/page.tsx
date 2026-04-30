import { ShieldCheck, UploadCloud, Workflow } from "lucide-react";
import { redirect } from "next/navigation";

import { signInAction } from "@/app/actions/auth";
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
      <section className="flex flex-1 flex-col justify-between rounded-[36px] border border-[rgba(19,32,45,0.08)] bg-[rgba(19,32,45,0.95)] p-8 text-white shadow-[0_30px_100px_rgba(19,32,45,0.25)]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/58">
            Creators Hub
          </p>
          <h1 className="mt-5 max-w-xl font-display text-5xl font-semibold tracking-tight">
            Governança de creators com Supabase seguro e fluxo pronto para Vercel.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72">
            O projeto já nasce com autenticação, RLS, storage privado para prints, logs de Discord e APIs protegidas para reviews e avisos.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-[28px] border border-white/10 bg-white/6 p-5">
            <ShieldCheck className="h-6 w-6 text-[#9be6d8]" />
            <p className="mt-4 font-semibold">Auth + RLS</p>
            <p className="mt-2 text-sm leading-6 text-white/68">
              Perfis por papel e acesso isolado por creator.
            </p>
          </article>
          <article className="rounded-[28px] border border-white/10 bg-white/6 p-5">
            <UploadCloud className="h-6 w-6 text-[#ffd89c]" />
            <p className="mt-4 font-semibold">Storage privado</p>
            <p className="mt-2 text-sm leading-6 text-white/68">
              Upload seguro com preview e regras por pasta.
            </p>
          </article>
          <article className="rounded-[28px] border border-white/10 bg-white/6 p-5">
            <Workflow className="h-6 w-6 text-[#ffa970]" />
            <p className="mt-4 font-semibold">Backend first</p>
            <p className="mt-2 text-sm leading-6 text-white/68">
              Discord, service role e aprovações sempre no servidor.
            </p>
          </article>
        </div>
      </section>

      <section className="w-full max-w-[520px] rounded-[36px] border border-[rgba(19,32,45,0.08)] bg-[var(--surface)]/92 p-8 shadow-[0_28px_90px_rgba(19,32,45,0.14)] backdrop-blur">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
            Acesso ao painel
          </p>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            Entrar no ambiente
          </h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            {isMockMode
              ? "Sem credenciais do Supabase no ambiente, o projeto entra automaticamente em modo demo para desenvolvimento."
              : "Use a conta cadastrada no Supabase Auth. O papel é resolvido pelo perfil salvo na tabela profiles."}
          </p>
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl bg-rose-100 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {isMockMode ? (
          <div className="space-y-4">
            {[
              {
                role: "admin_general",
                label: "Entrar como Admin Geral",
                description: "Acesso completo a creators, aprovações, avisos e Discord.",
              },
              {
                role: "responsavel_creators",
                label: "Entrar como Responsável Creators",
                description: "Gestão de creators, métricas, avisos e reviews.",
              },
              {
                role: "creator",
                label: "Entrar como Creator",
                description: "Acesso apenas à sala própria, métricas e histórico.",
              },
            ].map((option) => (
              <form
                key={option.role}
                action={signInAction}
                className="rounded-[28px] border border-[rgba(19,32,45,0.08)] bg-white p-5"
              >
                <input type="hidden" name="role" value={option.role} />
                <p className="font-display text-xl font-semibold tracking-tight text-[var(--foreground)]">
                  {option.label}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {option.description}
                </p>
                <button
                  type="submit"
                  className="mt-5 rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent)]"
                >
                  Abrir demonstração
                </button>
              </form>
            ))}
          </div>
        ) : (
          <form action={signInAction} className="space-y-4">
            <label className="block space-y-2 text-sm font-medium text-[var(--foreground)]">
              <span>Email</span>
              <input
                name="email"
                type="email"
                required
                placeholder="voce@empresa.com"
                className="w-full rounded-2xl border border-[rgba(19,32,45,0.12)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
              />
            </label>

            <label className="block space-y-2 text-sm font-medium text-[var(--foreground)]">
              <span>Senha</span>
              <input
                name="password"
                type="password"
                required
                placeholder="Sua senha"
                className="w-full rounded-2xl border border-[rgba(19,32,45,0.12)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
              />
            </label>

            <button
              type="submit"
              className="mt-2 inline-flex rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
            >
              Entrar
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
