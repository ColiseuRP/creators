export type AppRole = "admin_general" | "responsavel_creators" | "creator";

export type CreatorStatus = "active" | "pending" | "paused";
export type MetricStatus = "pending" | "approved" | "rejected";
export type NoticeType = "info" | "success" | "warning";
export type NoticeTargetType = "individual" | "general" | "category";
export type DiscordLogStatus = "pending" | "sent" | "failed" | "skipped";
export type CreatorTicketType = "streamer" | "influencer";
export type CreatorTicketStatus = "open" | "closed" | "archived";
export type CreatorApplicationSource = "site" | "discord";
export type CreatorApplicationStatus = "pending" | "approved" | "rejected";
export type DiscordPanelType =
  | "creator_ticket_panel"
  | "creator_application_form_panel";

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  email?: string | null;
  discord_name: string | null;
  discord_id: string | null;
  role: AppRole;
  created_at: string;
}

export interface CreatorRoom {
  id: string;
  creator_id: string;
  slug: string;
  title: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Creator {
  id: string;
  profile_id: string;
  name: string;
  city_name: string;
  category: string;
  status: CreatorStatus;
  avatar_url: string | null;
  bio: string | null;
  discord_channel_id: string | null;
  joined_at: string;
  created_at: string;
  profile?: Profile | null;
  room?: CreatorRoom | null;
}

export interface CreatorApplication {
  id: string;
  name: string;
  discord_name: string;
  discord_id: string;
  city_name: string;
  age: number | null;
  category: string;
  twitch_url: string | null;
  tiktok_url: string | null;
  youtube_url: string | null;
  instagram_url: string | null;
  frequency: string;
  reason: string;
  content_links: string | null;
  observations: string | null;
  status: CreatorApplicationStatus;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  reviewed_by_text?: string | null;
  reviewed_by_name?: string | null;
  rejection_reason?: string | null;
  source?: CreatorApplicationSource | null;
  review_channel_id?: string | null;
  review_message_id?: string | null;
}

export interface MetricAttachment {
  id: string;
  metric_submission_id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  uploaded_at: string;
  signed_url?: string | null;
}

export interface MetricReview {
  id: string;
  metric_submission_id: string;
  reviewed_by: string;
  decision: "approved" | "rejected";
  reason: string | null;
  created_at: string;
}

export interface MetricSubmission {
  id: string;
  creator_id: string;
  platform: string;
  content_type: string;
  content_url: string;
  content_date: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  average_viewers: number | null;
  live_duration: number | null;
  status: MetricStatus;
  creator_observation: string | null;
  admin_observation: string | null;
  rejection_reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  attachments?: MetricAttachment[];
  review?: MetricReview | null;
  creator?: Creator | null;
}

export interface CreatorNotice {
  id: string;
  title: string;
  message: string;
  type: NoticeType;
  target_type: NoticeTargetType;
  target_creator_id: string | null;
  target_category: string | null;
  sent_by: string | null;
  send_to_discord: boolean;
  sent_at: string;
  discord_status?: DiscordLogStatus | null;
  discord_channel_id?: string | null;
  discord_error_message?: string | null;
  discord_last_attempt_at?: string | null;
  discord_sent_at?: string | null;
  latest_discord_log?: DiscordMessageLog | null;
}

export interface DiscordSettings {
  id: string;
  guild_id: string;
  creators_category_id: string;
  general_creators_channel_id: string;
  auto_send_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface DiscordMessageLog {
  id: string;
  notice_id?: string | null;
  target_type: NoticeTargetType | "metric_review";
  target_creator_id: string | null;
  channel_id: string | null;
  message_type: string;
  status: DiscordLogStatus;
  error_message: string | null;
  sent_at: string;
  attempted_at?: string | null;
  delivered_at?: string | null;
}

export interface CreatorTicket {
  id: string;
  discord_user_id: string;
  discord_username: string;
  channel_id: string;
  ticket_type: CreatorTicketType | null;
  status: CreatorTicketStatus;
  created_at: string;
  claimed_by: string | null;
  claimed_by_name: string | null;
  claimed_at: string | null;
  closed_at: string | null;
  closed_by: string | null;
  close_reason: string | null;
}

export interface DiscordPanel {
  id: string;
  type: DiscordPanelType;
  channel_id: string;
  message_id: string;
  created_at: string;
  updated_at: string;
}

export interface DiscordBotLog {
  id: string;
  type: string;
  discord_user_id: string | null;
  discord_username: string | null;
  channel_id: string | null;
  ticket_id?: string | null;
  ticket_type: CreatorTicketType | null;
  application_id?: string | null;
  action_by?: string | null;
  status: "success" | "failed" | "info";
  message: string;
  error_message: string | null;
  created_at: string;
}

export interface DiscordTicketSnapshot {
  openCount: number;
  closedCount: number;
  archivedCount: number;
  totalCount: number;
  recentTickets: CreatorTicket[];
  panel: DiscordPanel | null;
  errorMessage?: string | null;
}

export interface SessionUser {
  id: string;
  email: string | null;
}

export interface SessionContext {
  user: SessionUser | null;
  profile: Profile | null;
  creator: Creator | null;
  role: AppRole | null;
  mockMode: boolean;
  isAdmin: boolean;
  canManageCreators: boolean;
}

export interface DashboardSnapshot {
  creatorsCount: number;
  pendingMetricsCount: number;
  approvedMetricsCount: number;
  rejectedMetricsCount: number;
  pendingApplicationsCount: number;
  noticesCount: number;
  recentMetrics: MetricSubmission[];
  recentNotices: CreatorNotice[];
  recentLogs: DiscordMessageLog[];
  creators: Creator[];
}

export interface UploadedAttachmentInput {
  storagePath: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}
