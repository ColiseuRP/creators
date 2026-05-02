import type { ReactNode } from "react";
import Link from "next/link";

import { signOutAction, switchDemoRoleAction } from "@/app/actions/auth";
import { ColiseuLogo } from "@/components/coliseu-logo";
import { Sidebar } from "@/components/sidebar";
import { getRoleLabel } from "@/lib/permissions";
import type { AppRole, SessionContext } from "@/lib/types";

export function AppShell({
  actor,
  children,
}: {
  actor: SessionContext;
  children: ReactNode;
}) {
  if (!actor.role || !actor.profile) {
    return <>{children}</>;
  }

  const panelTitle =
    actor.role === "creator" ? "Sala do Creator" : "Central de Creators";

  return (
    <div className="mx-auto flex w-full max-w-[1680px] gap-6 px-4 py-6 lg:px-6">
      <div className="hidden w-[315px] shrink-0 xl:block">
        <Sidebar role={actor.role} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <header className="surface-card gold-frame px-6 py-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <ColiseuLogo href="/" priorityLabel={panelTitle} showWordmark={false} />
              <div>
                <p className="eyebrow">{panelTitle}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <h2 className="font-display text-3xl font-semibold tracking-tight text-[var(--white)]">
                    {actor.profile.name}
                  </h2>
                  <span className="rounded-full border border-[rgba(245,197,66,0.22)] bg-[rgba(245,197,66,0.08)] px-3 py-1 text-xs font-semibold text-[var(--gold)]">
                    {getRoleLabel(actor.role)}
                  </span>
                  {actor.mockMode ? (
                    <span className="rounded-full border border-[rgba(245,197,66,0.22)] bg-[rgba(255,255,255,0.04)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
                      Demonstração
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--muted)]">
                  {actor.role === "creator"
                    ? "Seu espaço para acompanhar entregas, métricas e avisos da equipe Creators Coliseu."
                    : "Ambiente oficial da equipe para conduzir análises, creators, avisos, tickets e histórico da arena."}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:items-end">
              <div className="flex flex-wrap gap-2">
                <Link href="/" className="button-dark">
                  Ver página inicial
                </Link>
                {actor.mockMode
                  ? (["admin_general", "responsavel_creators", "creator"] as AppRole[]).map(
                      (role) => (
                        <form key={role} action={switchDemoRoleAction}>
                          <input type="hidden" name="role" value={role} />
                          <button type="submit" className="button-ghost">
                            {getRoleLabel(role)}
                          </button>
                        </form>
                      ),
                    )
                  : null}
              </div>

              <form action={signOutAction}>
                <button type="submit" className="button-gold">
                  Sair
                </button>
              </form>
            </div>
          </div>
        </header>

        <main className="space-y-6">{children}</main>
      </div>
    </div>
  );
}
