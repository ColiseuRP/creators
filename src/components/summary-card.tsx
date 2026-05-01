interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle: string;
}

export function SummaryCard({ title, value, subtitle }: SummaryCardProps) {
  return (
    <article className="surface-card-strong rounded-[26px] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--gold)]">
        {title}
      </p>
      <p className="mt-4 font-display text-4xl font-semibold tracking-tight text-[var(--white)]">
        {value}
      </p>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{subtitle}</p>
    </article>
  );
}
