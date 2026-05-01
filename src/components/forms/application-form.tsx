"use client";

import { useState } from "react";
import { LoaderCircle, SendHorizonal } from "lucide-react";

export function ApplicationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setSuccess(null);
    setError(null);

    try {
      const formData = new FormData(event.currentTarget);

      const payload = {
        name: String(formData.get("name") ?? ""),
        discordName: String(formData.get("discordName") ?? ""),
        discordId: String(formData.get("discordId") ?? ""),
        cityName: String(formData.get("cityName") ?? ""),
        age: Number(formData.get("age") ?? 0),
        category: String(formData.get("category") ?? ""),
        twitchUrl: String(formData.get("twitchUrl") ?? ""),
        tiktokUrl: String(formData.get("tiktokUrl") ?? ""),
        youtubeUrl: String(formData.get("youtubeUrl") ?? ""),
        instagramUrl: String(formData.get("instagramUrl") ?? ""),
        frequency: String(formData.get("frequency") ?? ""),
        reason: String(formData.get("reason") ?? ""),
        contentLinks: String(formData.get("contentLinks") ?? ""),
        observations: String(formData.get("observations") ?? ""),
      };

      const response = await fetch("/api/applications/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Não foi possível enviar sua inscrição.");
      }

      setSuccess(
        "Sua inscrição foi enviada para a equipe Creators Coliseu. Aguarde a análise.",
      );
      event.currentTarget.reset();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Não foi possível enviar sua inscrição.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-[var(--white)]">
          <span>Nome</span>
          <input name="name" required className="field-input" />
        </label>

        <label className="space-y-2 text-sm font-medium text-[var(--white)]">
          <span>Nome no Discord</span>
          <input name="discordName" required className="field-input" />
        </label>

        <label className="space-y-2 text-sm font-medium text-[var(--white)]">
          <span>ID do Discord</span>
          <input name="discordId" required className="field-input" />
        </label>

        <label className="space-y-2 text-sm font-medium text-[var(--white)]">
          <span>Cidade</span>
          <input name="cityName" required className="field-input" />
        </label>

        <label className="space-y-2 text-sm font-medium text-[var(--white)]">
          <span>Idade</span>
          <input name="age" type="number" min="13" required className="field-input" />
        </label>

        <label className="space-y-2 text-sm font-medium text-[var(--white)]">
          <span>Categoria principal</span>
          <input
            name="category"
            required
            placeholder="Streamer, influencer, cortes, vídeos..."
            className="field-input"
          />
        </label>

        <label className="space-y-2 text-sm font-medium text-[var(--white)]">
          <span>Twitch</span>
          <input name="twitchUrl" type="url" placeholder="https://..." className="field-input" />
        </label>

        <label className="space-y-2 text-sm font-medium text-[var(--white)]">
          <span>TikTok</span>
          <input name="tiktokUrl" type="url" placeholder="https://..." className="field-input" />
        </label>

        <label className="space-y-2 text-sm font-medium text-[var(--white)]">
          <span>YouTube</span>
          <input name="youtubeUrl" type="url" placeholder="https://..." className="field-input" />
        </label>

        <label className="space-y-2 text-sm font-medium text-[var(--white)]">
          <span>Instagram</span>
          <input
            name="instagramUrl"
            type="url"
            placeholder="https://..."
            className="field-input"
          />
        </label>

        <label className="space-y-2 text-sm font-medium text-[var(--white)] md:col-span-2">
          <span>Frequência de conteúdo</span>
          <input
            name="frequency"
            required
            placeholder="Ex.: lives 4x por semana, vídeos diários..."
            className="field-input"
          />
        </label>
      </div>

      <label className="block space-y-2 text-sm font-medium text-[var(--white)]">
        <span>Por que você quer representar o Coliseu RP?</span>
        <textarea
          name="reason"
          rows={4}
          required
          className="field-textarea"
          placeholder="Fale sobre sua história, sua frequência e como você pode fortalecer a cidade."
        />
      </label>

      <label className="block space-y-2 text-sm font-medium text-[var(--white)]">
        <span>Links de conteúdo</span>
        <textarea
          name="contentLinks"
          rows={3}
          className="field-textarea"
          placeholder="Envie links de lives, vídeos, cortes ou posts relevantes."
        />
      </label>

      <label className="block space-y-2 text-sm font-medium text-[var(--white)]">
        <span>Observações</span>
        <textarea
          name="observations"
          rows={3}
          className="field-textarea"
          placeholder="Algo importante que a equipe deve saber sobre seu perfil."
        />
      </label>

      {success ? (
        <div className="rounded-2xl border border-[rgba(46,139,87,0.35)] bg-[rgba(46,139,87,0.18)] px-4 py-3 text-sm text-[#d7ffe8]">
          {success}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-[rgba(139,30,30,0.4)] bg-[rgba(139,30,30,0.2)] px-4 py-3 text-sm text-[#ffd0d0]">
          {error}
        </div>
      ) : null}

      <button type="submit" disabled={isSubmitting} className="button-gold">
        {isSubmitting ? (
          <>
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <SendHorizonal className="mr-2 h-4 w-4" />
            Enviar inscrição para análise
          </>
        )}
      </button>
    </form>
  );
}
