interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle: string;
}

export function SummaryCard({ title, value, subtitle }: SummaryCardProps) {
  return (
    <article className="rounded-[24px] border border-[rgba(19,32,45,0.08)] bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(240,247,244,0.95))] p-5 shadow-[0_16px_40px_rgba(19,32,45,0.07)]">
      <p className="text-sm font-medium uppercase tracking-[0.22em] text-[var(--muted)]">
        {title}
      </p>
      <p className="mt-4 font-display text-4xl font-semibold tracking-tight text-[var(--foreground)]">
        {value}
      </p>
      <p className="mt-3 text-sm text-[var(--muted)]">{subtitle}</p>
    </article>
  );
}
