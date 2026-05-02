import type { SupabaseClient } from "@supabase/supabase-js";
import type { Client } from "discord.js";

export interface BotConfig {
  token: string;
  guildId: string;
  citizenRoleId: string;
  approvedCreatorRoleId: string;
  ticketChannelId: string;
  creatorFormChannelId: string;
  creatorFormSubmissionsChannelId: string;
  creatorsCategoryId: string;
  noticesChannelId: string;
  generalCreatorsChannelId: string;
  responsavelStaffRoleId: string;
  responsavelCreatorsRoleId: string | null;
  staffRoleIds: string[];
  archivedTicketsCategoryId: string | null;
  supabaseUrl: string | null;
  serviceRoleKey: string | null;
}

export interface BotContext {
  client: Client;
  config: BotConfig;
  supabase: SupabaseClient | null;
}
