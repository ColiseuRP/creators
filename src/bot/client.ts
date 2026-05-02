import { Client, GatewayIntentBits } from "discord.js";

export function createDiscordBotClient() {
  return new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  });
}
