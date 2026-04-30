import type { ReactNode } from "react";

import { signOutAction, switchDemoRoleAction } from "@/app/actions/auth";
import { Sidebar } from "@/components/sidebar";
import type { AppRole, SessionContext } from "@/lib/types";

const roleLabels: Record<AppRole, string> = {
  admin_general: "Admin geral",
  responsavel_creators: "Responsável Creators",
  creator: "Creator",
};

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

  return (
    <div className="mx-auto flex w-full max-w-[1680px] gap-6 px-4 py-6 lg:px-6">
      <div className="hidden w-[295px] shrink-0 xl:block">
        <Sidebar role={actor.role} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <header className="rounded-[28px] border border-[rgba(19,32,45,0.08)] bg-[var(--surface)]/90 px-6 py-5 shadow-[0_18px_50px_rgba(19,32,45,0.06)] backdrop-blur">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                Operação creators
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h2 className="font-display text-3xl font-semibold tracking-tight text-[var(--foreground)]">
                  {actor.profile.name}
                </h2>
                <span className="rounded-full bg-[rgba(18,145,125,0.12)] px-3 py-1 text-xs font-semibold text-[var(--accent-strong)]">
                  {roleLabels[actor.role]}
                </span>
                {actor.mockMode ? (
                  <span className="rounded-full bg-[rgba(242,162,65,0.18)] px-3 py-1 text-xs font-semibold text-[var(--sunset)]">
                    Modo demo
                  </span>
                ) : (
                  <span className="rounded-full bg-[rgba(41,160,106,0.12)] px-3 py-1 text-xs font-semibold text-emerald-700">
                    Supabase ativo
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Workspace pronto para Vercel, Supabase Auth, Storage privado e reviews com logs no Discord.
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:items-end">
              {actor.mockMode ? (
                <div className="flex flex-wrap gap-2">
                  {(["admin_general", "responsavel_creators", "creator"] as AppRole[]).map(
                    (role) => (
                      <form key={role} action={switchDemoRoleAction}>
                        <input type="hidden" name="role" value={role} />
                        <button
                          type="submit"
                          className="rounded-full border border-[rgba(19,32,45,0.12)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                        >
                          {roleLabels[role]}
                        </button>
                      </form>
                    ),
                  )}
                </div>
              ) : null}

              <form action={signOutAction}>
                <button
                  type="submit"
                  className="rounded-full bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent)]"
                >
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
