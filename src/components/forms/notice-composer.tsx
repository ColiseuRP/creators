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
        throw new Error(result.error ?? "Não foi possível enviar o aviso.");
      }

      const suffix =
        result.data?.discordStatus && result.data.discordStatus !== "sent"
          ? ` Discord: ${result.data.errorMessage ?? result.data.discordStatus}.`
          : "";

      setFeedback(`Aviso enviado com sucesso.${suffix}`);
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
        <label className="space-y-2 text-sm font-medium text-[var(--foreground)]">
          <span>Destino</span>
          <select
            value={targetType}
            onChange={(event) =>
              setTargetType(event.target.value as "individual" | "general" | "category")
            }
            className="w-full rounded-2xl border border-[rgba(19,32,45,0.12)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
          >
            <option value="general">Geral</option>
            <option value="category">Categoria</option>
            <option value="individual">Individual</option>
          </select>
        </label>

        <label className="space-y-2 text-sm font-medium text-[var(--foreground)]">
          <span>Tipo do aviso</span>
          <select
            value={type}
            onChange={(event) =>
              setType(event.target.value as "info" | "success" | "warning")
            }
            className="w-full rounded-2xl border border-[rgba(19,32,45,0.12)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
          >
            <option value="info">Informativo</option>
            <option value="success">Sucesso</option>
            <option value="warning">Atenção</option>
          </select>
        </label>
      </div>

      {targetType === "individual" ? (
        <label className="block space-y-2 text-sm font-medium text-[var(--foreground)]">
          <span>Creator alvo</span>
          <select
            value={targetCreatorId}
            onChange={(event) => setTargetCreatorId(event.target.value)}
            required
            className="w-full rounded-2xl border border-[rgba(19,32,45,0.12)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
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
        <label className="block space-y-2 text-sm font-medium text-[var(--foreground)]">
          <span>Categoria alvo</span>
          <select
            value={targetCategory}
            onChange={(event) => setTargetCategory(event.target.value)}
            required
            className="w-full rounded-2xl border border-[rgba(19,32,45,0.12)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
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

      <label className="block space-y-2 text-sm font-medium text-[var(--foreground)]">
        <span>Título</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          className="w-full rounded-2xl border border-[rgba(19,32,45,0.12)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
        />
      </label>

      <label className="block space-y-2 text-sm font-medium text-[var(--foreground)]">
        <span>Mensagem</span>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={4}
          required
          className="w-full rounded-[24px] border border-[rgba(19,32,45,0.12)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
        />
      </label>

      <label className="flex items-center gap-3 rounded-2xl bg-[rgba(18,145,125,0.08)] px-4 py-3 text-sm text-[var(--foreground)]">
        <input
          type="checkbox"
          checked={sendToDiscord}
          onChange={(event) => setSendToDiscord(event.target.checked)}
          className="h-4 w-4 rounded border-[rgba(19,32,45,0.18)] text-[var(--accent)]"
        />
        <span>Enviar também para o Discord</span>
      </label>

      {feedback ? (
        <div className="rounded-2xl bg-emerald-100 px-4 py-3 text-sm text-emerald-700">
          {feedback}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl bg-rose-100 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isLoading}
        className="inline-flex items-center gap-2 rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isLoading ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <Megaphone className="h-4 w-4" />
        )}
        <span>{isLoading ? "Enviando..." : "Publicar aviso"}</span>
      </button>
    </form>
  );
}
