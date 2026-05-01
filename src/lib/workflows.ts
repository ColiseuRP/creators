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
import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
} from "@/lib/supabase/server";
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

interface CreatorApplicationInput {
  name: string;
  discordName: string;
  discordId: string;
  cityName: string;
  age: number;
  category: string;
  twitchUrl?: string;
  tiktokUrl?: string;
  youtubeUrl?: string;
  instagramUrl?: string;
  frequency: string;
  reason: string;
  contentLinks?: string;
  observations?: string;
}

function requireCreatorContext(actor: SessionContext) {
  if (!actor.creator) {
    throw new Error("Creator nao encontrado para a sessao atual.");
  }

  return actor.creator;
}

export async function uploadMetricAttachment(actor: SessionContext, file: File) {
  const creator = requireCreatorContext(actor);

  if (
    !ACCEPTED_ATTACHMENT_TYPES.includes(
      file.type as (typeof ACCEPTED_ATTACHMENT_TYPES)[number],
    )
  ) {
    throw new Error("Formato de arquivo invalido. Envie PNG, JPG, JPEG ou WEBP.");
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
    throw new Error("Nao foi possivel enviar os anexos no momento.");
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
    throw new Error("Nao foi possivel salvar um dos anexos enviados.");
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
    throw new Error("Nao foi possivel registrar a metrica agora.");
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
    throw new Error("Nao foi possivel salvar a metrica.");
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
      throw new Error("A metrica foi registrada, mas houve falha ao vincular os anexos.");
    }
  }

  revalidatePath("/metrics");
  revalidatePath("/dashboard");
  revalidatePath("/room");

  return {
    id: metric.id,
    creatorId: metric.creator_id,
    status: metric.status,
  };
}

export async function submitCreatorApplication(payload: CreatorApplicationInput) {
  if (!createSupabaseServiceRoleClient() && !(await createSupabaseServerClient())) {
    return {
      status: "submitted",
      mode: "mock" as const,
    };
  }

  const serviceClient = createSupabaseServiceRoleClient();
  const supabase = serviceClient ?? (await createSupabaseServerClient());

  if (!supabase) {
    throw new Error("Nao foi possivel receber sua inscricao agora.");
  }

  const { error } = await supabase.from("creator_applications").insert({
    name: payload.name,
    discord_name: payload.discordName,
    discord_id: payload.discordId,
    city_name: payload.cityName,
    age: payload.age,
    category: payload.category,
    twitch_url: payload.twitchUrl || null,
    tiktok_url: payload.tiktokUrl || null,
    youtube_url: payload.youtubeUrl || null,
    instagram_url: payload.instagramUrl || null,
    frequency: payload.frequency,
    reason: payload.reason,
    content_links: payload.contentLinks || null,
    observations: payload.observations || null,
    status: "pending",
  });

  if (error) {
    throw new Error("Nao foi possivel enviar sua inscricao agora.");
  }

  revalidatePath("/inscricao");
  revalidatePath("/applications");

  return {
    status: "submitted",
    mode: "live" as const,
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
    throw new Error("Perfil nao encontrado.");
  }

  if (actor.mockMode) {
    return {
      metricId: input.metricId,
      decision: input.decision,
      discordStatus: "skipped",
      errorMessage: "Demonstracao ativa: nenhuma alteracao foi salva.",
    };
  }

  const serviceClient = createSupabaseServiceRoleClient();

  if (!serviceClient) {
    throw new Error("A configuracao interna ainda nao esta pronta para esta acao.");
  }

  const { data: metric } = await serviceClient
    .from("metric_submissions")
    .select("*")
    .eq("id", input.metricId)
    .single();

  if (!metric) {
    throw new Error("Metrica nao encontrada.");
  }

  const { data: creator } = await serviceClient
    .from("creators")
    .select("*")
    .eq("id", metric.creator_id)
    .single();

  if (!creator) {
    throw new Error("Creator nao encontrado para a metrica.");
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
    throw new Error("Nao foi possivel concluir a analise da metrica.");
  }

  await serviceClient.from("metric_reviews").insert({
    metric_submission_id: input.metricId,
    reviewed_by: actor.profile.id,
    decision: input.decision,
    reason: reviewReason,
  });

  await serviceClient.from("creator_notices").insert({
    title: input.decision === "approved" ? "Metrica aprovada" : "Metrica negada",
    message:
      input.decision === "approved"
        ? reviewReason || "Metrica aprovada. Continue representando o Coliseu!"
        : reviewReason || "Metrica negada. Verifique o motivo informado pela equipe.",
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
          errorMessage: "O envio automatico de avisos esta desligado.",
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
  revalidatePath(`/central/creators/${creator.id}`);
  revalidatePath("/dashboard");
  revalidatePath("/notices");
  revalidatePath("/room");

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
    throw new Error("Perfil nao encontrado.");
  }

  if (actor.mockMode) {
    return {
      status: "created",
      discordStatus: input.sendToDiscord ? "skipped" : null,
    };
  }

  const serviceClient = createSupabaseServiceRoleClient();

  if (!serviceClient) {
    throw new Error("A configuracao interna ainda nao esta pronta para esta acao.");
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
    throw new Error("Nao foi possivel enviar o aviso.");
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
            errorMessage: "O envio automatico de avisos esta desligado.",
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
      errorMessage: "Demonstracao ativa: nenhuma mensagem real foi enviada.",
    };
  }

  const serviceClient = createSupabaseServiceRoleClient();

  if (!serviceClient) {
    throw new Error("A configuracao interna ainda nao esta pronta para esta acao.");
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
