"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Gauge,
  LayoutGrid,
  MessageSquareShare,
  Send,
  Settings2,
  Sparkles,
  Users,
} from "lucide-react";

import type { AppRole } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SidebarProps {
  role: AppRole;
}

const creatorLinks = [
  { href: "/dashboard", label: "Resumo", icon: LayoutGrid },
  { href: "/room", label: "Minha sala", icon: Users },
  { href: "/metrics", label: "Métricas", icon: Gauge },
  { href: "/metrics/new", label: "Enviar métrica", icon: Send },
  { href: "/notices", label: "Avisos", icon: Bell },
];

const staffLinks = [
  { href: "/dashboard", label: "Resumo", icon: LayoutGrid },
  { href: "/creators", label: "Creators", icon: Users },
  { href: "/applications", label: "Inscrições", icon: Sparkles },
  { href: "/metrics", label: "Métricas", icon: Gauge },
  { href: "/notices", label: "Avisos", icon: Bell },
  { href: "/settings/discord", label: "Discord", icon: Settings2 },
];

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const links = role === "creator" ? creatorLinks : staffLinks;

  return (
    <aside className="sticky top-6 flex h-[calc(100vh-3rem)] flex-col justify-between rounded-[32px] border border-[rgba(19,32,45,0.08)] bg-[rgba(19,32,45,0.94)] px-5 py-6 text-white shadow-[0_20px_70px_rgba(19,32,45,0.24)]">
      <div>
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.28em] text-white/60">Creators Hub</p>
          <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight">
            Painel operacional
          </h1>
        </div>

        <nav className="space-y-2">
          {links.map(({ href, label, icon: Icon }) => {
            const isActive =
              pathname === href ||
              (href !== "/dashboard" && pathname.startsWith(href));

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                  isActive
                    ? "bg-white text-[var(--foreground)] shadow-[0_10px_25px_rgba(19,32,45,0.18)]"
                    : "text-white/76 hover:bg-white/10 hover:text-white",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/8 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(255,255,255,0.12)]">
            <MessageSquareShare className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">Workflow seguro</p>
            <p className="text-xs leading-5 text-white/68">
              Auth, RLS, uploads e Discord roteados no backend.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
