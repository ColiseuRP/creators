import type { CreatorTicketType } from "../lib/types";

export const CREATOR_TICKET_PANEL_TYPE = "creator_ticket_panel";
export const CREATOR_TICKET_CREATE_CUSTOM_ID = "creator_ticket_create";
export const CREATOR_TICKET_TYPE_SELECT_CUSTOM_ID = "creator_ticket_type_select";
export const CREATOR_TICKET_STREAMER_VALUE = "creator_ticket_streamer";
export const CREATOR_TICKET_INFLUENCER_VALUE = "creator_ticket_influencer";
export const CREATOR_TICKET_CLOSE_CUSTOM_ID = "creator_ticket_close";
export const CREATOR_TICKET_CLOSE_DELAY_MS = 5_000;
export const SETUP_TICKETS_COMMAND_NAME = "setup-tickets";

const CREATOR_TICKET_EMBED_COLOR = 0xf5c542;

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

  return (normalized || "creator").slice(0, 40);
}

export function parseCreatorTicketTypeValue(
  value: string | null | undefined,
): CreatorTicketType | null {
  switch (value) {
    case CREATOR_TICKET_STREAMER_VALUE:
      return "streamer";
    case CREATOR_TICKET_INFLUENCER_VALUE:
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

export function buildCreatorTicketChannelName(
  ticketType: CreatorTicketType,
  username: string,
) {
  const prefix = ticketType === "streamer" ? "ticket-streamer" : "ticket-influencer";
  return `${prefix}-${sanitizeTicketChannelSegment(username)}`.slice(0, 90);
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

function buildTicketCloseButtonComponent() {
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
          "1. Link do seu Instagram, TikTok ou rede principal",
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
    components: buildTicketCloseButtonComponent(),
  };
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
