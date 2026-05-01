import type { ReactNode } from "react";
import Link from "next/link";

import { ColiseuLogo } from "@/components/coliseu-logo";
import type { SessionContext } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PublicShellProps {
  actor: SessionContext;
  activeHref: "/" | "/creators" | "/regras" | "/inscricao";
  children: ReactNode;
}

const links = [
  { href: "/", label: "Inicio" },
  { href: "/creators", label: "Creators Oficiais" },
  { href: "/regras", label: "Regras" },
  { href: "/inscricao", label: "Inscricao" },
] as const;

function getAreaLink(actor: SessionContext) {
  if (!actor.user || !actor.profile) {
    return {
      href: "/login",
      label: "Entrar",
    };
  }

  return {
    href: actor.role === "creator" ? "/room" : "/dashboard",
    label: actor.role === "creator" ? "Sala do Creator" : "Central de Creators",
  };
}

export function PublicShell({
  actor,
  activeHref,
  children,
}: PublicShellProps) {
  const areaLink = getAreaLink(actor);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-[rgba(245,197,66,0.14)] bg-[rgba(10,6,4,0.88)] backdrop-blur-xl">
        <div className="mx-auto w-full max-w-[1320px] px-4 py-4 lg:px-6">
          <div className="flex items-center justify-between gap-6">
            <ColiseuLogo href="/" priorityLabel="Sistema oficial dos creators" />

            <nav className="hidden items-center gap-2 lg:flex">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-semibold text-[var(--muted)] transition hover:text-[var(--white)]",
                    activeHref === link.href &&
                      "bg-[rgba(245,197,66,0.12)] text-[var(--gold)] shadow-[0_0_24px_rgba(245,197,66,0.12)]",
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <Link href={areaLink.href} className="button-gold hidden sm:inline-flex">
                {areaLink.label}
              </Link>
              <Link href="/inscricao" className="button-ghost inline-flex lg:hidden">
                Inscricao
              </Link>
            </div>
          </div>

          <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "shrink-0 rounded-full border border-transparent px-4 py-2 text-sm font-semibold text-[var(--muted)] transition hover:text-[var(--white)]",
                  activeHref === link.href
                    ? "border-[rgba(245,197,66,0.22)] bg-[rgba(245,197,66,0.12)] text-[var(--gold)]"
                    : "bg-[rgba(255,255,255,0.03)]",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-[rgba(245,197,66,0.12)] bg-[rgba(10,6,4,0.92)]">
        <div className="mx-auto grid w-full max-w-[1320px] gap-8 px-4 py-10 lg:grid-cols-[1.2fr_0.8fr] lg:px-6">
          <div className="space-y-4">
            <ColiseuLogo href="/" priorityLabel="Creators Coliseu" />
            <div className="space-y-2 text-sm leading-7 text-[var(--muted)]">
              <p className="font-semibold text-[var(--white)]">Coliseu RP</p>
              <p>Sistema oficial de organizacao dos Creators Coliseu.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="eyebrow">Links rapidos</p>
              <div className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                {links.map((link) => (
                  <Link key={link.href} href={link.href} className="block hover:text-[var(--gold)]">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="eyebrow">Area oficial</p>
              <div className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                <p>Creators Coliseu</p>
                <p>Equipe Coliseu RP</p>
                <p>Comunidade, arena e historia.</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
