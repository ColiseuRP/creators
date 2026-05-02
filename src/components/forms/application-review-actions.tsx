"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, LoaderCircle, XCircle } from "lucide-react";

import type { CreatorApplicationStatus } from "@/lib/types";

interface ReviewResponsePayload {
  success?: boolean;
  message?: string;
  warnings?: string[];
}

interface ApplicationReviewActionsProps {
  applicationId: string;
  status: CreatorApplicationStatus;
}

export function ApplicationReviewActions({
  applicationId,
  status,
}: ApplicationReviewActionsProps) {
  const router = useRouter();
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<"success" | "warning" | "error" | null>(
    null,
  );

  if (status !== "pending") {
    return null;
  }

  function buildMessage(payload: ReviewResponsePayload | undefined) {
    const baseMessage = payload?.message ?? "Alteração concluída com sucesso.";

    if (!payload?.warnings?.length) {
      return baseMessage;
    }

    return `${baseMessage} ${payload.warnings.join(" ")}`;
  }

  async function handleApprove() {
    setIsApproving(true);
    setFeedback(null);
    setFeedbackTone(null);

    try {
      const response = await fetch(`/api/applications/${applicationId}/approve`, {
        method: "POST",
      });

      const payload = (await response.json()) as {
        data?: ReviewResponsePayload;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Não foi possível aprovar a inscrição.");
      }

      setFeedback(buildMessage(payload.data));
      setFeedbackTone(payload.data?.warnings?.length ? "warning" : "success");
      setShowRejectForm(false);
      setRejectionReason("");
      router.refresh();
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Não foi possível aprovar a inscrição.",
      );
      setFeedbackTone("error");
    } finally {
      setIsApproving(false);
    }
  }

  async function handleReject() {
    setIsRejecting(true);
    setFeedback(null);
    setFeedbackTone(null);

    try {
      const response = await fetch(`/api/applications/${applicationId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rejectionReason,
        }),
      });

      const payload = (await response.json()) as {
        data?: ReviewResponsePayload;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Não foi possível negar a inscrição.");
      }

      setFeedback(buildMessage(payload.data));
      setFeedbackTone(payload.data?.warnings?.length ? "warning" : "success");
      setShowRejectForm(false);
      setRejectionReason("");
      router.refresh();
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Não foi possível negar a inscrição.",
      );
      setFeedbackTone("error");
    } finally {
      setIsRejecting(false);
    }
  }

  return (
    <div className="space-y-4 rounded-[24px] border border-[rgba(245,197,66,0.12)] bg-[rgba(18,10,5,0.38)] p-4">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={isApproving || isRejecting}
          onClick={handleApprove}
          className="inline-flex items-center rounded-full border border-[rgba(46,139,87,0.35)] bg-[rgba(46,139,87,0.18)] px-4 py-2 text-sm font-semibold text-[#d7ffe8] transition hover:border-[rgba(46,139,87,0.5)] hover:bg-[rgba(46,139,87,0.24)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isApproving ? (
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="mr-2 h-4 w-4" />
          )}
          <span>{isApproving ? "Aprovando..." : "Aprovar"}</span>
        </button>

        <button
          type="button"
          disabled={isApproving || isRejecting}
          onClick={() => {
            setShowRejectForm((current) => !current);
            setFeedback(null);
            setFeedbackTone(null);
          }}
          className="inline-flex items-center rounded-full border border-[rgba(139,30,30,0.4)] bg-[rgba(139,30,30,0.18)] px-4 py-2 text-sm font-semibold text-[#ffd0d0] transition hover:border-[rgba(139,30,30,0.52)] hover:bg-[rgba(139,30,30,0.24)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          <XCircle className="mr-2 h-4 w-4" />
          <span>{showRejectForm ? "Cancelar negação" : "Negar"}</span>
        </button>
      </div>

      {showRejectForm ? (
        <div className="space-y-3 rounded-[22px] border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] p-4">
          <label className="block space-y-2 text-sm font-medium text-[var(--white)]">
            <span>Motivo da negação</span>
            <textarea
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              rows={4}
              placeholder="Informe com clareza o motivo da negação."
              className="field-textarea"
            />
          </label>

          <button
            type="button"
            disabled={isApproving || isRejecting || rejectionReason.trim().length < 5}
            onClick={handleReject}
            className="inline-flex items-center rounded-full border border-[rgba(245,197,66,0.3)] bg-[rgba(245,197,66,0.14)] px-4 py-2 text-sm font-semibold text-[var(--gold)] transition hover:border-[rgba(245,197,66,0.5)] hover:bg-[rgba(245,197,66,0.2)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isRejecting ? (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="mr-2 h-4 w-4" />
            )}
            <span>{isRejecting ? "Negando..." : "Confirmar negação"}</span>
          </button>
        </div>
      ) : null}

      {feedback ? (
        <div
          className={
            feedbackTone === "success"
              ? "rounded-2xl border border-[rgba(46,139,87,0.35)] bg-[rgba(46,139,87,0.18)] px-4 py-3 text-sm leading-7 text-[#d7ffe8]"
              : feedbackTone === "warning"
                ? "rounded-2xl border border-[rgba(245,197,66,0.35)] bg-[rgba(245,197,66,0.14)] px-4 py-3 text-sm leading-7 text-[#fff0bf]"
                : "rounded-2xl border border-[rgba(139,30,30,0.4)] bg-[rgba(139,30,30,0.2)] px-4 py-3 text-sm leading-7 text-[#ffd0d0]"
          }
        >
          {feedback}
        </div>
      ) : null}
    </div>
  );
}
