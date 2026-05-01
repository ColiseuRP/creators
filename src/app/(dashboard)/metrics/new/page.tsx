import { MetricSubmissionForm } from "@/components/forms/metric-submission-form";
import { SectionCard } from "@/components/section-card";
import { requireSession } from "@/lib/session";

export default async function NewMetricPage() {
  const actor = await requireSession(["creator"]);

  return (
    <SectionCard
      title="Enviar metrica"
      description="Envie os prints e as informacoes do seu conteudo para analise da equipe responsavel."
    >
      <MetricSubmissionForm creatorName={actor.creator?.name ?? "creator"} />
    </SectionCard>
  );
}
