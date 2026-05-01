"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Send } from "lucide-react";

export function TestDiscordButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isWarning, setIsWarning] = useState(false);

  async function handleTest() {
    setIsLoading(true);
    setFeedback(null);
    setIsWarning(false);

    try {
      const response = await fetch("/api/discord/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetType: "general",
          channelPurpose: "notices",
          messageType: "discord_connectivity_test",
          content:
            "✅ Teste realizado com sucesso. A integração do Creators Coliseu com o Discord está funcionando.",
        }),
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
        throw new Error(payload.error ?? "Não foi possível testar o envio no Discord.");
      }

      const result = payload.data;
      const isPartialFailure = result?.success === false;
      const baseMessage = result?.message ?? "Teste enviado com sucesso.";

      setFeedback(
        isPartialFailure && result?.error ? `${baseMessage} ${result.error}` : baseMessage,
      );
      setIsWarning(isPartialFailure);
      router.refresh();
    } catch (testError) {
      setFeedback(
        testError instanceof Error
          ? testError.message
          : "Não foi possível testar o envio no Discord.",
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
        onClick={handleTest}
        disabled={isLoading}
        className="button-gold"
      >
        {isLoading ? (
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Send className="mr-2 h-4 w-4" />
        )}
        <span>{isLoading ? "Testando..." : "Testar envio no Discord"}</span>
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
