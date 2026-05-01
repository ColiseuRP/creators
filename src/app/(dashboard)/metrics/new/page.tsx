import { MetricSubmissionForm } from "@/components/forms/metric-submission-form";
import { SectionCard } from "@/components/section-card";
import { requireSession } from "@/lib/session";

export default async function NewMetricPage() {
  const actor = await requireSession(["creator"]);

  return (
    <SectionCard
      title="Enviar métrica"
      description="Envie os prints e as informações do seu conteúdo para análise da equipe responsável."
    >
      <MetricSubmissionForm creatorName={actor.creator?.name ?? "Creator"} />
    </SectionCard>
  );
}
