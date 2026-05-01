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
  getDiscordChannelIdForPurpose,
  getDiscordChannelPurposeForMessageType,
  getDiscordMissingChannelMessage,
} from "@/lib/discord-channels";
import { getNoticeDiscordMessageType } from "@/lib/discord-presenter";
import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
} from "@/lib/supabase/server";
import type {
  Creator,
  CreatorNotice,
  DiscordLogStatus,
  DiscordMessageLog,
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
  channelPurpose?:
    | "rules"
    | "influencer_requirements"
    | "streamer_requirements"
    | "ticket"
    | "punishments"
    | "notices"
    | "logos"
    | "general_creators";
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

interface PendingDiscordLogInput {
  noticeId?: string | null;
  targetType: NoticeTargetType | "metric_review";
  targetCreatorId?: string | null;
  channelId?: string | null;
  messageType: string;
}

type ServiceClient = NonNullable<ReturnType<typeof createSupabaseServiceRoleClient>>;

function requireCreatorContext(actor: SessionContext) {
  if (!actor.creator) {
    throw new Error("Creator não encontrado para a sessão atual.");
  }

  return actor.creator;
}

function getNowIso() {
  return new Date().toISOString();
}

async function getLatestDiscordSettings(serviceClient: ServiceClient) {
  const { data } = await serviceClient
    .from("discord_settings")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}

async function insertPendingDiscordLog(
  serviceClient: ServiceClient,
  input: PendingDiscordLogInput,
) {
  const attemptedAt = getNowIso();

  const { data } = await serviceClient
    .from("discord_message_logs")
    .insert({
      notice_id: input.noticeId ?? null,
      target_type: input.targetType,
      target_creator_id: input.targetCreatorId ?? null,
      channel_id: input.channelId ?? null,
      message_type: input.messageType,
      status: "pending",
      error_message: null,
      sent_at: attemptedAt,
      attempted_at: attemptedAt,
      delivered_at: null,
    })
    .select("*")
    .single();

  return {
    log: (data as DiscordMessageLog | null) ?? null,
    attemptedAt,
  };
}

async function finalizeDiscordLog(
  serviceClient: ServiceClient,
  logId: string | null | undefined,
  input: {
    channelId: string | null;
    status: DiscordLogStatus;
    errorMessage?: string | null;
  },
) {
  if (!logId) {
    return {
      deliveredAt: input.status === "sent" ? getNowIso() : null,
    };
  }

  const deliveredAt = input.status === "sent" ? getNowIso() : null;

  await serviceClient
    .from("discord_message_logs")
    .update({
      channel_id: input.channelId,
      status: input.status,
      error_message: input.errorMessage ?? null,
      delivered_at: deliveredAt,
    })
    .eq("id", logId);

  return { deliveredAt };
}

async function updateNoticeDiscordState(
  serviceClient: ServiceClient,
  noticeId: string,
  input: {
    status: DiscordLogStatus | null;
    channelId?: string | null;
    errorMessage?: string | null;
    attemptedAt?: string | null;
    sentAt?: string | null;
  },
) {
  await serviceClient
    .from("creator_notices")
    .update({
      discord_status: input.status,
      discord_channel_id: input.channelId ?? null,
      discord_error_message: input.errorMessage ?? null,
      discord_last_attempt_at: input.attemptedAt ?? null,
      discord_sent_at: input.sentAt ?? null,
    })
    .eq("id", noticeId);
}

async function getCreatorChannel(serviceClient: ServiceClient, creatorId: string) {
  const { data } = await serviceClient
    .from("creators")
    .select("*")
    .eq("id", creatorId)
    .single();

  return (data as Creator | null) ?? null;
}

async function resolveNoticeChannel(
  serviceClient: ServiceClient,
  notice: CreatorNotice,
  settings: Awaited<ReturnType<typeof getLatestDiscordSettings>>,
) {
  if (notice.target_type === "individual" && notice.target_creator_id) {
    const creator = await getCreatorChannel(serviceClient, notice.target_creator_id);

    return {
      creator,
      channelId: creator?.discord_channel_id ?? null,
      missingChannelMessage:
        "O creator ainda não possui uma sala configurada no Discord.",
    };
  }

  return {
    creator: null,
    channelId: getDiscordChannelIdForPurpose("notices", settings),
    missingChannelMessage: getDiscordMissingChannelMessage("notices"),
  };
}

async function deliverNoticeToDiscord(
  serviceClient: ServiceClient,
  notice: CreatorNotice,
) {
  const settings = await getLatestDiscordSettings(serviceClient);
  const { channelId, missingChannelMessage } = await resolveNoticeChannel(
    serviceClient,
    notice,
    settings,
  );
  const messageType = getNoticeDiscordMessageType(notice.target_type);
  const { log, attemptedAt } = await insertPendingDiscordLog(serviceClient, {
    noticeId: notice.id,
    targetType: notice.target_type,
    targetCreatorId: notice.target_creator_id ?? null,
    channelId,
    messageType,
  });

  let result:
    | Awaited<ReturnType<typeof sendDiscordChannelMessage>>
    | { status: "skipped"; channelId: string | null; errorMessage: string | null };

  if (settings?.auto_send_enabled === false) {
    result = {
      status: "skipped",
      channelId,
      errorMessage: "O envio automático de avisos está desativado nas configurações internas.",
    };
  } else {
    result = await sendDiscordChannelMessage(
      channelId,
      formatNoticeDiscordMessage(
        notice.target_type,
        notice.title,
        notice.message,
        notice.type,
      ),
      {
        missingChannelMessage,
      },
    );
  }

  const { deliveredAt } = await finalizeDiscordLog(serviceClient, log?.id, {
    channelId: result.channelId,
    status: result.status,
    errorMessage: result.errorMessage,
  });

  await updateNoticeDiscordState(serviceClient, notice.id, {
    status: result.status,
    channelId: result.channelId,
    errorMessage: result.errorMessage,
    attemptedAt,
    sentAt: deliveredAt,
  });

  return {
    ...result,
    attemptedAt,
    sentAt: deliveredAt,
    messageType,
  };
}

export async function uploadMetricAttachment(actor: SessionContext, file: File) {
  const creator = requireCreatorContext(actor);

  if (
    !ACCEPTED_ATTACHMENT_TYPES.includes(
      file.type as (typeof ACCEPTED_ATTACHMENT_TYPES)[number],
    )
  ) {
    throw new Error("Envie um arquivo nos formatos PNG, JPG, JPEG ou WEBP.");
  }

  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    throw new Error("O arquivo enviado é muito grande.");
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
    throw new Error("Não foi possível enviar os anexos no momento.");
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
    throw new Error("Não foi possível salvar um dos anexos enviados.");
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
    throw new Error("Não foi possível registrar a métrica agora.");
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
    throw new Error("Não foi possível salvar a métrica.");
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
      throw new Error("A métrica foi registrada, mas houve falha ao vincular os anexos.");
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
    throw new Error("Não foi possível receber sua inscrição agora.");
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
    throw new Error("Não foi possível enviar sua inscrição agora.");
  }

  revalidatePath("/inscricao");
  revalidatePath("/applications");

  return {
    status: "submitted",
    mode: "live" as const,
  };
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
      errorMessage: "Demonstração ativa: nenhuma alteração foi salva.",
    };
  }

  const serviceClient = createSupabaseServiceRoleClient();

  if (!serviceClient) {
    throw new Error("A configuração interna ainda não está pronta para esta ação.");
  }

  const { data: metric } = await serviceClient
    .from("metric_submissions")
    .select("*")
    .eq("id", input.metricId)
    .single();

  if (!metric) {
    throw new Error("Métrica não encontrada.");
  }

  const creator = await getCreatorChannel(serviceClient, metric.creator_id);

  if (!creator) {
    throw new Error("Creator não encontrado para a métrica.");
  }

  const reviewReason = input.reason?.trim() || null;

  const { error: updateError } = await serviceClient
    .from("metric_submissions")
    .update({
      status: input.decision,
      reviewed_at: getNowIso(),
      reviewed_by: actor.profile.id,
      admin_observation: reviewReason,
      rejection_reason: input.decision === "rejected" ? reviewReason : null,
    })
    .eq("id", input.metricId);

  if (updateError) {
    throw new Error("Não foi possível concluir a análise da métrica.");
  }

  await serviceClient.from("metric_reviews").insert({
    metric_submission_id: input.metricId,
    reviewed_by: actor.profile.id,
    decision: input.decision,
    reason: reviewReason,
  });

  await serviceClient.from("creator_notices").insert({
    title: input.decision === "approved" ? "Métrica aprovada" : "Métrica negada",
    message:
      input.decision === "approved"
        ? reviewReason || "Métrica aprovada. Continue representando o Coliseu!"
        : reviewReason || "Métrica negada. Verifique o motivo informado pela equipe.",
    type: input.decision === "approved" ? "success" : "warning",
    target_type: "individual",
    target_creator_id: creator.id,
    sent_by: actor.profile.id,
    send_to_discord: false,
  });

  const settings = await getLatestDiscordSettings(serviceClient);
  const { log } = await insertPendingDiscordLog(serviceClient, {
    targetType: "metric_review",
    targetCreatorId: creator.id,
    channelId: creator.discord_channel_id,
    messageType:
      input.decision === "approved" ? "metric_approved" : "metric_rejected",
  });

  const discordResult =
    settings?.auto_send_enabled === false
      ? {
          status: "skipped" as const,
          channelId: creator.discord_channel_id,
          errorMessage: "O envio automático de avisos está desativado nas configurações internas.",
        }
      : await sendDiscordChannelMessage(
          creator.discord_channel_id,
          formatMetricReviewDiscordMessage(
            creator,
            metric,
            input.decision,
            reviewReason ?? undefined,
          ),
          {
            missingChannelMessage:
              "O creator ainda não possui uma sala configurada no Discord.",
          },
        );

  await finalizeDiscordLog(serviceClient, log?.id, {
    channelId: discordResult.channelId,
    status: discordResult.status,
    errorMessage: discordResult.errorMessage,
  });

  revalidatePath("/metrics");
  revalidatePath(`/central/creators/${creator.id}`);
  revalidatePath("/dashboard");
  revalidatePath("/notices");
  revalidatePath("/room");
  revalidatePath("/settings/discord");

  return {
    metricId: input.metricId,
    decision: input.decision,
    discordStatus: discordResult.status,
    errorMessage: discordResult.errorMessage,
  };
}

