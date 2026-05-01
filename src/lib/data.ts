import "server-only";

import { SUPABASE_STORAGE_BUCKET, isMockMode } from "@/lib/env";
import { getMockData } from "@/lib/mock";
import { canAccessCreator } from "@/lib/permissions";
import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
} from "@/lib/supabase/server";
import type {
  Creator,
  CreatorApplication,
  CreatorNotice,
  DashboardSnapshot,
  DiscordMessageLog,
  DiscordSettings,
  MetricAttachment,
  MetricReview,
  MetricSubmission,
  SessionContext,
} from "@/lib/types";

type ServerSupabaseClient = NonNullable<
  Awaited<ReturnType<typeof createSupabaseServerClient>>
>;
type ServiceSupabaseClient = NonNullable<
  ReturnType<typeof createSupabaseServiceRoleClient>
>;
type SupabaseReader = ServerSupabaseClient | ServiceSupabaseClient;

function filterMockNotices(actor: SessionContext, notices: CreatorNotice[]) {
  if (actor.isAdmin || actor.canManageCreators) {
    return notices;
  }

  if (!actor.creator) {
    return [];
  }

  return notices.filter((notice) => {
    if (notice.target_type === "general") {
      return true;
    }

    if (notice.target_type === "category" && notice.target_category) {
      return actor.creator?.category === notice.target_category;
    }

    return notice.target_creator_id === actor.creator?.id;
  });
}

function filterMockMetrics(actor: SessionContext, metrics: MetricSubmission[]) {
  if (actor.isAdmin || actor.canManageCreators) {
    return metrics;
  }

  return metrics.filter((metric) => metric.creator_id === actor.creator?.id);
}

function filterMockCreators(actor: SessionContext, creators: Creator[]) {
  if (actor.isAdmin || actor.canManageCreators) {
    return creators;
  }

  return creators.filter((creator) => creator.id === actor.creator?.id);
}

function attachLatestDiscordLogsToNotices(
  actor: SessionContext,
  notices: CreatorNotice[],
  logs: DiscordMessageLog[],
) {
  if (!actor.canManageCreators) {
    return notices;
  }

  const latestLogByNoticeId = new Map<string, DiscordMessageLog>();

  for (const log of logs) {
    if (!log.notice_id || latestLogByNoticeId.has(log.notice_id)) {
      continue;
    }

    latestLogByNoticeId.set(log.notice_id, log);
  }

  return notices.map((notice) => ({
    ...notice,
    latest_discord_log: latestLogByNoticeId.get(notice.id) ?? null,
  }));
}

function hydrateMockData(actor: SessionContext) {
  const data = getMockData();

  return {
    creators: filterMockCreators(actor, data.creators),
    metrics: filterMockMetrics(actor, data.metricSubmissions),
    notices: attachLatestDiscordLogsToNotices(
      actor,
      filterMockNotices(actor, data.notices),
      data.discordLogs,
    ),
    applications: actor.canManageCreators ? data.applications : [],
    discordLogs: actor.canManageCreators ? data.discordLogs : [],
    discordSettings: actor.canManageCreators ? data.discordSettings : null,
  };
}

async function createSignedUrls(
  supabase: ServerSupabaseClient | null,
  attachments: MetricAttachment[],
) {
  if (!supabase || attachments.length === 0) {
    return attachments;
  }

  return Promise.all(
    attachments.map(async (attachment) => {
      const { data } = await supabase.storage
        .from(SUPABASE_STORAGE_BUCKET)
        .createSignedUrl(attachment.file_url, 60 * 60);

      return {
        ...attachment,
        signed_url: data?.signedUrl ?? null,
      };
    }),
  );
}

