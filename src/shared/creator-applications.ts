import type {
  CreatorApplication,
  CreatorApplicationSource,
  CreatorApplicationStatus,
} from "../lib/types";
import { formatDate } from "../lib/utils";

export const CREATOR_APPLICATION_FORM_PANEL_TYPE = "creator_application_form_panel";
export const CREATOR_APPLICATION_START_CUSTOM_ID = "creator_application_start";
export const CREATOR_APPLICATION_MODAL_CUSTOM_ID = "creator_application_submit";
export const CREATOR_APPLICATION_REJECT_REASON_FIELD_ID = "rejection_reason";
export const CREATOR_APPLICATION_APPROVE_PREFIX = "creator_application_approve:";
export const CREATOR_APPLICATION_REJECT_PREFIX = "creator_application_reject:";
export const CREATOR_APPLICATION_REJECT_MODAL_PREFIX =
  "creator_application_reject_modal:";

const CREATOR_APPLICATION_EMBED_COLOR = 0xf5c542;
const CREATOR_APPLICATION_APPROVED_COLOR = 0x2e8b57;
const CREATOR_APPLICATION_REJECTED_COLOR = 0x8b1e1e;

function truncateFieldValue(value: string, maxLength = 1000) {
  const normalized = value.trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1)}…`;
}

function buildLinksSummary(application: CreatorApplication) {
  const links = [
    application.twitch_url,
    application.tiktok_url,
    application.youtube_url,
    application.instagram_url,
    application.content_links,
  ]
    .filter((value): value is string => Boolean(value?.trim()))
    .join("\n");

  return links || "Não informado.";
}

export function getCreatorApplicationStatusLabel(status: CreatorApplicationStatus) {
  switch (status) {
    case "approved":
      return "Aprovada";
    case "rejected":
      return "Negada";
    case "pending":
    default:
      return "Em análise";
  }
}

export function getCreatorApplicationSourceLabel(
  source: CreatorApplicationSource | null | undefined,
) {
  return source === "discord" ? "Discord" : "Site";
}

export function buildCreatorApplicationApprovedDm(
  name: string,
  ticketChannelId = "1447948746670477469",
) {
  return [
    "✅ Inscrição aprovada — Creators Coliseu",
    "",
    `Olá, ${name}!`,
    "",
    "Sua inscrição para o Programa Creators Coliseu foi aprovada.",
    "",
    `Agora você deve criar sua sala no canal <#${ticketChannelId}> para iniciar o processo e receber as orientações da equipe.`,
    "",
    "Bem-vindo à arena!",
    "",
    "Atenciosamente,",
    "Equipe Coliseu RP",
  ].join("\n");
}

export function buildCreatorApplicationRejectedDm(name: string, reason: string) {
  return [
    "❌ Inscrição não aprovada — Creators Coliseu",
    "",
    `Olá, ${name}.`,
    "",
    "Sua inscrição para o Programa Creators Coliseu foi analisada, mas não foi aprovada neste momento.",
    "",
    "Motivo:",
    reason,
    "",
    "Você poderá tentar novamente futuramente, seguindo os requisitos do programa.",
    "",
    "Atenciosamente,",
    "Equipe Coliseu RP",
  ].join("\n");
}

export function buildCreatorApplicationFormPanelPayload() {
  return {
    embeds: [
      {
        title: "🏛️ Formulário Creators Coliseu",
        description: [
          "Quer fazer parte do Programa Creators Coliseu?",
          "",
          "Clique no botão abaixo para preencher sua inscrição. A equipe irá analisar suas informações e responder assim que possível.",
        ].join("\n"),
        color: CREATOR_APPLICATION_EMBED_COLOR,
        fields: [
          {
            name: "📸 Influencer",
            value:
              "Para creators focados em Instagram, TikTok, Reels, stories, colabs e divulgação da cidade.",
            inline: false,
          },
          {
            name: "🎮 Streamer",
            value:
              "Para creators focados em lives, transmissões, métricas, ranques e conteúdo ao vivo.",
            inline: false,
          },
        ],
        footer: {
          text: "Creators Coliseu • Formulário oficial",
        },
      },
    ],
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            custom_id: CREATOR_APPLICATION_START_CUSTOM_ID,
            label: "Participar Creators",
            style: 1,
          },
        ],
      },
    ],
  };
}

