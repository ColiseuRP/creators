import "server-only";

import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
} from "@/lib/supabase/server";

type ServiceClient = NonNullable<ReturnType<typeof createSupabaseServiceRoleClient>>;
type ServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;
type SupabaseSchemaClient = ServiceClient | ServerClient;

export interface DiscordDeliverySchemaCapabilities {
  noticeStateColumns: boolean;
  logTrackingColumns: boolean;
}

async function hasSelectableColumn(
  serviceClient: SupabaseSchemaClient,
  table: "creator_notices" | "discord_message_logs",
  column: string,
) {
  const { error } = await serviceClient.from(table).select(column).limit(1);
  return !error;
}

export async function getDiscordDeliverySchemaCapabilities(
  serviceClient: SupabaseSchemaClient,
): Promise<DiscordDeliverySchemaCapabilities> {
  const [
    hasNoticeStatus,
    hasNoticeChannel,
    hasNoticeError,
    hasNoticeAttemptedAt,
    hasNoticeSentAt,
    hasLogNoticeId,
    hasLogAttemptedAt,
    hasLogDeliveredAt,
  ] = await Promise.all([
    hasSelectableColumn(serviceClient, "creator_notices", "discord_status"),
    hasSelectableColumn(serviceClient, "creator_notices", "discord_channel_id"),
    hasSelectableColumn(serviceClient, "creator_notices", "discord_error_message"),
    hasSelectableColumn(serviceClient, "creator_notices", "discord_last_attempt_at"),
    hasSelectableColumn(serviceClient, "creator_notices", "discord_sent_at"),
    hasSelectableColumn(serviceClient, "discord_message_logs", "notice_id"),
    hasSelectableColumn(serviceClient, "discord_message_logs", "attempted_at"),
    hasSelectableColumn(serviceClient, "discord_message_logs", "delivered_at"),
  ]);

  return {
    noticeStateColumns:
      hasNoticeStatus &&
      hasNoticeChannel &&
      hasNoticeError &&
      hasNoticeAttemptedAt &&
      hasNoticeSentAt,
    logTrackingColumns: hasLogNoticeId && hasLogAttemptedAt && hasLogDeliveredAt,
  };
}