async function loadCreatorsWithClient(
  supabase: SupabaseReader,
  options?: {
    creatorIds?: string[];
    profileIds?: string[];
    onlyActive?: boolean;
  },
) {
  let creatorsQuery = supabase.from("creators").select("*").order("joined_at", {
    ascending: false,
  });

  if (options?.onlyActive) {
    creatorsQuery = creatorsQuery.eq("status", "active");
  }

  if (options?.creatorIds?.length) {
    creatorsQuery = creatorsQuery.in("id", options.creatorIds);
  }

  if (options?.profileIds?.length) {
    creatorsQuery = creatorsQuery.in("profile_id", options.profileIds);
  }

  const { data: creatorsRows } = await creatorsQuery;
  const creators = (creatorsRows ?? []) as Creator[];
  const creatorIds = creators.map((creator) => creator.id);
  const profileIds = creators.map((creator) => creator.profile_id);

  const [{ data: profilesRows }, { data: roomsRows }] = await Promise.all([
    profileIds.length
      ? supabase.from("profiles").select("*").in("id", profileIds)
      : Promise.resolve({ data: [] }),
    creatorIds.length
      ? supabase.from("creator_rooms").select("*").in("creator_id", creatorIds)
      : Promise.resolve({ data: [] }),
  ]);

  return creators.map((creator) => ({
    ...creator,
    profile:
      ((profilesRows ?? []) as Creator["profile"][]).find(
        (profile) => profile?.id === creator.profile_id,
      ) ?? null,
    room:
      ((roomsRows ?? []) as Creator["room"][]).find(
        (room) => room?.creator_id === creator.id,
      ) ?? null,
  }));
}

