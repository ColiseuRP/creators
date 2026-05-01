import { z } from "zod";

import { ACCEPTED_ATTACHMENT_TYPES, MAX_ATTACHMENT_SIZE_BYTES } from "@/lib/env";

export const uploadedAttachmentSchema = z.object({
  storagePath: z.string().min(1, "Arquivo enviado invalido."),
  fileName: z.string().min(1, "Nome do arquivo e obrigatorio."),
  fileType: z
    .string()
    .refine(
      (value) =>
        ACCEPTED_ATTACHMENT_TYPES.includes(
          value as (typeof ACCEPTED_ATTACHMENT_TYPES)[number],
        ),
      "Formato nao permitido.",
    ),
  fileSize: z
    .number()
    .max(MAX_ATTACHMENT_SIZE_BYTES, "O arquivo ultrapassa o tamanho maximo permitido."),
});

export const metricSubmissionSchema = z.object({
  platform: z.string().trim().min(2, "Informe a plataforma."),
  contentType: z.string().trim().min(2, "Informe o tipo de conteudo."),
  contentUrl: z.string().url("Informe uma URL valida."),
  contentDate: z.string().min(1, "Informe a data do conteudo."),
  views: z.coerce.number().min(0, "Views nao pode ser negativo."),
  likes: z.coerce.number().min(0, "Likes nao pode ser negativo."),
  comments: z.coerce.number().min(0, "Comentarios nao pode ser negativo."),
  shares: z.coerce.number().min(0, "Compartilhamentos nao pode ser negativo."),
  averageViewers: z.coerce.number().min(0).nullable().optional(),
  liveDuration: z.coerce.number().min(0).nullable().optional(),
  creatorObservation: z.string().trim().max(1000).optional().default(""),
  attachments: z.array(uploadedAttachmentSchema).max(5).default([]),
});

export const metricReviewSchema = z.object({
  reason: z.string().trim().max(1000).optional().default(""),
});

export const individualNoticeSchema = z.object({
  title: z.string().trim().min(3, "Informe o titulo do aviso."),
  message: z.string().trim().min(5, "Informe a mensagem do aviso."),
  type: z.enum(["info", "success", "warning"]),
  targetCreatorId: z.string().uuid("Creator invalido.").or(z.string().min(1)),
  sendToDiscord: z.boolean().default(false),
});

export const generalNoticeSchema = z.object({
  title: z.string().trim().min(3, "Informe o titulo do aviso."),
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
  age: z.coerce.number().min(13, "Voce precisa ter pelo menos 13 anos."),
  category: z.string().trim().min(2, "Informe sua categoria."),
  twitchUrl: z.union([z.string().url("URL da Twitch invalida."), z.literal("")]).optional(),
  tiktokUrl: z.union([z.string().url("URL do TikTok invalida."), z.literal("")]).optional(),
  youtubeUrl: z.union([z.string().url("URL do YouTube invalida."), z.literal("")]).optional(),
  instagramUrl: z.union([z.string().url("URL do Instagram invalida."), z.literal("")]).optional(),
  frequency: z.string().trim().min(3, "Informe sua frequencia de conteudo."),
  reason: z.string().trim().min(10, "Conte melhor por que voce quer representar o Coliseu RP."),
  contentLinks: z.string().trim().optional().default(""),
  observations: z.string().trim().optional().default(""),
});
