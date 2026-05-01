import type {
  AppRole,
  Creator,
  CreatorApplication,
  CreatorNotice,
  CreatorRoom,
  DiscordMessageLog,
  DiscordSettings,
  MetricAttachment,
  MetricReview,
  MetricSubmission,
  Profile,
  SessionContext,
} from "@/lib/types";

export const DEMO_ROLE_COOKIE = "creators-demo-role";

const profiles: Profile[] = [
  {
    id: "profile-admin",
    user_id: "user-admin",
    name: "Marina Costa",
    discord_name: "marina.admin",
    discord_id: "111111111111111111",
    role: "admin_general",
    created_at: "2026-04-01T10:00:00.000Z",
  },
  {
    id: "profile-manager",
    user_id: "user-manager",
    name: "Diego Nunes",
    discord_name: "diego.creators",
    discord_id: "222222222222222222",
    role: "responsavel_creators",
    created_at: "2026-04-02T10:00:00.000Z",
  },
  {
    id: "profile-creator",
    user_id: "user-creator",
    name: "Luna Freitas",
    discord_name: "luna.live",
    discord_id: "333333333333333333",
    role: "creator",
    created_at: "2026-04-03T10:00:00.000Z",
  },
];

const rooms: CreatorRoom[] = [
  {
    id: "room-1",
    creator_id: "creator-1",
    slug: "luna-freitas",
    title: "Sala da Luna",
    description:
      "Espaço individual para métricas, histórico de reviews e avisos internos.",
    is_active: true,
    created_at: "2026-04-08T12:00:00.000Z",
    updated_at: "2026-04-29T13:00:00.000Z",
  },
  {
    id: "room-2",
    creator_id: "creator-2",
    slug: "kai-mendes",
    title: "Sala do Kai",
    description: "Canal do creator focado em shorts e campanhas regionais.",
    is_active: true,
    created_at: "2026-04-09T12:00:00.000Z",
    updated_at: "2026-04-28T09:00:00.000Z",
  },
];

const creatorsBase: Creator[] = [
  {
    id: "creator-1",
    profile_id: "profile-creator",
    name: "Luna Freitas",
    city_name: "Campinas",
    category: "FPS",
    status: "active",
    avatar_url: null,
    bio: "Streams de FPS com foco em comunidade e campeonatos semanais.",
    discord_channel_id: "987654321000000001",
    joined_at: "2026-03-10T18:00:00.000Z",
    created_at: "2026-03-10T18:00:00.000Z",
  },
  {
    id: "creator-2",
    profile_id: "profile-manager",
    name: "Kai Mendes",
    city_name: "Santos",
    category: "Variedades",
    status: "active",
    avatar_url: null,
    bio: "Conteúdo curto, desafios e vídeos semanais de comunidade.",
    discord_channel_id: "987654321000000002",
    joined_at: "2026-02-11T18:00:00.000Z",
    created_at: "2026-02-11T18:00:00.000Z",
  },
];

const attachments: MetricAttachment[] = [
  {
    id: "attachment-1",
    metric_submission_id: "metric-1",
    file_url: "mock/creator-1/luna-dashboard.webp",
    file_name: "luna-dashboard.webp",
    file_type: "image/webp",
    uploaded_at: "2026-04-29T11:20:00.000Z",
  },
];

const reviews: MetricReview[] = [
  {
    id: "review-1",
    metric_submission_id: "metric-2",
    reviewed_by: "profile-manager",
    decision: "approved",
    reason: "Entrega dentro do esperado e com excelente retenção.",
    created_at: "2026-04-27T17:00:00.000Z",
  },
  {
    id: "review-2",
    metric_submission_id: "metric-3",
    reviewed_by: "profile-admin",
    decision: "rejected",
    reason: "Faltou anexar o print do painel e a URL estava privada.",
    created_at: "2026-04-26T16:15:00.000Z",
  },
];

