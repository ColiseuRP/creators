import "server-only";

import { getServerEnvValue } from "@/lib/server-env";
import type { DiscordSettings } from "@/lib/types";

export type DiscordChannelPurpose =
  | "rules"
  | "influencer_requirements"
  | "streamer_requirements"
  | "ticket"
  | "punishments"
  | "notices"
  | "logos"
  | "general_creators";

export interface DiscordChannelStatusItem {
  purpose: DiscordChannelPurpose;
  label: string;
  description: string;
  channelId: string | null;
  configured: boolean;
  required: boolean;
  source: "env" | "fallback" | "database" | "missing";
  note?: string;
}

function normalizeChannelId(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function getDiscordNoticeChannelId(settings?: DiscordSettings | null) {
  return (
    normalizeChannelId(getServerEnvValue("DISCORD_NOTICES_CHANNEL_ID")) ??
    normalizeChannelId(getServerEnvValue("DISCORD_GENERAL_CREATORS_CHANNEL_ID")) ??
    normalizeChannelId(settings?.general_creators_channel_id) ??
    null
  );
}

export function getDiscordGeneralCreatorsChannelId(settings?: DiscordSettings | null) {
  return (
    normalizeChannelId(getServerEnvValue("DISCORD_GENERAL_CREATORS_CHANNEL_ID")) ??
    normalizeChannelId(getServerEnvValue("DISCORD_NOTICES_CHANNEL_ID")) ??
    normalizeChannelId(settings?.general_creators_channel_id) ??
    null
  );
}

export function getDiscordChannelIdForPurpose(
  purpose: DiscordChannelPurpose,
  settings?: DiscordSettings | null,
) {
  switch (purpose) {
    case "rules":
      return normalizeChannelId(getServerEnvValue("DISCORD_RULES_CHANNEL_ID"));
    case "influencer_requirements":
      return normalizeChannelId(
        getServerEnvValue("DISCORD_INFLUENCER_REQUIREMENTS_CHANNEL_ID"),
      );
    case "streamer_requirements":
      return normalizeChannelId(
        getServerEnvValue("DISCORD_STREAMER_REQUIREMENTS_CHANNEL_ID"),
      );
    case "ticket":
      return normalizeChannelId(getServerEnvValue("DISCORD_TICKET_CHANNEL_ID"));
    case "punishments":
      return normalizeChannelId(getServerEnvValue("DISCORD_PUNISHMENTS_CHANNEL_ID"));
    case "notices":
      return getDiscordNoticeChannelId(settings);
    case "logos":
      return normalizeChannelId(getServerEnvValue("DISCORD_LOGOS_CHANNEL_ID"));
    case "general_creators":
      return getDiscordGeneralCreatorsChannelId(settings);
    default:
      return null;
  }
}

export function getDiscordMissingChannelMessage(purpose: DiscordChannelPurpose) {
  switch (purpose) {
    case "rules":
      return "Canal de regras do Discord não configurado.";
    case "influencer_requirements":
      return "Canal de requisitos dos influencers não configurado no Discord.";
    case "streamer_requirements":
      return "Canal de requisitos dos streamers não configurado no Discord.";
    case "ticket":
      return "Canal de tickets do Discord não configurado.";
    case "punishments":
      return "Canal de punições do Discord não configurado.";
    case "notices":
      return "Canal de avisos do Discord não configurado.";
    case "logos":
      return "Canal de logos do Discord não configurado.";
    case "general_creators":
    default:
      return "Canal geral dos creators no Discord não configurado.";
  }
}

export function getDiscordChannelPurposeForMessageType(messageType: string) {
  switch (messageType) {
    case "notice_general":
    case "notice_category":
    case "rules_notice":
      return "notices" as const;
    case "rules_update":
      return "rules" as const;
    case "influencer_requirements":
      return "influencer_requirements" as const;
    case "streamer_requirements":
      return "streamer_requirements" as const;
    case "ticket_guidance":
    case "support_ticket":
      return "ticket" as const;
    case "punishment_notice":
    case "punishment_record":
    case "creator_warning":
    case "creator_removed":
      return "punishments" as const;
    case "logo_delivery":
    case "brand_asset":
      return "logos" as const;
    default:
      return null;
  }
}

export function getDiscordChannelStatusItems(settings?: DiscordSettings | null) {
  const noticesId = getDiscordNoticeChannelId(settings);
  const generalCreatorsId = getDiscordGeneralCreatorsChannelId(settings);
  const noticesUsesFallbackFromGeneral =
    !normalizeChannelId(getServerEnvValue("DISCORD_NOTICES_CHANNEL_ID")) &&
    Boolean(normalizeChannelId(getServerEnvValue("DISCORD_GENERAL_CREATORS_CHANNEL_ID")));
  const noticesUsesDatabaseFallback =
    !normalizeChannelId(getServerEnvValue("DISCORD_NOTICES_CHANNEL_ID")) &&
    !normalizeChannelId(getServerEnvValue("DISCORD_GENERAL_CREATORS_CHANNEL_ID")) &&
    Boolean(normalizeChannelId(settings?.general_creators_channel_id));

  const generalUsesNoticesFallback =
    !normalizeChannelId(getServerEnvValue("DISCORD_GENERAL_CREATORS_CHANNEL_ID")) &&
    Boolean(normalizeChannelId(getServerEnvValue("DISCORD_NOTICES_CHANNEL_ID")));
  const generalUsesDatabaseFallback =
    !normalizeChannelId(getServerEnvValue("DISCORD_GENERAL_CREATORS_CHANNEL_ID")) &&
    !normalizeChannelId(getServerEnvValue("DISCORD_NOTICES_CHANNEL_ID")) &&
    Boolean(normalizeChannelId(settings?.general_creators_channel_id));

  return [
    {
      purpose: "rules",
      label: "Canal de regras",
      description: "Mensagens e atualizações das regras gerais do programa.",
      channelId: getDiscordChannelIdForPurpose("rules", settings),
      configured: Boolean(getDiscordChannelIdForPurpose("rules", settings)),
      required: true,
      source: getDiscordChannelIdForPurpose("rules", settings) ? "env" : "missing",
    },
    {
      purpose: "influencer_requirements",
      label: "Canal de requisitos dos influencers",
      description: "Publicações oficiais com os requisitos dos Influencers Coliseu.",
      channelId: getDiscordChannelIdForPurpose("influencer_requirements", settings),
      configured: Boolean(getDiscordChannelIdForPurpose("influencer_requirements", settings)),
      required: true,
      source: getDiscordChannelIdForPurpose("influencer_requirements", settings)
        ? "env"
        : "missing",
    },
    {
      purpose: "streamer_requirements",
      label: "Canal de requisitos dos streamers",
      description: "Publicações oficiais com os requisitos do Programa de Streamers.",
      channelId: getDiscordChannelIdForPurpose("streamer_requirements", settings),
      configured: Boolean(getDiscordChannelIdForPurpose("streamer_requirements", settings)),
      required: true,
      source: getDiscordChannelIdForPurpose("streamer_requirements", settings)
        ? "env"
        : "missing",
    },
    {
      purpose: "ticket",
      label: "Canal de tickets",
      description: "Orientações de suporte e abertura de ticket para creators.",
      channelId: getDiscordChannelIdForPurpose("ticket", settings),
      configured: Boolean(getDiscordChannelIdForPurpose("ticket", settings)),
      required: true,
      source: getDiscordChannelIdForPurpose("ticket", settings) ? "env" : "missing",
    },
    {
      purpose: "punishments",
      label: "Canal de punições",
      description: "Registros internos e avisos sobre advertências, punições e remoções.",
      channelId: getDiscordChannelIdForPurpose("punishments", settings),
      configured: Boolean(getDiscordChannelIdForPurpose("punishments", settings)),
      required: true,
      source: getDiscordChannelIdForPurpose("punishments", settings) ? "env" : "missing",
    },
    {
      purpose: "notices",
      label: "Canal de avisos",
      description: "Avisos gerais enviados para os creators.",
      channelId: noticesId,
      configured: Boolean(noticesId),
      required: true,
      source: noticesId
        ? noticesUsesFallbackFromGeneral
          ? "fallback"
          : noticesUsesDatabaseFallback
            ? "database"
            : "env"
        : "missing",
      note: noticesUsesFallbackFromGeneral
        ? "Usando o canal geral dos creators como compatibilidade."
        : noticesUsesDatabaseFallback
          ? "Usando o canal geral salvo nas configurações internas como fallback."
          : undefined,
    },
    {
      purpose: "logos",
      label: "Canal de logos",
      description: "Envio de logos, artes e materiais visuais dos creators.",
      channelId: getDiscordChannelIdForPurpose("logos", settings),
      configured: Boolean(getDiscordChannelIdForPurpose("logos", settings)),
      required: true,
      source: getDiscordChannelIdForPurpose("logos", settings) ? "env" : "missing",
    },
    {
      purpose: "general_creators",
      label: "Canal geral dos creators",
      description: "Compatibilidade com a configuração antiga de avisos gerais.",
      channelId: generalCreatorsId,
      configured: Boolean(generalCreatorsId),
      required: false,
      source: generalCreatorsId
        ? generalUsesNoticesFallback
          ? "fallback"
          : generalUsesDatabaseFallback
            ? "database"
            : "env"
        : "missing",
      note: generalUsesNoticesFallback
        ? "Usando o canal de avisos como fallback de compatibilidade."
        : generalUsesDatabaseFallback
          ? "Usando o canal salvo nas configurações internas enquanto a variável não estiver preenchida."
          : "Compatibilidade mantida para estruturas antigas do servidor.",
    },
  ] satisfies DiscordChannelStatusItem[];
}

export function getDiscordChannelLabelById(
  channelId: string | null | undefined,
  settings?: DiscordSettings | null,
) {
  const normalizedChannelId = normalizeChannelId(channelId);

  if (!normalizedChannelId) {
    return null;
  }

  const knownChannel = getDiscordChannelStatusItems(settings).find(
    (item) => item.configured && item.channelId === normalizedChannelId,
  );

  return knownChannel?.label ?? null;
}
