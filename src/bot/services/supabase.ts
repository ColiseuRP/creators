import { createClient } from "@supabase/supabase-js";

import type { BotConfig } from "../types";

export function createBotSupabaseClient(config: BotConfig) {
  if (!config.supabaseUrl || !config.serviceRoleKey) {
    return null;
  }

  return createClient(config.supabaseUrl, config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
