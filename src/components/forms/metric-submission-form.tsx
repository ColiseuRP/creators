"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, LoaderCircle, SendHorizonal } from "lucide-react";

import { MAX_ATTACHMENT_SIZE_BYTES } from "@/lib/env";
import type { UploadedAttachmentInput } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

interface MetricSubmissionFormProps {
  creatorName: string;
}

interface LocalPreview {
  file: File;
  previewUrl: string;
}

function toNullableNumber(value: FormDataEntryValue | null) {
  const parsed = Number(value ?? "");
  return Number.isFinite(parsed) && String(value ?? "").trim() !== "" ? parsed : null;
}

export function MetricSubmissionForm({
  creatorName,
}: MetricSubmissionFormProps) {
  const router = useRouter();
  const [files, setFiles] = useState<LocalPreview[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      files.forEach((file) => URL.revokeObjectURL(file.previewUrl));
    };
  }, [files]);

  const totalSize = useMemo(
    () => files.reduce((acc, current) => acc + current.file.size, 0),
    [files],
  );

  async function uploadFiles() {
    const uploaded: UploadedAttachmentInput[] = [];

    for (const item of files) {
      const formData = new FormData();
      formData.append("file", item.file);

      const response = await fetch("/api/storage/metric-attachments", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as {
        data?: UploadedAttachmentInput;
        error?: string;
      };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? "Falha ao enviar um dos anexos.");
      }

      uploaded.push(payload.data);
    }

    return uploaded;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      const attachments = await uploadFiles();

      const payload = {
        platform: String(formData.get("platform") ?? ""),
        contentType: String(formData.get("contentType") ?? ""),
        contentUrl: String(formData.get("contentUrl") ?? ""),
        contentDate: String(formData.get("contentDate") ?? ""),
        views: Number(formData.get("views") ?? 0),
        likes: Number(formData.get("likes") ?? 0),
        comments: Number(formData.get("comments") ?? 0),
        shares: Number(formData.get("shares") ?? 0),
        averageViewers: toNullableNumber(formData.get("averageViewers")),
        liveDuration: toNullableNumber(formData.get("liveDuration")),
        creatorObservation: String(formData.get("creatorObservation") ?? ""),
        attachments,
      };

      const response = await fetch("/api/metrics/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Não foi possível registrar a métrica.");
      }

      setSuccess("Métrica enviada com sucesso. A equipe irá analisar em breve.");
      event.currentTarget.reset();
      files.forEach((file) => URL.revokeObjectURL(file.previewUrl));
      setFiles([]);

      startTransition(() => {
        router.push("/metrics");
        router.refresh();
      });
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Falha inesperada ao enviar a métrica.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-[24px] border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-4 text-sm leading-7 text-[var(--muted)]">
        Envie os prints e as informações do seu conteúdo para análise da equipe
        responsável. Quanto mais claro o envio, melhor para o fechamento da sua
        entrega.
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-[var(--white)]">
          <span>Plataforma</span>
          <input
            name="platform"
            required
            placeholder="Twitch, TikTok, YouTube..."
            className="field-input"
          />
        </label>

        <label className="space-y-2 text-sm font-medium text-[var(--white)]">
          <span>Tipo de conteúdo</span>
          <input
            name="contentType"
            required
            placeholder="Live, short, vídeo..."
            className="field-input"
          />
        </label>

        <label className="space-y-2 text-sm font-medium text-[var(--white)] md:col-span-2">
          <span>URL do conteúdo</span>
          <input
            name="contentUrl"
            type="url"
            required
            placeholder="https://..."
            className="field-input"
          />
        </label>

        <label className="space-y-2 text-sm font-medium text-[var(--white)]">
          <span>Data do conteúdo</span>
          <input name="contentDate" type="date" required className="field-input" />
        </label>

        <label className="space-y-2 text-sm font-medium text-[var(--white)]">
          <span>Visualizações</span>
          <input name="views" type="number" min="0" required className="field-input" />
        </label>

        <label className="space-y-2 text-sm font-medium text-[var(--white)]">
          <span>Curtidas</span>
          <input name="likes" type="number" min="0" required className="field-input" />
        </label>

        <label className="space-y-2 text-sm font-medium text-[var(--white)]">
          <span>Comentários</span>
          <input name="comments" type="number" min="0" required className="field-input" />
        </label>

        <label className="space-y-2 text-sm font-medium text-[var(--white)]">
          <span>Compartilhamentos</span>
          <input name="shares" type="number" min="0" required className="field-input" />
        </label>

        <label className="space-y-2 text-sm font-medium text-[var(--white)]">
          <span>Média de viewers</span>
          <input
            name="averageViewers"
            type="number"
            min="0"
            placeholder="Opcional"
            className="field-input"
          />
        </label>

        <label className="space-y-2 text-sm font-medium text-[var(--white)]">
          <span>Duração da live (horas)</span>
          <input
            name="liveDuration"
            type="number"
            min="0"
            step="0.1"
            placeholder="Opcional"
            className="field-input"
          />
        </label>
      </div>

      <label className="block space-y-2 text-sm font-medium text-[var(--white)]">
        <span>Observação do Creator</span>
        <textarea
          name="creatorObservation"
          rows={4}
          placeholder={`Contexto adicional da entrega de ${creatorName}`}
          className="field-textarea"
        />
      </label>

      <div className="rounded-[28px] border border-dashed border-[rgba(245,197,66,0.22)] bg-[rgba(255,255,255,0.03)] p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-display text-xl font-semibold tracking-tight text-[var(--white)]">
              Prints das métricas
            </p>
            <p className="text-sm leading-7 text-[var(--muted)]">
              PNG, JPG, JPEG ou WEBP, até {formatNumber(MAX_ATTACHMENT_SIZE_BYTES / 1024 / 1024)}MB por arquivo.
            </p>
          </div>

          <label className="button-dark cursor-pointer">
            <ImagePlus className="mr-2 h-4 w-4" />
            <span>Selecionar anexos</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              multiple
              className="hidden"
              onChange={(event) => {
                const selected = Array.from(event.target.files ?? []);

                const previews = selected.map((file) => ({
                  file,
                  previewUrl: URL.createObjectURL(file),
                }));

                setFiles((current) => {
                  current.forEach((file) => URL.revokeObjectURL(file.previewUrl));
                  return previews;
                });
              }}
            />
          </label>
        </div>

        {files.length > 0 ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-[rgba(245,197,66,0.12)] bg-[rgba(245,197,66,0.08)] px-4 py-3 text-sm text-[var(--muted)]">
              {files.length} arquivo(s) selecionado(s), total de {formatNumber(Math.round(totalSize / 1024))} KB.
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {files.map((item) => (
                <article
                  key={`${item.file.name}-${item.file.lastModified}`}
                  className="overflow-hidden rounded-[24px] border border-[rgba(245,197,66,0.12)] bg-[rgba(255,255,255,0.03)]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.previewUrl}
                    alt={item.file.name}
                    className="h-44 w-full object-cover"
                  />
                  <div className="p-4">
                    <p className="truncate text-sm font-semibold text-[var(--white)]">
                      {item.file.name}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {formatNumber(Math.round(item.file.size / 1024))} KB
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-2xl border border-[rgba(139,30,30,0.4)] bg-[rgba(139,30,30,0.2)] px-4 py-3 text-sm text-[#ffd0d0]">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-2xl border border-[rgba(46,139,87,0.35)] bg-[rgba(46,139,87,0.18)] px-4 py-3 text-sm text-[#d7ffe8]">
          {success}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="button-gold"
      >
        {isSubmitting ? (
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <SendHorizonal className="mr-2 h-4 w-4" />
        )}
        <span>{isSubmitting ? "Enviando..." : "Enviar métrica para análise"}</span>
      </button>
    </form>
  );
}
