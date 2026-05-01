"use client";

import Link from "next/link";
import { useState } from "react";

import { cn } from "@/lib/utils";

interface ColiseuLogoProps {
  href?: string;
  className?: string;
  imageClassName?: string;
  showWordmark?: boolean;
  priorityLabel?: string;
}

export function ColiseuLogo({
  href,
  className,
  imageClassName,
  showWordmark = true,
  priorityLabel = "Creators Coliseu",
}: ColiseuLogoProps) {
  const [hasError, setHasError] = useState(false);

  const content = (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-[18px] border border-[rgba(245,197,66,0.35)] bg-[radial-gradient(circle_at_top,rgba(245,197,66,0.22),rgba(18,10,5,0.95))] shadow-[0_0_30px_rgba(245,197,66,0.15)]">
        {!hasError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/coliseu.png"
            alt="Logo Coliseu RP"
            className={cn("h-full w-full object-contain", imageClassName)}
            onError={() => setHasError(true)}
          />
        ) : (
          <span className="font-display text-lg font-bold tracking-[0.18em] text-[var(--gold)]">
            CR
          </span>
        )}
      </div>

      {showWordmark ? (
        <div className="min-w-0">
          <p className="font-display text-lg font-semibold uppercase tracking-[0.2em] text-[var(--gold)]">
            Coliseu RP
          </p>
          <p className="text-sm text-[var(--muted)]">{priorityLabel}</p>
        </div>
      ) : null}
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} aria-label="Creators Coliseu">
      {content}
    </Link>
  );
}
