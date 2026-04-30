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
        throw new Error(payload.error ?? "Não foi possível concluir a revisão.");
      }

      const extra =
        payload.data?.discordStatus && payload.data.discordStatus !== "sent"
          ? ` Discord: ${payload.data.errorMessage ?? payload.data.discordStatus}.`
          : "";

      setFeedback(
        decision === "approved"
          ? `Métrica aprovada com sucesso.${extra}`
          : `Métrica negada com sucesso.${extra}`,
      );
      setReason("");
      router.refresh();
    } catch (reviewError) {
      setError(
        reviewError instanceof Error
          ? reviewError.message
          : "Falha inesperada ao revisar a métrica.",
      );
    } finally {
      setIsLoading(null);
    }
  }

  return (
    <div className="rounded-[24px] border border-[rgba(19,32,45,0.08)] bg-[rgba(255,255,255,0.7)] p-4">
      <p className="font-semibold text-[var(--foreground)]">Análise da métrica</p>
      <textarea
        rows={3}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Motivo da aprovação ou negação"
        className="mt-3 w-full rounded-2xl border border-[rgba(19,32,45,0.12)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
      />

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={Boolean(isLoading)}
          onClick={() => handleReview("approved")}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading === "approved" ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          <span>Aprovar</span>
        </button>

        <button
          type="button"
          disabled={Boolean(isLoading)}
          onClick={() => handleReview("rejected")}
          className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading === "rejected" ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <span>Negar</span>
        </button>
      </div>

      {feedback ? (
        <div className="mt-4 rounded-2xl bg-emerald-100 px-4 py-3 text-sm text-emerald-700">
          {feedback}
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-2xl bg-rose-100 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}
