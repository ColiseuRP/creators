export const CREATOR_TICKET_PANEL_TYPE = "creator_ticket_panel";
export const CREATOR_TICKET_CREATE_CUSTOM_ID = "creator_ticket_create";
export const CREATOR_TICKET_CLOSE_CUSTOM_ID = "creator_ticket_close";
export const CREATOR_TICKET_CLOSE_DELAY_MS = 5_000;
export const CREATOR_TICKET_CHANNEL_PREFIX = "ticket-creator";

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

export function buildCreatorTicketChannelName(username: string) {
  return `${CREATOR_TICKET_CHANNEL_PREFIX}-${sanitizeTicketChannelSegment(username)}`.slice(
    0,
    90,
  );
}

export function buildTicketPanelPayload() {
  return {
    content: [
      "🎫 **Atendimento Creators Coliseu**",
      "",
      "Precisa falar com a equipe de creators? Clique no botão abaixo para criar sua sala privada de atendimento.",
    ].join("\n"),
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            custom_id: CREATOR_TICKET_CREATE_CUSTOM_ID,
            label: "Criar sala creator",
            style: 1,
          },
        ],
      },
    ],
  };
}

export function buildCreatorTicketWelcomeMessage(userMention: string) {
  return {
    content: [
      `👋 Olá, ${userMention}!`,
      "",
      "Sua sala de atendimento dos Creators Coliseu foi criada.",
      "",
      "Explique abaixo o que você precisa e aguarde um responsável da equipe.",
      "",
      "Equipe com acesso: Staff Creators Coliseu",
    ].join("\n"),
    components: [
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
    ],
  };
}

export function buildExistingTicketMessage(channelId: string) {
  return `Você já possui uma sala aberta: <#${channelId}>`;
}

export function buildCreatedTicketMessage(channelId: string) {
  return `Sua sala foi criada com sucesso: <#${channelId}>`;
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
