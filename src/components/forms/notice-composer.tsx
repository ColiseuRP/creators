"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Megaphone } from "lucide-react";

import type { Creator } from "@/lib/types";

interface NoticeComposerProps {
  creators: Creator[];
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
  const [error, setError] = useState<string | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(creators.map((creator) => creator.category))).sort(),
    [creators],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setFeedback(null);
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
        data?: { discordStatus?: string | null; errorMessage?: string | null };
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error ?? "Nao foi possivel enviar o aviso.");
      }

      const discordLine =
        sendToDiscord && targetType === "individual"
          ? " Aviso enviado para a sala do creator."
          : sendToDiscord
            ? " Aviso geral enviado para os creators."
            : "";

      const suffix =
        result.data?.discordStatus && result.data.discordStatus !== "sent"
          ? ` Discord: ${result.data.errorMessage ?? result.data.discordStatus}.`
          : discordLine;

      setFeedback(`Aviso publicado com sucesso.${suffix}`);
      setTitle("");
      setMessage("");
      setTargetCreatorId("");
      setTargetCategory("");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Erro inesperado ao enviar aviso.",
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
          <select
            value={targetType}
            onChange={(event) =>
              setTargetType(event.target.value as "individual" | "general" | "category")
            }
            className="field-input"
          >
            <option value="general">Geral</option>
            <option value="category">Categoria</option>
            <option value="individual">Individual</option>
          </select>
        </label>

        <label className="space-y-2 text-sm font-medium text-[var(--white)]">
          <span>Tom do aviso</span>
          <select
            value={type}
            onChange={(event) =>
              setType(event.target.value as "info" | "success" | "warning")
            }
            className="field-input"
          >
            <option value="info">Informativo</option>
            <option value="success">Destaque</option>
            <option value="warning">Atencao</option>
          </select>
        </label>
      </div>

      {targetType === "individual" ? (
        <label className="block space-y-2 text-sm font-medium text-[var(--white)]">
          <span>Creator alvo</span>
          <select
            value={targetCreatorId}
            onChange={(event) => setTargetCreatorId(event.target.value)}
            required
            className="field-input"
          >
            <option value="">Selecione um creator</option>
            {creators.map((creator) => (
              <option key={creator.id} value={creator.id}>
                {creator.name} · {creator.category}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {targetType === "category" ? (
        <label className="block space-y-2 text-sm font-medium text-[var(--white)]">
          <span>Categoria alvo</span>
          <select
            value={targetCategory}
            onChange={(event) => setTargetCategory(event.target.value)}
            required
            className="field-input"
          >
            <option value="">Selecione uma categoria</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label className="block space-y-2 text-sm font-medium text-[var(--white)]">
        <span>Titulo</span>
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
        <div className="rounded-2xl border border-[rgba(46,139,87,0.35)] bg-[rgba(46,139,87,0.18)] px-4 py-3 text-sm text-[#d7ffe8]">
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
        <span>{isLoading ? "Enviando..." : "Publicar aviso"}</span>
      </button>
    </form>
  );
}