const metricSubmissionsBase: MetricSubmission[] = [
  {
    id: "metric-1",
    creator_id: "creator-1",
    platform: "Twitch",
    content_type: "Live",
    content_url: "https://twitch.tv/luna/live/123",
    content_date: "2026-04-29",
    views: 18420,
    likes: 0,
    comments: 320,
    shares: 44,
    average_viewers: 286,
    live_duration: 4.5,
    status: "pending",
    creator_observation: "Live especial de campeonato com pico de audiência no segundo mapa.",
    admin_observation: null,
    rejection_reason: null,
    submitted_at: "2026-04-29T11:25:00.000Z",
    reviewed_at: null,
    reviewed_by: null,
  },
  {
    id: "metric-2",
    creator_id: "creator-2",
    platform: "TikTok",
    content_type: "Short",
    content_url: "https://tiktok.com/@kai/video/123",
    content_date: "2026-04-26",
    views: 92800,
    likes: 14500,
    comments: 820,
    shares: 1060,
    average_viewers: null,
    live_duration: null,
    status: "approved",
    creator_observation: "Trend adaptada para a campanha regional.",
    admin_observation: "Mantido no mural de destaques da semana.",
    rejection_reason: null,
    submitted_at: "2026-04-26T13:00:00.000Z",
    reviewed_at: "2026-04-27T17:00:00.000Z",
    reviewed_by: "profile-manager",
  },
  {
    id: "metric-3",
    creator_id: "creator-1",
    platform: "YouTube",
    content_type: "Vídeo",
    content_url: "https://youtube.com/watch?v=abc123",
    content_date: "2026-04-24",
    views: 3400,
    likes: 410,
    comments: 52,
    shares: 18,
    average_viewers: null,
    live_duration: null,
    status: "rejected",
    creator_observation: "Primeiro teste do novo formato semanal.",
    admin_observation: "Reenviar com evidência completa do analytics.",
    rejection_reason: "Print não anexado e data divergente do período atual.",
    submitted_at: "2026-04-24T15:05:00.000Z",
    reviewed_at: "2026-04-26T16:15:00.000Z",
    reviewed_by: "profile-admin",
  },
];

const noticesBase: CreatorNotice[] = [
  {
    id: "notice-1",
    title: "Revisao concluida",
    message: "Sua ultima metrica foi aprovada e ja segue para o fechamento semanal.",
    type: "success",
    target_type: "individual",
    target_creator_id: "creator-1",
    target_category: null,
    sent_by: "profile-manager",
    send_to_discord: true,
    sent_at: "2026-04-27T17:03:00.000Z",
    discord_status: "sent",
    discord_channel_id: "987654321000000001",
    discord_error_message: null,
    discord_last_attempt_at: "2026-04-27T17:02:30.000Z",
    discord_sent_at: "2026-04-27T17:02:31.000Z",
  },
  {
    id: "notice-2",
    title: "Checklist de abril",
    message:
      "Todos os creators devem anexar **print do analytics** com data visivel.\n\n*Streamer* e **Influencer** precisam revisar esse ponto.",
    type: "warning",
    target_type: "general",
    target_creator_id: null,
    target_category: null,
    sent_by: "profile-admin",
    send_to_discord: true,
    sent_at: "2026-04-25T11:00:00.000Z",
    discord_status: "failed",
    discord_channel_id: "123456789000000003",
    discord_error_message: "Discord: Missing Access / codigo 50001.",
    discord_last_attempt_at: "2026-04-25T11:00:10.000Z",
    discord_sent_at: null,
  },
];

const applicationsBase: CreatorApplication[] = [
  {
    id: "application-1",
    name: "Bruna Lima",
    discord_name: "bruplays",
    discord_id: "444444444444444444",
    city_name: "Curitiba",
    age: 21,
    category: "MOBA",
    twitch_url: "https://twitch.tv/bruplays",
    tiktok_url: null,
    youtube_url: "https://youtube.com/@bruplays",
    instagram_url: "https://instagram.com/bruplays",
    frequency: "5x por semana",
    reason: "Quero ampliar alcance em campeonatos locais.",
    content_links: "https://clip.exemplo/1, https://clip.exemplo/2",
    observations: "Já participa de scrims da comunidade.",
    status: "pending",
    created_at: "2026-04-28T14:00:00.000Z",
    reviewed_at: null,
    reviewed_by: null,
  },
  {
    id: "application-2",
    name: "Pedro Rocha",
    discord_name: "pedroshorts",
    discord_id: "555555555555555555",
    city_name: "Recife",
    age: 19,
    category: "Variedades",
    twitch_url: null,
    tiktok_url: "https://tiktok.com/@pedroshorts",
    youtube_url: null,
    instagram_url: "https://instagram.com/pedroshorts",
    frequency: "Postagens diárias",
    reason: "Quero contribuir nas campanhas do time.",
    content_links: "https://tiktok.com/@pedroshorts/video/001",
    observations: null,
    status: "approved",
    created_at: "2026-04-20T14:00:00.000Z",
    reviewed_at: "2026-04-22T09:00:00.000Z",
    reviewed_by: "profile-manager",
  },
];

