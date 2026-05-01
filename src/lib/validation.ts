import { z } from "zod";

import { ACCEPTED_ATTACHMENT_TYPES, MAX_ATTACHMENT_SIZE_BYTES } from "@/lib/env";

export const uploadedAttachmentSchema = z.object({
  storagePath: z.string().min(1, "Arquivo enviado inválido."),
  fileName: z.string().min(1, "O nome do arquivo é obrigatório."),
  fileType: z
    .string()
    .refine(
      (value) =>
        ACCEPTED_ATTACHMENT_TYPES.includes(
          value as (typeof ACCEPTED_ATTACHMENT_TYPES)[number],
        ),
      "Envie um arquivo nos formatos PNG, JPG, JPEG ou WEBP.",
    ),
  fileSize: z
    .number()
    .max(MAX_ATTACHMENT_SIZE_BYTES, "O arquivo enviado é muito grande."),
});

export const metricSubmissionSchema = z.object({
  platform: z.string().trim().min(2, "Informe a plataforma."),
  contentType: z.string().trim().min(2, "Informe o tipo de conteúdo."),
  contentUrl: z.string().url("Informe um link válido."),
  contentDate: z.string().min(1, "Informe a data do conteúdo."),
  views: z.coerce.number().min(0, "As visualizações não podem ser negativas."),
  likes: z.coerce.number().min(0, "Os likes não podem ser negativos."),
  comments: z.coerce.number().min(0, "Os comentários não podem ser negativos."),
  shares: z.coerce.number().min(0, "Os compartilhamentos não podem ser negativos."),
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

export const creatorApplicationSubmissionSchema = z.object({
  name: z.string().trim().min(3, "Informe seu nome."),
  discordName: z.string().trim().min(2, "Informe seu nome no Discord."),
  discordId: z.string().trim().min(3, "Informe seu ID do Discord."),
  cityName: z.string().trim().min(2, "Informe sua cidade."),
  age: z.coerce.number().min(13, "Você precisa ter pelo menos 13 anos."),
  category: z.string().trim().min(2, "Informe sua categoria."),
  twitchUrl: z.union([z.string().url("Informe um link válido da Twitch."), z.literal("")]).optional(),
  tiktokUrl: z.union([z.string().url("Informe um link válido do TikTok."), z.literal("")]).optional(),
  youtubeUrl: z.union([z.string().url("Informe um link válido do YouTube."), z.literal("")]).optional(),
  instagramUrl: z.union([z.string().url("Informe um link válido do Instagram."), z.literal("")]).optional(),
  frequency: z.string().trim().min(3, "Informe sua frequência de conteúdo."),
  reason: z.string().trim().min(10, "Conte melhor por que você quer representar o Coliseu RP."),
  contentLinks: z.string().trim().optional().default(""),
  observations: z.string().trim().optional().default(""),
});