export function buildCreatorApplicationReviewComponents(
  applicationId: string,
  disabled = false,
) {
  return [
    {
      type: 1,
      components: [
        {
          type: 2,
          custom_id: `${CREATOR_APPLICATION_APPROVE_PREFIX}${applicationId}`,
          label: "Aprovar",
          style: 3,
          disabled,
        },
        {
          type: 2,
          custom_id: `${CREATOR_APPLICATION_REJECT_PREFIX}${applicationId}`,
          label: "Negar",
          style: 4,
          disabled,
        },
      ],
    },
  ];
}

export function extractCreatorApplicationIdFromCustomId(
  customId: string,
  prefix: string,
) {
  return customId.startsWith(prefix) ? customId.slice(prefix.length) : null;
}

export function buildCreatorApplicationReviewPayload(input: {
  application: CreatorApplication;
  status?: CreatorApplicationStatus;
  reviewedByLabel?: string | null;
  rejectionReason?: string | null;
  disableActions?: boolean;
}) {
  const application = input.application;
  const status = input.status ?? application.status;
  const rejectionReason =
    input.rejectionReason ?? application.rejection_reason ?? null;
  const reviewedByLabel =
    input.reviewedByLabel ?? application.reviewed_by_name ?? null;

  const baseFields = [
    {
      name: "Usuário Discord",
      value: truncateFieldValue(application.discord_name || "Não informado."),
      inline: true,
    },
    {
      name: "Discord ID",
      value: truncateFieldValue(application.discord_id || "Não informado."),
      inline: true,
    },
    {
      name: "Origem",
      value: getCreatorApplicationSourceLabel(application.source),
      inline: true,
    },
    {
      name: "Nome na cidade",
      value: truncateFieldValue(application.city_name),
      inline: true,
    },
    {
      name: "Categoria",
      value: truncateFieldValue(application.category),
      inline: true,
    },
    {
      name: "Status",
      value: getCreatorApplicationStatusLabel(status),
      inline: true,
    },
    {
      name: "Redes/canal",
      value: truncateFieldValue(buildLinksSummary(application)),
      inline: false,
    },
    {
      name: "Frequência",
      value: truncateFieldValue(application.frequency),
      inline: false,
    },
    {
      name: "Motivo",
      value: truncateFieldValue(application.reason),
      inline: false,
    },
  ];

  if (application.observations) {
    baseFields.push({
      name: "Observações",
      value: truncateFieldValue(application.observations),
      inline: false,
    });
  }

  if (typeof application.age === "number") {
    baseFields.push({
      name: "Idade",
      value: String(application.age),
      inline: true,
    });
  }

  if (reviewedByLabel) {
    baseFields.push({
      name: "Analisado por",
      value: truncateFieldValue(reviewedByLabel),
      inline: true,
    });
  }

  if (application.reviewed_at) {
    baseFields.push({
      name: "Data da análise",
      value: formatDate(application.reviewed_at),
      inline: true,
    });
  }

  if (rejectionReason) {
    baseFields.push({
      name: "Motivo da negação",
      value: truncateFieldValue(rejectionReason),
      inline: false,
    });
  }

  const color =
    status === "approved"
      ? CREATOR_APPLICATION_APPROVED_COLOR
      : status === "rejected"
        ? CREATOR_APPLICATION_REJECTED_COLOR
        : CREATOR_APPLICATION_EMBED_COLOR;

  return {
    embeds: [
      {
        title: "📩 Nova inscrição — Creators Coliseu",
        color,
        fields: baseFields,
        footer: {
          text: `Enviado em ${formatDate(application.created_at)}`,
        },
      },
    ],
    components: buildCreatorApplicationReviewComponents(
      application.id,
      input.disableActions ?? status !== "pending",
    ),
  };
}
