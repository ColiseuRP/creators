import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface SectionCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function SectionCard({
  title,
  description,
  children,
  className,
}: SectionCardProps) {
  return (
    <section className={cn("surface-card gold-frame p-6 lg:p-7", className)}>
      <div className="mb-5 flex flex-col gap-2">
        <p className="eyebrow">Creators Coliseu</p>
        <h2 className="font-display text-2xl font-semibold tracking-tight text-[var(--white)]">
          {title}
        </h2>
        {description ? (
          <p className="max-w-3xl text-sm leading-7 text-[var(--muted)]">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
