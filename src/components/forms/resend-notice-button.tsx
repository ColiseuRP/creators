"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";

export function ResendNoticeButton({
  noticeId,
  compact = false,
}: {
  noticeId: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isWarning, setIsWarning] = useState(false);

  async function handleResend() {
    setIsLoading(true);
    setFeedback(null);
    setIsWarning(false);

    try {
      const response = await fetch(`/api/notices/${noticeId}/resend`, {
        method: "POST",
      });
      const payload = (await response.json()) as {
        data?: {
          success?: boolean;
          message?: string;
          error?: string | null;
        };
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Não foi possível reenviar o aviso.");
      }

      const resendResult = payload.data;
      const isPartialFailure = resendResult?.success === false;
      const baseMessage =
        resendResult?.message ?? "Tentativa de reenvio concluída com sucesso.";

      setFeedback(
        isPartialFailure && resendResult?.error
          ? `${baseMessage} ${resendResult.error}`
          : baseMessage,
      );
      setIsWarning(isPartialFailure);
      router.refresh();
    } catch (resendError) {
      setFeedback(
        resendError instanceof Error
          ? resendError.message
          : "Não foi possível reenviar o aviso.",
      );
      setIsWarning(true);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={cn("space-y-2", compact && "min-w-[112px] text-right")}>
      <button
        type="button"
        disabled={isLoading}
        onClick={handleResend}
        className={cn(
          "inline-flex items-center justify-center rounded-full border border-[rgba(245,197,66,0.2)] bg-[rgba(245,197,66,0.08)] px-4 py-2 text-xs font-semibold text-[var(--gold)] transition hover:border-[rgba(245,197,66,0.35)] hover:bg-[rgba(245,197,66,0.14)] hover:text-[var(--white)] disabled:cursor-not-allowed disabled:opacity-70",
          compact && "px-3 py-1.5",
        )}
      >
        {isLoading ? (
          <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" />
        ) : (
          <RotateCcw className="mr-2 h-3.5 w-3.5" />
        )}
        <span>{isLoading ? "Reenviando..." : "Reenviar"}</span>
      </button>

      {feedback ? (
        <p
          className={cn(
            "text-xs leading-5",
            isWarning ? "text-[#ffd0d0]" : "text-[#d7ffe8]",
          )}
        >
          {feedback}
        </p>
      ) : null}
    </div>
  );
}
