import "server-only";

import { revalidatePath } from "next/cache";

import {
  ACCEPTED_ATTACHMENT_TYPES,
  MAX_ATTACHMENT_SIZE_BYTES,
  SUPABASE_STORAGE_BUCKET,
} from "@/lib/env";
import {
  formatMetricReviewDiscordMessage,
  formatNoticeDiscordMessage,
  sendDiscordChannelMessage,
} from "@/lib/discord";
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import type {
  Creator,
  NoticeTargetType,
  NoticeType,
  SessionContext,
  UploadedAttachmentInput,
} from "@/lib/types";
import { sanitizeFilename } from "@/lib/utils";

interface ReviewMetricInput {
  metricId: string;
  decision: "approved" | "rejected";
  reason?: string;
}

interface NoticeInput {
  title: string;
  message: string;
  type: NoticeType;
  targetType: NoticeTargetType;
  targetCreatorId?: string | null;
  targetCategory?: string | null;
  sendToDiscord: boolean;
}

interface ManualDiscordMessageInput {
  targetType: "individual" | "general";
  targetCreatorId?: string | null;
  channelId?: string | null;
  messageType: string;
  content: string;
}

function requireCreatorContext(actor: SessionContext) {
  if (!actor.creator) {
    throw new Error("Creator não encontrado para a sessão atual.");
  }

  return actor.creator;
}

