import type { CreatorTicketType } from "../lib/types";

export const CREATOR_TICKET_PANEL_TYPE = "creator_ticket_panel";
export const CREATOR_TICKET_CREATE_CUSTOM_ID = "creator_ticket_create";
export const CREATOR_TICKET_TYPE_SELECT_CUSTOM_ID = "creator_ticket_type_select";
export const CREATOR_TICKET_STREAMER_VALUE = "streamer";
export const CREATOR_TICKET_INFLUENCER_VALUE = "influencer";
export const LEGACY_CREATOR_TICKET_STREAMER_VALUE = "creator_ticket_streamer";
export const LEGACY_CREATOR_TICKET_INFLUENCER_VALUE = "creator_ticket_influencer";
export const CREATOR_TICKET_CLOSE_CUSTOM_ID = "creator_ticket_close";
export const CREATOR_TICKET_STAFF_MENU_CUSTOM_ID = "creator_ticket_staff_menu";
export const CREATOR_TICKET_CLAIM_CUSTOM_ID = "creator_ticket_claim";
export const CREATOR_TICKET_STAFF_ACTION_SELECT_CUSTOM_ID =
  "creator_ticket_staff_action_select";
export const CREATOR_TICKET_STAFF_RENAME_VALUE = "creator_ticket_staff_rename";
export const CREATOR_TICKET_STAFF_NOTIFY_VALUE = "creator_ticket_staff_notify";
export const CREATOR_TICKET_CLOSE_MODAL_PREFIX = "creator_ticket_close_modal:";
export const CREATOR_TICKET_RENAME_MODAL_PREFIX = "creator_ticket_rename_modal:";
export const CREATOR_TICKET_NOTIFY_MODAL_PREFIX = "creator_ticket_notify_modal:";
export const CREATOR_TICKET_CLOSE_REASON_INPUT_ID = "close_reason";
export const CREATOR_TICKET_RENAME_INPUT_ID = "new_channel_name";
export const CREATOR_TICKET_NOTIFY_INPUT_ID = "notify_message";
export const CREATOR_TICKET_CLOSE_DELAY_MS = 5_000;
export const SETUP_TICKETS_COMMAND_NAME = "setup-tickets";

const CREATOR_TICKET_EMBED_COLOR = 0xf5c542;
const STREAMER_TICKET_EMOJI = "\u{1F3A5}";
const INFLUENCER_TICKET_EMOJI = "\u{1F4F8}";
const STREAMER_TICKET_EMOJI_PREFIX = `${STREAMER_TICKET_EMOJI}・`;
const INFLUENCER_TICKET_EMOJI_PREFIX = `${INFLUENCER_TICKET_EMOJI}・`;
const MAX_DISCORD_CHANNEL_NAME_LENGTH = 90;

