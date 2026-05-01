"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Megaphone } from "lucide-react";

import {
  ColiseuSelect,
  type ColiseuSelectOption,
} from "@/components/forms/coliseu-select";
import type { Creator } from "@/lib/types";

interface NoticeComposerProps {
  creators: Creator[];
}

interface NoticeApiResult {
  success?: boolean;
  message?: string;
  error?: string | null;
  discordStatus?: string | null;
}

export function NoticeComposer({ creators }: NoticeComposerProps) {
  const router = useRouter();
  const [targetType, setTargetType] = useState<"individual" | "general" | "category">(
    "general",
  );
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"info" | "success" | "warning">("info");
  const [targetCreatorId, setTargetCreatorId] = useState("");
  const [targetCategory, setTargetCategory] = useState("");
  const [sendToDiscord, setSendToDiscord] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<"success" | "warning" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(creators.map((creator) => creator.category))).sort(),
    [creators],
  );
  const targetTypeOptions = useMemo<ColiseuSelectOption[]>(
    () => [
      {
        value: "general",
        label: "Aviso geral",
        description: "Envia o aviso para toda a arena de creators.",
      },
      {
        value: "category",
        label: "Aviso por categoria",
        description: "Direciona o aviso para uma categoria específica.",
      },
      {
        value: "individual",
        label: "Aviso individual",
        description: "Entrega o aviso para um creator específico.",
      },
    ],
    [],
  );
  const toneOptions = useMemo<ColiseuSelectOption[]>(
    () => [
      {
        value: "info",
        label: "Informativo",
        description: "Comunicação neutra para orientar a equipe.",
      },
      {
        value: "success",
        label: "Destaque",
        description: "Mensagem positiva com reconhecimento ou avanço.",
      },
      {
        value: "warning",
        label: "Atenção",
        description: "Aviso importante que pede cuidado ou ajuste.",
      },
    ],
    [],
  );
  const creatorOptions = useMemo<ColiseuSelectOption[]>(
    () =>
      creators.map((creator) => ({
        value: creator.id,
        label: creator.name,
        description: creator.category,
      })),
    [creators],
  );
  const categoryOptions = useMemo<ColiseuSelectOption[]>(
    () =>
      categories.map((category) => ({
        value: category,
        label: category,
      })),
    [categories],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setFeedback(null);
    setFeedbackTone(null);
    setError(null);

    try {
      const endpoint =
        targetType === "individual" ? "/api/notices/individual" : "/api/notices/general";

      const payload =
        targetType === "individual"
          ? {
              title,
              message,
              type,
              targetCreatorId,
              sendToDiscord,
            }
          : {
              title,
              message,
              type,
              targetType,
              targetCategory,
              sendToDiscord,
            };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as {
        data?: NoticeApiResult;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error ?? "Não foi possível salvar o aviso.");
      }

      const noticeResult = result.data;
      const isPartialFailure = noticeResult?.success === false;
      const baseMessage =
        noticeResult?.message ??
        (sendToDiscord ? "Aviso enviado com sucesso." : "Aviso salvo com sucesso.");
      const composedMessage =
        isPartialFailure && noticeResult?.error
          ? `${baseMessage} ${noticeResult.error}`
          : baseMessage;

      setFeedback(composedMessage);
      setFeedbackTone(isPartialFailure ? "warning" : "success");
      setTitle("");
      setMessage("");
      setTargetCreatorId("");
      setTargetCategory("");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Erro inesperado ao enviar o aviso.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-[var(--white)]">
          <span>Destino</span>
          <ColiseuSelect
            value={targetType}
            onChange={(nextValue) =>
              setTargetType(nextValue as "individual" | "general" | "category")
            }
            options={targetTypeOptions}
          />
        </label>

        <label className="space-y-2 text-sm font-medium text-[var(--white)]">
          <span>Tom do aviso</span>
          <ColiseuSelect
            value={type}
            onChange={(nextValue) =>
              setType(nextValue as "info" | "success" | "warning")
            }
            options={toneOptions}
          />
        </label>
      </div>

      {targetType === "individual" ? (
        <label className="block space-y-2 text-sm font-medium text-[var(--white)]">
          <span>Creator de destino</span>
          <ColiseuSelect
            value={targetCreatorId}
            onChange={setTargetCreatorId}
            options={creatorOptions}
            placeholder="Selecione um creator"
            required
          />
        </label>
      ) : null}

      {targetType === "category" ? (
        <label className="block space-y-2 text-sm font-medium text-[var(--white)]">
          <span>Categoria de destino</span>
          <ColiseuSelect
            value={targetCategory}
            onChange={setTargetCategory}
            options={categoryOptions}
            placeholder="Selecione uma categoria"
            required
          />
        </label>
      ) : null}

      <label className="block space-y-2 text-sm font-medium text-[var(--white)]">
        <span>Título</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          className="field-input"
        />
      </label>

      <label className="block space-y-2 text-sm font-medium text-[var(--white)]">
        <span>Mensagem</span>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={4}
          required
          placeholder="Use **negrito**, *itálico*, quebras de linha e menções como @everyone ou <@ID>."
          className="field-textarea"
        />
      </label>

      <label className="flex items-center gap-3 rounded-2xl border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[var(--muted)]">
        <input
          type="checkbox"
          checked={sendToDiscord}
          onChange={(event) => setSendToDiscord(event.target.checked)}
          className="h-4 w-4 rounded border-[rgba(245,197,66,0.22)] text-[var(--gold)]"
        />
        <span>Enviar aviso no Discord</span>
      </label>

      {feedback ? (
        <div
          className={
            feedbackTone === "warning"
              ? "rounded-2xl border border-[rgba(245,197,66,0.35)] bg-[rgba(245,197,66,0.14)] px-4 py-3 text-sm text-[#fff0bf]"
              : "rounded-2xl border border-[rgba(46,139,87,0.35)] bg-[rgba(46,139,87,0.18)] px-4 py-3 text-sm text-[#d7ffe8]"
          }
        >
          {feedback}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-[rgba(139,30,30,0.4)] bg-[rgba(139,30,30,0.2)] px-4 py-3 text-sm text-[#ffd0d0]">
          {error}
        </div>
      ) : null}

      <button type="submit" disabled={isLoading} className="button-gold">
        {isLoading ? (
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Megaphone className="mr-2 h-4 w-4" />
        )}
        <span>{isLoading ? "Enviando..." : "Enviar aviso"}</span>
      </button>
    </form>
  );
}
