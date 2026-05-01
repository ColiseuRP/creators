"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Crown,
  FileBarChart,
  LayoutGrid,
  Radio,
  ScrollText,
  Shield,
  Sword,
  Users,
} from "lucide-react";

import { ColiseuLogo } from "@/components/coliseu-logo";
import type { AppRole } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SidebarProps {
  role: AppRole;
}

const creatorLinks = [
  { href: "/dashboard", label: "Resumo", icon: LayoutGrid },
  { href: "/room", label: "Sala do Creator", icon: Shield },
  { href: "/metrics", label: "Metricas", icon: FileBarChart },
  { href: "/metrics/new", label: "Enviar metrica", icon: Radio },
  { href: "/notices", label: "Avisos", icon: Bell },
];

const staffLinks = [
  { href: "/dashboard", label: "Central", icon: Crown },
  { href: "/central/creators", label: "Creators", icon: Users },
  { href: "/applications", label: "Inscricoes", icon: ScrollText },
  { href: "/metrics", label: "Metricas", icon: FileBarChart },
  { href: "/notices", label: "Avisos", icon: Bell },
  { href: "/settings/discord", label: "Discord", icon: Radio },
] as const;

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const links = role === "creator" ? creatorLinks : staffLinks;

  return (
    <aside className="surface-card-strong sticky top-6 flex h-[calc(100vh-3rem)] flex-col justify-between p-5">
      <div>
        <ColiseuLogo priorityLabel={role === "creator" ? "Sala do Creator" : "Central de Creators"} />

        <div className="mt-8 rounded-[26px] border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.02)] p-4">
          <p className="eyebrow">{role === "creator" ? "Sua jornada" : "Comando da arena"}</p>
          <h2 className="mt-3 font-display text-2xl font-semibold text-[var(--white)]">
            {role === "creator" ? "Sala do Creator" : "Central de Creators"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            {role === "creator"
              ? "Acompanhe entregas, avisos e seu historico dentro da arena."
              : "Mantenha os creators alinhados, analise metricas e coordene a operacao."}
          </p>
        </div>

        <nav className="mt-6 space-y-2">
          {links.map(({ href, label, icon: Icon }) => {
            const isActive =
              pathname === href ||
              (href !== "/dashboard" && pathname.startsWith(href));

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition",
                  isActive
                    ? "border-[rgba(245,197,66,0.4)] bg-[rgba(245,197,66,0.12)] text-[var(--gold)] shadow-[0_0_28px_rgba(245,197,66,0.1)]"
                    : "border-transparent text-[var(--muted)] hover:border-[rgba(245,197,66,0.18)] hover:bg-[rgba(255,255,255,0.03)] hover:text-[var(--white)]",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="rounded-[24px] border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.02)] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(245,197,66,0.18)] bg-[rgba(245,197,66,0.08)] text-[var(--gold)]">
            <Sword className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--white)]">Coliseu RP</p>
            <p className="text-xs leading-5 text-[var(--muted)]">
              Ambiente oficial para operacao, avisos e acompanhamento dos creators.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