export async function createNotice(actor: SessionContext, input: NoticeInput) {
  if (!actor.profile) {
    throw new Error("Perfil não encontrado.");
  }

  if (actor.mockMode) {
    return {
      status: "created",
      discordStatus: input.sendToDiscord ? "skipped" : null,
      noticeId: `mock-notice-${Date.now()}`,
    };
  }

  const serviceClient = createSupabaseServiceRoleClient();

  if (!serviceClient) {
    throw new Error("A configuração interna ainda não está pronta para esta ação.");
  }

  const { data: notice, error: noticeError } = await serviceClient
    .from("creator_notices")
    .insert({
      title: input.title,
      message: input.message,
      type: input.type,
      target_type: input.targetType,
      target_creator_id: input.targetCreatorId ?? null,
      target_category: input.targetCategory ?? null,
      sent_by: actor.profile.id,
      send_to_discord: input.sendToDiscord,
      discord_status: input.sendToDiscord ? "pending" : null,
      discord_channel_id: null,
      discord_error_message: null,
      discord_last_attempt_at: null,
      discord_sent_at: null,
    })
    .select("*")
    .single();

  if (noticeError || !notice) {
    throw new Error("Não foi possível enviar o aviso.");
  }

  let discordStatus: "sent" | "failed" | "skipped" | null = null;
  let errorMessage: string | null = null;

  if (input.sendToDiscord) {
    const discordResult = await deliverNoticeToDiscord(
      serviceClient,
      notice as CreatorNotice,
    );

    discordStatus = discordResult.status;
    errorMessage = discordResult.errorMessage;
  }

  revalidatePath("/notices");
  revalidatePath("/dashboard");
  revalidatePath("/settings/discord");

  if (input.targetType === "individual" && input.targetCreatorId) {
    revalidatePath(`/central/creators/${input.targetCreatorId}`);
  }

  return {
    status: "created",
    discordStatus,
    errorMessage,
    noticeId: notice.id,
  };
}

