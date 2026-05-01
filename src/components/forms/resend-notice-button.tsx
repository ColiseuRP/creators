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
  const [error, setError] = useState<string | null>(null);

  async function handleResend() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/notices/${noticeId}/resend`, {
        method: "POST",
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Nao foi possivel reenviar o aviso.");
      }

      router.refresh();
    } catch (resendError) {
      setError(
        resendError instanceof Error
          ? resendError.message
          : "Nao foi possivel reenviar o aviso.",
      );
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
        <span>{isLoading ? "Reenviando" : "Reenviar"}</span>
      </button>

      {error ? (
        <p className="text-xs leading-5 text-[#ffd0d0]">{error}</p>
      ) : null}
    </div>
  );
}
