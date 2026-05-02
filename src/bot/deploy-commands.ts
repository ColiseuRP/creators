import "./env";

import process from "node:process";

import { REST, Routes } from "discord.js";

import { botCommands } from "./commands";

function getRequiredEnvValue(key: "DISCORD_BOT_TOKEN" | "DISCORD_GUILD_ID") {
  const value = process.env[key]?.trim();

  if (!value) {
    throw new Error(`Variável obrigatória ausente para publicar comandos: ${key}`);
  }

  return value;
}

async function deployCommands() {
  const token = getRequiredEnvValue("DISCORD_BOT_TOKEN");
  const guildId = getRequiredEnvValue("DISCORD_GUILD_ID");
  const rest = new REST({ version: "10" }).setToken(token);

  const currentApplication = (await rest.get(Routes.currentApplication())) as {
    id: string;
  };

  await rest.put(
    Routes.applicationGuildCommands(currentApplication.id, guildId),
    {
      body: botCommands,
    },
  );

  console.log(
    `[discord-bot] Slash commands publicados com sucesso: ${botCommands
      .map((command) => command.name)
      .join(", ")}`,
  );
}

deployCommands().catch((error) => {
  console.error("[discord-bot] Não foi possível publicar os slash commands.", error);
  process.exitCode = 1;
});