export function parseDiscordIdList(value: string | null | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function sanitizeTicketChannelSegment(value: string) {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return (normalized || "creator").slice(0, 56);
}

function truncateChannelName(value: string) {
  return value.slice(0, MAX_DISCORD_CHANNEL_NAME_LENGTH);
}

function getTicketChannelBaseSlug(
  ticketType: CreatorTicketType | null,
  username: string,
) {
  const sanitizedUsername = sanitizeTicketChannelSegment(username);

  switch (ticketType) {
    case "streamer":
      return `ticket-streamer-${sanitizedUsername}`;
    case "influencer":
      return `ticket-influencer-${sanitizedUsername}`;
    default:
      return `ticket-creator-${sanitizedUsername}`;
  }
}

function getTicketChannelNameDecorators(ticketType: CreatorTicketType | null) {
  switch (ticketType) {
    case "streamer":
      return {
        preferredPrefix: STREAMER_TICKET_EMOJI_PREFIX,
        fallbackPrefix: "video-",
      };
    case "influencer":
      return {
        preferredPrefix: INFLUENCER_TICKET_EMOJI_PREFIX,
        fallbackPrefix: "foto-",
      };
    default:
      return {
        preferredPrefix: "",
        fallbackPrefix: "",
      };
  }
}

export function buildCreatorTicketChannelNameCandidates(
  ticketType: CreatorTicketType | null,
  username: string,
) {
  const baseSlug = getTicketChannelBaseSlug(ticketType, username);
  const decorators = getTicketChannelNameDecorators(ticketType);

  return [
    truncateChannelName(`${decorators.preferredPrefix}${baseSlug}`),
    truncateChannelName(`${decorators.fallbackPrefix}${baseSlug}`),
  ].filter((value, index, items) => Boolean(value) && items.indexOf(value) === index);
}

export function buildCustomCreatorTicketChannelNameCandidates(
  ticketType: CreatorTicketType | null,
  requestedName: string,
) {
  const baseSlug = sanitizeTicketChannelSegment(requestedName);
  const decorators = getTicketChannelNameDecorators(ticketType);

  return [
    truncateChannelName(`${decorators.preferredPrefix}${baseSlug}`),
    truncateChannelName(`${decorators.fallbackPrefix}${baseSlug}`),
  ].filter((value, index, items) => Boolean(value) && items.indexOf(value) === index);
}

export function parseCreatorTicketTypeValue(
  value: string | null | undefined,
): CreatorTicketType | null {
  switch (value) {
    case CREATOR_TICKET_STREAMER_VALUE:
    case LEGACY_CREATOR_TICKET_STREAMER_VALUE:
      return "streamer";
    case CREATOR_TICKET_INFLUENCER_VALUE:
    case LEGACY_CREATOR_TICKET_INFLUENCER_VALUE:
      return "influencer";
    default:
      return null;
  }
}

export function getCreatorTicketTypeLabel(ticketType: CreatorTicketType | null | undefined) {
  switch (ticketType) {
    case "streamer":
      return "Streamer";
    case "influencer":
      return "Influencer";
    default:
      return "Não informado";
  }
}

export function getCreatorTicketTypeAudienceLabel(ticketType: CreatorTicketType) {
  return ticketType === "streamer" ? "Atendimento Streamer" : "Atendimento Influencer";
}

export function buildTicketPanelPayload() {
  return {
    embeds: [
      {
        title: "🎫 Atendimento Creators Coliseu",
        description: [
          "Bem-vindo à central de atendimento dos Creators Coliseu.",
          "",
          "Selecione abaixo o tipo de atendimento que deseja abrir. Após escolher, uma sala privada será criada para você conversar diretamente com a equipe responsável.",
        ].join("\n"),
        color: CREATOR_TICKET_EMBED_COLOR,
        fields: [
          {
            name: "📸 Influencer",
            value:
              "Abra um atendimento relacionado ao programa de influencers, requisitos, postagens, colabs, stories ou dúvidas sobre divulgação.",
            inline: false,
          },
          {
            name: "🎮 Streamer",
            value:
              "Abra um atendimento relacionado ao programa de streamers, lives, métricas, canais, prints, ranques ou análise de desempenho.",
            inline: false,
          },
        ],
        footer: {
          text: "Creators Coliseu • Atendimento oficial",
        },
      },
    ],
    components: [
      {
        type: 1,
        components: [
          {
            type: 3,
            custom_id: CREATOR_TICKET_TYPE_SELECT_CUSTOM_ID,
            placeholder: "Selecione o tipo de atendimento",
            min_values: 1,
            max_values: 1,
            options: [
              {
                label: "📸 Atendimento Influencer",
                value: CREATOR_TICKET_INFLUENCER_VALUE,
                description: "Abrir sala para assuntos de influencer",
              },
              {
                label: "🎮 Atendimento Streamer",
                value: CREATOR_TICKET_STREAMER_VALUE,
                description: "Abrir sala para assuntos de streamer",
              },
            ],
          },
        ],
      },
    ],
  };
}

function buildTicketActionButtons() {
  return [
    {
      type: 1,
      components: [
        {
          type: 2,
          custom_id: CREATOR_TICKET_CLOSE_CUSTOM_ID,
          label: "Fechar ticket",
          style: 4,
        },
        {
          type: 2,
          custom_id: CREATOR_TICKET_STAFF_MENU_CUSTOM_ID,
          label: "Menu Staff",
          style: 2,
        },
        {
          type: 2,
          custom_id: CREATOR_TICKET_CLAIM_CUSTOM_ID,
          label: "Assumir ticket",
          style: 3,
        },
      ],
    },
  ];
}

export function buildCreatorTicketWelcomeMessage(input: {
  ticketType: CreatorTicketType;
  userId: string;
  staffRoleId: string;
}) {
  const userMention = `<@${input.userId}>`;
  const staffMention = `<@&${input.staffRoleId}>`;

  const description =
    input.ticketType === "streamer"
      ? [
          `Olá, ${userMention}!`,
          "",
          "Sua sala de atendimento para Streamer foi criada com sucesso.",
          "",
          "Para agilizar sua análise, envie abaixo:",
          "",
          "1. O link do canal onde você faz live",
          "2. Print das métricas recentes",
          "3. Plataforma utilizada, como Twitch, YouTube, TikTok, Kick ou outra",
          "4. Frequência de lives",
          "5. Qualquer observação que queira deixar para a equipe",
          "",
          `${staffMention}, um novo atendimento de streamer foi aberto.`,
          "",
          "Aguarde a equipe responsável responder.",
        ].join("\n")
      : [
          `Olá, ${userMention}!`,
          "",
          "Sua sala de atendimento para Influencer foi criada com sucesso.",
          "",
          "Para agilizar sua análise, envie abaixo:",
          "",
          "1. Link da sua rede principal",
          "2. Prints de postagens, stories, colabs ou métricas recentes",
          "3. Frequência de publicações",
          "4. Se já marcou o Coliseu RP na bio",
          "5. Qualquer observação que queira deixar para a equipe",
          "",
          `${staffMention}, um novo atendimento de influencer foi aberto.`,
          "",
          "Aguarde a equipe responsável responder.",
        ].join("\n");

  return {
    content: `${userMention} ${staffMention}`,
    allowedMentions: {
      users: [input.userId],
      roles: [input.staffRoleId],
    },
    embeds: [
      {
        title:
          input.ticketType === "streamer"
            ? "🎮 Atendimento Streamer — Creators Coliseu"
            : "📸 Atendimento Influencer — Creators Coliseu",
        description,
        color: CREATOR_TICKET_EMBED_COLOR,
        footer: {
          text: "Creators Coliseu • Atendimento oficial",
        },
      },
    ],
    components: buildTicketActionButtons(),
  };
}

export function buildCreatorTicketStaffMenuReply() {
  return {
    content: "Selecione uma ação da staff para este ticket.",
    components: [
      {
        type: 1,
        components: [
          {
            type: 3,
            custom_id: CREATOR_TICKET_STAFF_ACTION_SELECT_CUSTOM_ID,
            placeholder: "Selecione uma ação da staff",
            min_values: 1,
            max_values: 1,
            options: [
              {
                label: "Alterar nome do canal",
                value: CREATOR_TICKET_STAFF_RENAME_VALUE,
                description: "Renomear o ticket com segurança",
              },
              {
                label: "Notificar usuário no privado",
                value: CREATOR_TICKET_STAFF_NOTIFY_VALUE,
                description: "Enviar um aviso no privado do creator",
              },
            ],
          },
        ],
      },
    ],
  };
}

export function buildCreatorTicketCloseModal(ticketId: string) {
  return {
    custom_id: `${CREATOR_TICKET_CLOSE_MODAL_PREFIX}${ticketId}`,
    title: "Fechar ticket",
    components: [
      {
        type: 1,
        components: [
          {
            type: 4,
            custom_id: CREATOR_TICKET_CLOSE_REASON_INPUT_ID,
            label: "Motivo do fechamento",
            style: 2,
            placeholder: "Informe o motivo do fechamento do ticket.",
            required: true,
            max_length: 300,
          },
        ],
      },
    ],
  };
}

export function buildCreatorTicketRenameModal(ticketId: string) {
  return {
    custom_id: `${CREATOR_TICKET_RENAME_MODAL_PREFIX}${ticketId}`,
    title: "Alterar nome do ticket",
    components: [
      {
        type: 1,
        components: [
          {
            type: 4,
            custom_id: CREATOR_TICKET_RENAME_INPUT_ID,
            label: "Novo nome do canal",
            style: 1,
            placeholder: "Ex: ticket-streamer-snow-metricas",
            required: true,
            max_length: 90,
          },
        ],
      },
    ],
  };
}

export function buildCreatorTicketNotifyModal(ticketId: string) {
  return {
    custom_id: `${CREATOR_TICKET_NOTIFY_MODAL_PREFIX}${ticketId}`,
    title: "Notificar creator",
    components: [
      {
        type: 1,
        components: [
          {
            type: 4,
            custom_id: CREATOR_TICKET_NOTIFY_INPUT_ID,
            label: "Mensagem",
            style: 2,
            placeholder:
              "Digite uma mensagem personalizada ou deixe em branco para usar a mensagem padrão.",
            required: false,
            max_length: 600,
          },
        ],
      },
    ],
  };
}

export function parseTicketRecordIdFromCustomId(
  customId: string,
  prefix: string,
) {
  if (!customId.startsWith(prefix)) {
    return null;
  }

  const ticketId = customId.slice(prefix.length).trim();
  return ticketId.length > 0 ? ticketId : null;
}

export function buildExistingTicketMessage(channelId: string) {
  return `Você já possui uma sala aberta: <#${channelId}>`;
}

export function buildCreatedTicketMessage(
  ticketType: CreatorTicketType,
  channelId: string,
) {
  return `Sua sala de atendimento ${getCreatorTicketTypeLabel(ticketType)} foi criada: <#${channelId}>`;
}

export function buildLegacyTicketPanelMessage() {
  return "Este painel foi atualizado. Use o menu de seleção mais recente para escolher entre atendimento Influencer ou Streamer.";
}

export function buildTicketCreationErrorMessage() {
  return "Não foi possível criar sua sala no momento. Procure a equipe Creators Coliseu.";
}

export function buildClosingTicketMessage() {
  return "Este ticket será fechado em alguns segundos.";
}

export function canManageTicket(input: {
  openerDiscordUserId: string;
  actorDiscordUserId: string;
  actorRoleIds: string[];
  staffRoleIds: string[];
  actorIsAdministrator: boolean;
}) {
  return (
    input.actorIsAdministrator ||
    input.openerDiscordUserId === input.actorDiscordUserId ||
    input.actorRoleIds.some((roleId) => input.staffRoleIds.includes(roleId))
  );
}