export async function resendNoticeToDiscord(actor: SessionContext, noticeId: string) {
  if (!actor.profile) {
    throw new Error("Perfil não encontrado.");
  }

  if (actor.mockMode) {
    return {
      noticeId,
      discordStatus: "skipped",
      errorMessage: "Demonstração ativa: nenhum envio real foi executado.",
    };
  }

  const serviceClient = createSupabaseServiceRoleClient();

  if (!serviceClient) {
    throw new Error("A configuração interna ainda não está pronta para esta ação.");
  }

  const { data: notice } = await serviceClient
    .from("creator_notices")
    .select("*")
    .eq("id", noticeId)
    .single();

  if (!notice) {
    throw new Error("Aviso não encontrado.");
  }

  if (!notice.send_to_discord) {
    await serviceClient
      .from("creator_notices")
      .update({ send_to_discord: true })
      .eq("id", noticeId);
  }

  const discordResult = await deliverNoticeToDiscord(
    serviceClient,
    {
      ...(notice as CreatorNotice),
      send_to_discord: true,
    },
  );

  revalidatePath("/notices");
  revalidatePath("/dashboard");
  revalidatePath("/settings/discord");

  if (notice.target_type === "individual" && notice.target_creator_id) {
    revalidatePath(`/central/creators/${notice.target_creator_id}`);
  }

  return {
    noticeId,
    discordStatus: discordResult.status,
    errorMessage: discordResult.errorMessage,
  };
}

