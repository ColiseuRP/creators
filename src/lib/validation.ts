import { z } from "zod";

import { ACCEPTED_ATTACHMENT_TYPES, MAX_ATTACHMENT_SIZE_BYTES } from "@/lib/env";

export const uploadedAttachmentSchema = z.object({
  storagePath: z.string().min(1, "Arquivo enviado inválido."),
  fileName: z.string().min(1, "Nome do arquivo é obrigatório."),
  fileType: z
    .string()
    .refine(
      (value) =>
        ACCEPTED_ATTACHMENT_TYPES.includes(
          value as (typeof ACCEPTED_ATTACHMENT_TYPES)[number],
        ),
      "Formato não permitido.",
    ),
  fileSize: z
    .number()
    .max(MAX_ATTACHMENT_SIZE_BYTES, "O arquivo ultrapassa o tamanho máximo permitido."),
});

export const metricSubmissionSchema = z.object({
  platform: z.string().trim().min(2, "Informe a plataforma."),
  contentType: z.string().trim().min(2, "Informe o tipo de conteúdo."),
  contentUrl: z.string().url("Informe uma URL válida."),
  contentDate: z.string().min(1, "Informe a data do conteúdo."),
  views: z.coerce.number().min(0, "Views não pode ser negativo."),
  likes: z.coerce.number().min(0, "Likes não pode ser negativo."),
  comments: z.coerce.number().min(0, "Comentários não pode ser negativo."),
  shares: z.coerce.number().min(0, "Compartilhamentos não pode ser negativo."),
  averageViewers: z.coerce.number().min(0).nullable().optional(),
  liveDuration: z.coerce.number().min(0).nullable().optional(),
  creatorObservation: z.string().trim().max(1000).optional().default(""),
  attachments: z.array(uploadedAttachmentSchema).max(5).default([]),
});

export const metricReviewSchema = z.object({
  reason: z.string().trim().max(1000).optional().default(""),
});

export const individualNoticeSchema = z.object({
  title: z.string().trim().min(3, "Informe o título do aviso."),
  message: z.string().trim().min(5, "Informe a mensagem do aviso."),
  type: z.enum(["info", "success", "warning"]),
  targetCreatorId: z.string().uuid("Creator inválido.").or(z.string().min(1)),
  sendToDiscord: z.boolean().default(false),
});

export const generalNoticeSchema = z.object({
  title: z.string().trim().min(3, "Informe o título do aviso."),
  message: z.string().trim().min(5, "Informe a mensagem do aviso."),
  type: z.enum(["info", "success", "warning"]),
  targetType: z.enum(["general", "category"]),
  targetCategory: z.string().trim().optional().default(""),
  sendToDiscord: z.boolean().default(false),
});

export const discordMessageSchema = z.object({
  targetType: z.enum(["individual", "general"]),
  targetCreatorId: z.string().optional(),
  channelId: z.string().optional(),
  messageType: z.string().trim().min(2),
  content: z.string().trim().min(3),
});
