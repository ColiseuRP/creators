import { z } from "zod";

const envSchema = z
  .object({
    NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
    DISCORD_BOT_TOKEN: z.string().min(1).optional(),
    DISCORD_GUILD_ID: z.string().min(1).optional(),
    DISCORD_CREATORS_CATEGORY_ID: z.string().min(1).optional(),
    DISCORD_GENERAL_CREATORS_CHANNEL_ID: z.string().min(1).optional(),
  })
  .passthrough();

const parsed = envSchema.safeParse(process.env);

const rawEnv = parsed.success ? parsed.data : {};

export const env = {
  NEXT_PUBLIC_SUPABASE_URL: rawEnv.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: rawEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: rawEnv.SUPABASE_SERVICE_ROLE_KEY,
  DISCORD_BOT_TOKEN: rawEnv.DISCORD_BOT_TOKEN,
  DISCORD_GUILD_ID: rawEnv.DISCORD_GUILD_ID,
  DISCORD_CREATORS_CATEGORY_ID: rawEnv.DISCORD_CREATORS_CATEGORY_ID,
  DISCORD_GENERAL_CREATORS_CHANNEL_ID: rawEnv.DISCORD_GENERAL_CREATORS_CHANNEL_ID,
};

export const SUPABASE_STORAGE_BUCKET = "metric-attachments";
export const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_ATTACHMENT_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
] as const;

export const isSupabaseConfigured = Boolean(
  env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export const isServiceRoleConfigured = Boolean(env.SUPABASE_SERVICE_ROLE_KEY);

export const isDiscordConfigured = Boolean(
  env.DISCORD_BOT_TOKEN &&
    env.DISCORD_GUILD_ID &&
    env.DISCORD_CREATORS_CATEGORY_ID &&
    env.DISCORD_GENERAL_CREATORS_CHANNEL_ID,
);

export const isMockMode = process.env.NODE_ENV !== "production" && !isSupabaseConfigured;

export function requireServerEnv(key: keyof typeof env) {
  const value = env[key];

  if (!value) {
    throw new Error(`A variável de ambiente ${key} não foi configurada.`);
  }

  return value;
}
