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
    <section
      className={cn(
        "rounded-[28px] border border-[rgba(19,32,45,0.08)] bg-[var(--surface)]/95 p-6 shadow-[0_20px_60px_rgba(19,32,45,0.08)] backdrop-blur",
        className,
      )}
    >
      <div className="mb-5 flex flex-col gap-1">
        <h2 className="font-display text-xl font-semibold tracking-tight text-[var(--foreground)]">
          {title}
        </h2>
        {description ? (
          <p className="max-w-2xl text-sm text-[var(--muted)]">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
