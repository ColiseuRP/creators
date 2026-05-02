"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Ticket } from "lucide-react";

export function PublishTicketPanelButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isWarning, setIsWarning] = useState(false);

  async function handlePublish() {
    setIsLoading(true);
    setFeedback(null);
    setIsWarning(false);

    try {
      const response = await fetch("/api/discord/setup-tickets", {
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
        throw new Error(payload.error ?? "Não foi possível publicar o painel de tickets.");
      }

      const result = payload.data;
      const isPartialFailure = result?.success === false;
      const baseMessage = result?.message ?? "Painel de tickets publicado com sucesso.";

      setFeedback(
        isPartialFailure && result?.error ? `${baseMessage} ${result.error}` : baseMessage,
      );
      setIsWarning(isPartialFailure);
      router.refresh();
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Não foi possível publicar o painel de tickets.",
      );
      setIsWarning(true);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handlePublish}
        disabled={isLoading}
        className="button-gold"
      >
        {isLoading ? (
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Ticket className="mr-2 h-4 w-4" />
        )}
        <span>{isLoading ? "Publicando..." : "Publicar painel de tickets"}</span>
      </button>

      {feedback ? (
        <p
          className={
            isWarning
              ? "text-sm leading-6 text-[#ffd0d0]"
              : "text-sm leading-6 text-[#d7ffe8]"
          }
        >
          {feedback}
        </p>
      ) : null}
    </div>
  );
}