async function loadCreatorsBundle(actor: SessionContext) {
  if (actor.mockMode) {
    return hydrateMockData(actor).creators;
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  return loadCreatorsWithClient(supabase, {
    creatorIds: actor.role === "creator" && actor.creator ? [actor.creator.id] : undefined,
  });
}

export async function getPublicCreators() {
  if (isMockMode) {
    return getMockData().creators.filter((creator) => creator.status === "active");
  }

  const serviceClient = createSupabaseServiceRoleClient();

  if (!serviceClient) {
    return [];
  }

  return loadCreatorsWithClient(serviceClient, {
    onlyActive: true,
  });
}

export async function getCreators(actor: SessionContext) {
  return loadCreatorsBundle(actor);
}

export async function getCreatorById(actor: SessionContext, creatorId: string) {
  if (!canAccessCreator(actor, creatorId)) {
    return null;
  }

  const creators = await loadCreatorsBundle(actor);
  return creators.find((creator) => creator.id === creatorId) ?? null;
}

export async function getApplications(actor: SessionContext): Promise<CreatorApplication[]> {
  if (!actor.canManageCreators) {
    return [];
  }

  if (actor.mockMode) {
    return hydrateMockData(actor).applications;
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("creator_applications")
    .select("*")
    .order("created_at", { ascending: false });

  return (data ?? []) as CreatorApplication[];
}

export async function getNotices(actor: SessionContext): Promise<CreatorNotice[]> {
  if (actor.mockMode) {
    return hydrateMockData(actor).notices;
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data: noticeRows } = await supabase
    .from("creator_notices")
    .select("*")
    .order("sent_at", { ascending: false });

  const notices = (noticeRows ?? []) as CreatorNotice[];

  if (!actor.canManageCreators || notices.length === 0) {
    return notices;
  }

  const noticeIds = notices.map((notice) => notice.id);
  const { data: logRows } = await supabase
    .from("discord_message_logs")
    .select("*")
    .in("notice_id", noticeIds)
    .order("attempted_at", { ascending: false });

  return attachLatestDiscordLogsToNotices(
    actor,
    notices,
    (logRows ?? []) as DiscordMessageLog[],
  );
}

export async function getDiscordLogs(actor: SessionContext): Promise<DiscordMessageLog[]> {
  if (!actor.canManageCreators) {
    return [];
  }

  if (actor.mockMode) {
    return hydrateMockData(actor).discordLogs;
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("discord_message_logs")
    .select("*")
    .order("attempted_at", { ascending: false })
    .limit(20);

  return (data ?? []) as DiscordMessageLog[];
}

export async function getDiscordSettings(
  actor: SessionContext,
): Promise<DiscordSettings | null> {
  if (!actor.canManageCreators) {
    return null;
  }

  if (actor.mockMode) {
    return hydrateMockData(actor).discordSettings;
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("discord_settings")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as DiscordSettings | null) ?? null;
}

export async function getMetrics(actor: SessionContext): Promise<MetricSubmission[]> {
  if (actor.mockMode) {
    return hydrateMockData(actor).metrics;
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  let metricsQuery = supabase
    .from("metric_submissions")
    .select("*")
    .order("submitted_at", { ascending: false });

  if (actor.role === "creator" && actor.creator) {
    metricsQuery = metricsQuery.eq("creator_id", actor.creator.id);
  }

  const { data: metricRows } = await metricsQuery;
  const metrics = (metricRows ?? []) as MetricSubmission[];
  const metricIds = metrics.map((metric) => metric.id);
  const [attachmentsResult, reviewsResult, creators] = await Promise.all([
    metricIds.length
      ? supabase
          .from("metric_attachments")
          .select("*")
          .in("metric_submission_id", metricIds)
      : Promise.resolve({ data: [] }),
    metricIds.length
      ? supabase.from("metric_reviews").select("*").in("metric_submission_id", metricIds)
      : Promise.resolve({ data: [] }),
    loadCreatorsBundle(actor),
  ]);

  const creatorMap = new Map(creators.map((creator) => [creator.id, creator]));
  const signedAttachments = await createSignedUrls(
    supabase,
    (attachmentsResult.data ?? []) as MetricAttachment[],
  );

  return metrics.map((metric) => ({
    ...metric,
    creator: creatorMap.get(metric.creator_id) ?? null,
    attachments: signedAttachments.filter(
      (attachment) => attachment.metric_submission_id === metric.id,
    ),
    review:
      ((reviewsResult.data ?? []) as MetricReview[]).find(
        (review) => review.metric_submission_id === metric.id,
      ) ?? null,
  }));
}

export async function getCreatorDetail(actor: SessionContext, creatorId: string) {
  const [creator, metrics, notices, logs] = await Promise.all([
    getCreatorById(actor, creatorId),
    getMetrics(actor),
    getNotices(actor),
    getDiscordLogs(actor),
  ]);

  if (!creator) {
    return null;
  }

  return {
    creator,
    metrics: metrics.filter((metric) => metric.creator_id === creatorId),
    notices: notices.filter(
      (notice) =>
        notice.target_type === "general" ||
        notice.target_creator_id === creatorId ||
        (notice.target_type === "category" &&
          notice.target_category === creator.category),
    ),
    logs: logs.filter(
      (log) =>
        log.target_creator_id === creatorId ||
        (log.notice_id &&
          notices.some(
            (notice) =>
              notice.id === log.notice_id &&
              (notice.target_creator_id === creatorId ||
                notice.target_type === "general" ||
                (notice.target_type === "category" &&
                  notice.target_category === creator.category)),
          )),
    ),
  };
}

export async function getRoomView(actor: SessionContext) {
  const creators = await getCreators(actor);

  if (actor.role === "creator") {
    return creators.find((creator) => creator.id === actor.creator?.id) ?? null;
  }

  return creators;
}

export async function getDashboardSnapshot(
  actor: SessionContext,
): Promise<DashboardSnapshot> {
  const [creators, metrics, notices, applications, recentLogs] = await Promise.all([
    getCreators(actor),
    getMetrics(actor),
    getNotices(actor),
    getApplications(actor),
    getDiscordLogs(actor),
  ]);

  return {
    creatorsCount: creators.length,
    pendingMetricsCount: metrics.filter((metric) => metric.status === "pending").length,
    approvedMetricsCount: metrics.filter((metric) => metric.status === "approved").length,
    rejectedMetricsCount: metrics.filter((metric) => metric.status === "rejected").length,
    pendingApplicationsCount: applications.filter(
      (application) => application.status === "pending",
    ).length,
    noticesCount: notices.length,
    recentMetrics: metrics.slice(0, 5),
    recentNotices: notices.slice(0, 5),
    recentLogs: recentLogs.slice(0, 5),
    creators,
  };
}
