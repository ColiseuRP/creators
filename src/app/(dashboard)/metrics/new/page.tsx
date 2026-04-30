import { MetricSubmissionForm } from "@/components/forms/metric-submission-form";
import { SectionCard } from "@/components/section-card";
import { requireSession } from "@/lib/session";

export default async function NewMetricPage() {
  const actor = await requireSession(["creator"]);

  return (
    <SectionCard
      title="Enviar métrica"
      description="Registre uma nova entrega com evidências anexadas no Supabase Storage."
    >
      <MetricSubmissionForm creatorName={actor.creator?.name ?? "creator"} />
    </SectionCard>
  );
}