export async function uploadMetricAttachment(actor: SessionContext, file: File) {
  const creator = requireCreatorContext(actor);

  if (!ACCEPTED_ATTACHMENT_TYPES.includes(file.type as (typeof ACCEPTED_ATTACHMENT_TYPES)[number])) {
    throw new Error("Formato de arquivo inválido. Envie PNG, JPG, JPEG ou WEBP.");
  }

  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    throw new Error("O arquivo ultrapassa o limite permitido de 5MB.");
  }

  if (actor.mockMode) {
    return {
      storagePath: `mock/${creator.id}/${sanitizeFilename(file.name)}`,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase não configurado para upload.");
  }

  const storagePath = `${creator.id}/${Date.now()}-${sanitizeFilename(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .upload(storagePath, buffer, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return {
    storagePath,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
  };
}

export async function submitMetric(
  actor: SessionContext,
  payload: {
    platform: string;
    contentType: string;
    contentUrl: string;
    contentDate: string;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    averageViewers?: number | null;
    liveDuration?: number | null;
    creatorObservation?: string;
    attachments: UploadedAttachmentInput[];
  },
) {
  const creator = requireCreatorContext(actor);

  if (actor.mockMode) {
    return {
      id: `mock-metric-${Date.now()}`,
      creatorId: creator.id,
      status: "pending",
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase não configurado para envio de métrica.");
  }

  const { data: metric, error: metricError } = await supabase
    .from("metric_submissions")
    .insert({
      creator_id: creator.id,
      platform: payload.platform,
      content_type: payload.contentType,
      content_url: payload.contentUrl,
      content_date: payload.contentDate,
      views: payload.views,
      likes: payload.likes,
      comments: payload.comments,
      shares: payload.shares,
      average_viewers: payload.averageViewers ?? null,
      live_duration: payload.liveDuration ?? null,
      status: "pending",
      creator_observation: payload.creatorObservation || null,
    })
    .select("id, creator_id, status")
    .single();

  if (metricError || !metric) {
    throw new Error(metricError?.message ?? "Não foi possível salvar a métrica.");
  }

  if (payload.attachments.length > 0) {
    const { error: attachmentError } = await supabase.from("metric_attachments").insert(
      payload.attachments.map((attachment) => ({
        metric_submission_id: metric.id,
        file_url: attachment.storagePath,
        file_name: attachment.fileName,
        file_type: attachment.fileType,
      })),
    );

    if (attachmentError) {
      throw new Error(attachmentError.message);
    }
  }

  revalidatePath("/metrics");
  revalidatePath("/dashboard");

  return {
    id: metric.id,
    creatorId: metric.creator_id,
    status: metric.status,
  };
}

async function insertDiscordLog(
  serviceClient: ReturnType<typeof createSupabaseServiceRoleClient>,
  input: {
    targetType: NoticeTargetType | "metric_review";
    targetCreatorId?: string | null;
    channelId?: string | null;
    messageType: string;
    status: "sent" | "failed" | "skipped";
    errorMessage?: string | null;
  },
) {
  if (!serviceClient) {
    return;
  }

  await serviceClient.from("discord_message_logs").insert({
    target_type: input.targetType,
    target_creator_id: input.targetCreatorId ?? null,
    channel_id: input.channelId ?? null,
    message_type: input.messageType,
    status: input.status,
    error_message: input.errorMessage ?? null,
  });
}

export async function reviewMetric(actor: SessionContext, input: ReviewMetricInput) {
  if (!actor.profile) {
    throw new Error("Perfil não encontrado.");
  }

  if (actor.mockMode) {
    return {
      metricId: input.metricId,
      decision: input.decision,
      discordStatus: "skipped",
      errorMessage: "Modo demo ativo: nenhuma alteração persistida.",
    };
  }

  const serviceClient = createSupabaseServiceRoleClient();

  if (!serviceClient) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada.");
  }

  const { data: metric } = await serviceClient
    .from("metric_submissions")
    .select("*")
    .eq("id", input.metricId)
    .single();

  if (!metric) {
    throw new Error("Métrica não encontrada.");
  }

  const { data: creator } = await serviceClient
    .from("creators")
    .select("*")
    .eq("id", metric.creator_id)
    .single();

  if (!creator) {
    throw new Error("Creator não encontrado para a métrica.");
  }

  const reviewReason = input.reason?.trim() || null;

  const { error: updateError } = await serviceClient
    .from("metric_submissions")
    .update({
      status: input.decision,
      reviewed_at: new Date().toISOString(),
      reviewed_by: actor.profile.id,
      admin_observation: reviewReason,
      rejection_reason: input.decision === "rejected" ? reviewReason : null,
    })
    .eq("id", input.metricId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  await serviceClient.from("metric_reviews").insert({
    metric_submission_id: input.metricId,
    reviewed_by: actor.profile.id,
    decision: input.decision,
    reason: reviewReason,
  });

  await serviceClient.from("creator_notices").insert({
    title:
      input.decision === "approved"
        ? "Métrica aprovada"
        : "Métrica negada",
    message:
      input.decision === "approved"
        ? reviewReason || "Sua métrica foi aprovada com sucesso."
        : reviewReason || "Sua métrica foi negada. Confira o motivo no painel.",
    type: input.decision === "approved" ? "success" : "warning",
    target_type: "individual",
    target_creator_id: creator.id,
    sent_by: actor.profile.id,
    send_to_discord: true,
  });

  const { data: discordSettings } = await serviceClient
    .from("discord_settings")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const discordResult =
    discordSettings?.auto_send_enabled === false
      ? {
          status: "skipped" as const,
          channelId: creator.discord_channel_id,
          errorMessage: "Envio automático para o Discord está desabilitado.",
        }
      : await sendDiscordChannelMessage(
          creator.discord_channel_id,
          formatMetricReviewDiscordMessage(
            creator as Creator,
            metric,
            input.decision,
            reviewReason ?? undefined,
          ),
        );

  await insertDiscordLog(serviceClient, {
    targetType: "metric_review",
    targetCreatorId: creator.id,
    channelId: discordResult.channelId,
    messageType:
      input.decision === "approved" ? "metric_approved" : "metric_rejected",
    status: discordResult.status,
    errorMessage: discordResult.errorMessage,
  });

  revalidatePath("/metrics");
  revalidatePath(`/creators/${creator.id}`);
  revalidatePath("/dashboard");
  revalidatePath("/notices");

  return {
    metricId: input.metricId,
    decision: input.decision,
    discordStatus: discordResult.status,
    errorMessage: discordResult.errorMessage,
  };
}

async function getCreatorChannel(
  serviceClient: ReturnType<typeof createSupabaseServiceRoleClient>,
  creatorId: string,
) {
  if (!serviceClient) {
    return null;
  }

  const { data } = await serviceClient
    .from("creators")
    .select("*")
    .eq("id", creatorId)
    .single();

  return (data as Creator | null) ?? null;
}

export async function createNotice(actor: SessionContext, input: NoticeInput) {
  if (!actor.profile) {
    throw new Error("Perfil não encontrado.");
  }

  if (actor.mockMode) {
    return {
      status: "created",
      discordStatus: input.sendToDiscord ? "skipped" : null,
    };
  }

  const serviceClient = createSupabaseServiceRoleClient();

  if (!serviceClient) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada.");
  }

  const { error: noticeError } = await serviceClient.from("creator_notices").insert({
    title: input.title,
    message: input.message,
    type: input.type,
    target_type: input.targetType,
    target_creator_id: input.targetCreatorId ?? null,
    target_category: input.targetCategory ?? null,
    sent_by: actor.profile.id,
    send_to_discord: input.sendToDiscord,
  });

  if (noticeError) {
    throw new Error(noticeError.message);
  }

  let discordStatus: "sent" | "failed" | "skipped" | null = null;
  let errorMessage: string | null = null;

  if (input.sendToDiscord) {
    const { data: discordSettings } = await serviceClient
      .from("discord_settings")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let channelId: string | null =
      discordSettings?.general_creators_channel_id ?? null;

    if (input.targetType === "individual" && input.targetCreatorId) {
      const creator = await getCreatorChannel(serviceClient, input.targetCreatorId);
      channelId = creator?.discord_channel_id ?? null;
    }

    const discordResult =
      discordSettings?.auto_send_enabled === false
        ? {
            status: "skipped" as const,
            channelId,
            errorMessage: "Envio automático para o Discord está desabilitado.",
          }
        : await sendDiscordChannelMessage(
            channelId,
            formatNoticeDiscordMessage(input.title, input.message, input.type),
          );

    discordStatus = discordResult.status;
    errorMessage = discordResult.errorMessage;

    await insertDiscordLog(serviceClient, {
      targetType: input.targetType,
      targetCreatorId: input.targetCreatorId ?? null,
      channelId: discordResult.channelId,
      messageType: "creator_notice",
      status: discordResult.status,
      errorMessage: discordResult.errorMessage,
    });
  }

  revalidatePath("/notices");
  revalidatePath("/dashboard");

  return {
    status: "created",
    discordStatus,
    errorMessage,
  };
}

export async function sendManualDiscordMessage(
  actor: SessionContext,
  input: ManualDiscordMessageInput,
) {
  if (actor.mockMode) {
    return {
      status: "skipped",
      errorMessage: "Modo demo ativo: nenhuma mensagem real foi enviada.",
    };
  }

  const serviceClient = createSupabaseServiceRoleClient();

  if (!serviceClient) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada.");
  }

  let channelId = input.channelId ?? null;

  if (input.targetType === "individual" && input.targetCreatorId) {
    const creator = await getCreatorChannel(serviceClient, input.targetCreatorId);
    channelId = creator?.discord_channel_id ?? null;
  }

  if (input.targetType === "general" && !channelId) {
    const { data: settings } = await serviceClient
      .from("discord_settings")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    channelId = settings?.general_creators_channel_id ?? null;
  }

  const result = await sendDiscordChannelMessage(channelId, input.content);

  await insertDiscordLog(serviceClient, {
    targetType: input.targetType,
    targetCreatorId: input.targetCreatorId ?? null,
    channelId: result.channelId,
    messageType: input.messageType,
    status: result.status,
    errorMessage: result.errorMessage,
  });

  revalidatePath("/settings/discord");

  return result;
}
