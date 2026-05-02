import { parseDiscordIdList } from "../../shared/discord-ticketing";
import type { BotConfig } from "../types";

const REQUIRED_ENV_KEYS = [
  "DISCORD_BOT_TOKEN",
  "DISCORD_GUILD_ID",
  "DISCORD_CITIZEN_ROLE_ID",
  "DISCORD_TICKET_CHANNEL_ID",
  "DISCORD_CREATOR_FORM_CHANNEL_ID",
  "DISCORD_CREATOR_FORM_SUBMISSIONS_CHANNEL_ID",
  "DISCORD_CREATORS_CATEGORY_ID",
  "DISCORD_NOTICES_CHANNEL_ID",
  "DISCORD_APPROVED_CREATOR_ROLE_ID",
  "DISCORD_RESPONSAVEL_STAFF_ROLE_ID",
] as const;

type OptionalEnvKey =
  | "DISCORD_ARCHIVED_TICKETS_CATEGORY_ID"
  | "DISCORD_GENERAL_CREATORS_CHANNEL_ID"
  | "DISCORD_RESPONSAVEL_CREATORS_ROLE_ID"
  | "DISCORD_STAFF_ROLE_IDS"
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "SUPABASE_SERVICE_ROLE_KEY";

function getEnvValue(key: (typeof REQUIRED_ENV_KEYS)[number] | OptionalEnvKey) {
  return process.env[key]?.trim() || null;
}

function buildStaffRoleIds(input: {
  responsavelStaffRoleId: string;
  responsavelCreatorsRoleId: string | null;
  extraStaffRoleIds: string[];
}) {
  return [
    ...new Set(
      [
        input.responsavelStaffRoleId,
        input.responsavelCreatorsRoleId,
        ...input.extraStaffRoleIds,
      ].filter((roleId): roleId is string => Boolean(roleId)),
    ),
  ];
}

export function loadBotConfig(): BotConfig {
  const missingKeys = REQUIRED_ENV_KEYS.filter((key) => !getEnvValue(key));

  if (missingKeys.length > 0) {
    throw new Error(
      `Variáveis obrigatórias ausentes para o bot: ${missingKeys.join(", ")}`,
    );
  }

  const noticesChannelId = getEnvValue("DISCORD_NOTICES_CHANNEL_ID")!;
  const generalCreatorsChannelId =
    getEnvValue("DISCORD_GENERAL_CREATORS_CHANNEL_ID") ?? noticesChannelId;
  const responsavelStaffRoleId = getEnvValue("DISCORD_RESPONSAVEL_STAFF_ROLE_ID")!;
  const responsavelCreatorsRoleId = getEnvValue("DISCORD_RESPONSAVEL_CREATORS_ROLE_ID");

  return {
    token: getEnvValue("DISCORD_BOT_TOKEN")!,
    guildId: getEnvValue("DISCORD_GUILD_ID")!,
    citizenRoleId: getEnvValue("DISCORD_CITIZEN_ROLE_ID")!,
    ticketChannelId: getEnvValue("DISCORD_TICKET_CHANNEL_ID")!,
    creatorFormChannelId: getEnvValue("DISCORD_CREATOR_FORM_CHANNEL_ID")!,
    creatorFormSubmissionsChannelId: getEnvValue(
      "DISCORD_CREATOR_FORM_SUBMISSIONS_CHANNEL_ID",
    )!,
    creatorsCategoryId: getEnvValue("DISCORD_CREATORS_CATEGORY_ID")!,
    noticesChannelId,
    generalCreatorsChannelId,
    approvedCreatorRoleId: getEnvValue("DISCORD_APPROVED_CREATOR_ROLE_ID")!,
    responsavelStaffRoleId,
    responsavelCreatorsRoleId,
    staffRoleIds: buildStaffRoleIds({
      responsavelStaffRoleId,
      responsavelCreatorsRoleId,
      extraStaffRoleIds: parseDiscordIdList(getEnvValue("DISCORD_STAFF_ROLE_IDS")),
    }),
    archivedTicketsCategoryId: getEnvValue("DISCORD_ARCHIVED_TICKETS_CATEGORY_ID"),
    supabaseUrl: getEnvValue("NEXT_PUBLIC_SUPABASE_URL"),
    serviceRoleKey: getEnvValue("SUPABASE_SERVICE_ROLE_KEY"),
  };
}
