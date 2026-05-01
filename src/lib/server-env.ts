import "server-only";

import fs from "node:fs";
import path from "node:path";

const SERVER_ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DISCORD_BOT_TOKEN",
  "DISCORD_GUILD_ID",
  "DISCORD_CREATORS_CATEGORY_ID",
  "DISCORD_GENERAL_CREATORS_CHANNEL_ID",
  "DISCORD_RULES_CHANNEL_ID",
  "DISCORD_INFLUENCER_REQUIREMENTS_CHANNEL_ID",
  "DISCORD_STREAMER_REQUIREMENTS_CHANNEL_ID",
  "DISCORD_TICKET_CHANNEL_ID",
  "DISCORD_PUNISHMENTS_CHANNEL_ID",
  "DISCORD_NOTICES_CHANNEL_ID",
  "DISCORD_LOGOS_CHANNEL_ID",
] as const;

type ServerEnvKey = (typeof SERVER_ENV_KEYS)[number];

let cachedFileEnv: Partial<Record<ServerEnvKey, string>> | null = null;

function parseEnvFile(filePath: string) {
  const values: Partial<Record<ServerEnvKey, string>> = {};

  if (!fs.existsSync(filePath)) {
    return values;
  }

  const content = fs.readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex < 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim() as ServerEnvKey;
    const value = line.slice(separatorIndex + 1).trim();

    if (SERVER_ENV_KEYS.includes(key) && value) {
      values[key] = value;
    }
  }

  return values;
}

function getFileEnv() {
  if (cachedFileEnv) {
    return cachedFileEnv;
  }

  const workspaceRoot = process.cwd();
  const baseEnv = parseEnvFile(path.join(workspaceRoot, ".env"));
  const localEnv = parseEnvFile(path.join(workspaceRoot, ".env.local"));

  cachedFileEnv = {
    ...baseEnv,
    ...localEnv,
  };

  return cachedFileEnv;
}

export function getServerEnvValue(key: ServerEnvKey) {
  const runtimeValue = process.env[key]?.trim();

  if (runtimeValue) {
    return runtimeValue;
  }

  return getFileEnv()[key] ?? null;
}

export function isServerSupabaseConfigured() {
  return Boolean(
    getServerEnvValue("NEXT_PUBLIC_SUPABASE_URL") &&
      getServerEnvValue("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
}

export function isServerServiceRoleConfigured() {
  return Boolean(getServerEnvValue("SUPABASE_SERVICE_ROLE_KEY"));
}