export async function sendManualDiscordMessage(
  actor: SessionContext,
  input: ManualDiscordMessageInput,
) {
  if (actor.mockMode) {
    return {
      status: "skipped",
      errorMessage: "Demonstração ativa: nenhuma mensagem real foi enviada.",
    };
  }

  const serviceClient = createSupabaseServiceRoleClient();

  if (!serviceClient) {
    throw new Error("A configuração interna ainda não está pronta para esta ação.");
  }

  let channelId = input.channelId ?? null;
  let missingChannelMessage: string | undefined;

  if (input.targetType === "individual" && input.targetCreatorId) {
    const creator = await getCreatorChannel(serviceClient, input.targetCreatorId);
    channelId = creator?.discord_channel_id ?? null;
    missingChannelMessage = "O creator ainda não possui uma sala configurada no Discord.";
  }

  if (input.targetType === "general" && !channelId) {
    const settings = await getLatestDiscordSettings(serviceClient);
    const resolvedPurpose =
      input.channelPurpose ??
      getDiscordChannelPurposeForMessageType(input.messageType) ??
      "notices";

    channelId = getDiscordChannelIdForPurpose(resolvedPurpose, settings);
    missingChannelMessage = getDiscordMissingChannelMessage(resolvedPurpose);
  }

  const { log } = await insertPendingDiscordLog(serviceClient, {
    targetType: input.targetType,
    targetCreatorId: input.targetCreatorId ?? null,
    channelId,
    messageType: input.messageType,
  });

  const result = await sendDiscordChannelMessage(channelId, input.content, {
    missingChannelMessage,
  });

  await finalizeDiscordLog(serviceClient, log?.id, {
    channelId: result.channelId,
    status: result.status,
    errorMessage: result.errorMessage,
  });

  revalidatePath("/settings/discord");

  return result;
}
