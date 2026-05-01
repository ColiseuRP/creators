"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, LoaderCircle, XCircle } from "lucide-react";

interface MetricReviewPanelProps {
  metricId: string;
}

export function MetricReviewPanel({ metricId }: MetricReviewPanelProps) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState<"approved" | "rejected" | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleReview(decision: "approved" | "rejected") {
    setIsLoading(decision);
    setError(null);
    setFeedback(null);

    try {
      const response = await fetch(
        `/api/metrics/${metricId}/${decision === "approved" ? "approve" : "deny"}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reason,
          }),
        },
      );

      const payload = (await response.json()) as {
        data?: { discordStatus?: string; errorMessage?: string | null };
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Nao foi possivel concluir a analise.");
      }

      const extra =
        payload.data?.discordStatus && payload.data.discordStatus !== "sent"
          ? ` Aviso no Discord: ${payload.data.errorMessage ?? payload.data.discordStatus}.`
          : "";

      setFeedback(
        decision === "approved"
          ? `Metrica aprovada. Continue representando o Coliseu!${extra}`
          : `Metrica negada. O motivo foi registrado para o creator.${extra}`,
      );
      setReason("");
      router.refresh();
    } catch (reviewError) {
      setError(
        reviewError instanceof Error
          ? reviewError.message
          : "Falha inesperada ao revisar a metrica.",
      );
    } finally {
      setIsLoading(null);
    }
  }

  return (
    <div className="rounded-[24px] border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] p-4">
      <p className="font-semibold text-[var(--white)]">Analise da metrica</p>
      <textarea
        rows={3}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Motivo da aprovacao ou da negativa"
        className="field-textarea mt-3"
      />

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={Boolean(isLoading)}
          onClick={() => handleReview("approved")}
          className="button-gold"
        >
          {isLoading === "approved" ? (
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="mr-2 h-4 w-4" />
          )}
          Aprovar
        </button>

        <button
          type="button"
          disabled={Boolean(isLoading)}
          onClick={() => handleReview("rejected")}
          className="inline-flex items-center rounded-full border border-[rgba(139,30,30,0.4)] bg-[rgba(139,30,30,0.2)] px-4 py-3 text-sm font-semibold text-[#ffd0d0] transition hover:bg-[rgba(139,30,30,0.3)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading === "rejected" ? (
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <XCircle className="mr-2 h-4 w-4" />
          )}
          Negar
        </button>
      </div>

      {feedback ? (
        <div className="mt-4 rounded-2xl border border-[rgba(46,139,87,0.35)] bg-[rgba(46,139,87,0.18)] px-4 py-3 text-sm text-[#d7ffe8]">
          {feedback}
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-2xl border border-[rgba(139,30,30,0.4)] bg-[rgba(139,30,30,0.2)] px-4 py-3 text-sm text-[#ffd0d0]">
          {error}
        </div>
      ) : null}
    </div>
  );
}