const discordSettings: DiscordSettings = {
  id: "discord-settings-1",
  guild_id: "123456789000000001",
  creators_category_id: "123456789000000002",
  general_creators_channel_id: "123456789000000003",
  auto_send_enabled: true,
  created_at: "2026-04-01T09:00:00.000Z",
  updated_at: "2026-04-29T09:30:00.000Z",
};

const discordLogsBase: DiscordMessageLog[] = [
  {
    id: "log-1",
    notice_id: "notice-1",
    target_type: "individual",
    target_creator_id: "creator-1",
    channel_id: "987654321000000001",
    message_type: "notice_individual",
    status: "sent",
    error_message: null,
    sent_at: "2026-04-27T17:02:30.000Z",
    attempted_at: "2026-04-27T17:02:30.000Z",
    delivered_at: "2026-04-27T17:02:31.000Z",
  },
  {
    id: "log-2",
    notice_id: "notice-2",
    target_type: "general",
    target_creator_id: null,
    channel_id: "123456789000000003",
    message_type: "notice_general",
    status: "failed",
    error_message: "Discord: Missing Access / codigo 50001.",
    sent_at: "2026-04-25T11:00:10.000Z",
    attempted_at: "2026-04-25T11:00:10.000Z",
    delivered_at: null,
  },
  {
    id: "log-3",
    notice_id: null,
    target_type: "metric_review",
    target_creator_id: "creator-1",
    channel_id: "987654321000000001",
    message_type: "metric_rejected",
    status: "failed",
    error_message: "Discord: Missing access to channel 987654321000000001.",
    sent_at: "2026-04-26T16:16:00.000Z",
    attempted_at: "2026-04-26T16:16:00.000Z",
    delivered_at: null,
  },
];

export function getMockData() {
  const creators = creatorsBase.map((creator) => ({
    ...creator,
    profile: profiles.find((profile) => profile.id === creator.profile_id) ?? null,
    room: rooms.find((room) => room.creator_id === creator.id) ?? null,
  }));

  const metricSubmissions = metricSubmissionsBase.map((metric) => ({
    ...metric,
    creator: creators.find((creator) => creator.id === metric.creator_id) ?? null,
    attachments: attachments.filter(
      (attachment) => attachment.metric_submission_id === metric.id,
    ),
    review: reviews.find((review) => review.metric_submission_id === metric.id) ?? null,
  }));

  return {
    profiles,
    creators,
    rooms,
    metricSubmissions,
    notices: noticesBase,
    applications: applicationsBase,
    discordSettings,
    discordLogs: discordLogsBase,
  };
}

function getProfileForRole(role: AppRole) {
  return profiles.find((profile) => profile.role === role) ?? null;
}

export function getMockSession(role: AppRole | null): SessionContext {
  if (!role) {
    return {
      user: null,
      profile: null,
      creator: null,
      role: null,
      mockMode: true,
      isAdmin: false,
      canManageCreators: false,
    };
  }

  const data = getMockData();
  const profile = getProfileForRole(role);
  const creator =
    profile?.role === "creator"
      ? data.creators.find((item) => item.profile_id === profile.id) ?? null
      : null;

  return {
    user: profile
      ? {
          id: profile.user_id,
          email: `${profile.role.replace(/_/g, ".")}@demo.local`,
        }
      : null,
    profile,
    creator,
    role: profile?.role ?? null,
    mockMode: true,
    isAdmin: profile?.role === "admin_general",
    canManageCreators:
      profile?.role === "admin_general" || profile?.role === "responsavel_creators",
  };
}
