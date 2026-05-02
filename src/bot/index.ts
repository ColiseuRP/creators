import "./env";

import process from "node:process";

import { createDiscordBotClient } from "./client";
import { registerBotEvents } from "./events";
import { loadBotConfig } from "./services/config";
import { logBotError } from "./services/logger";
import { createBotSupabaseClient } from "./services/supabase";
import type { BotContext } from "./types";

function bootstrap() {
  const config = loadBotConfig();
  const client = createDiscordBotClient();
  const supabase = createBotSupabaseClient(config);

  const context: BotContext = {
    client,
    config,
    supabase,
  };

  registerBotEvents(context);

  process.on("unhandledRejection", (error) => {
    logBotError("Rejeição não tratada no processo do bot.", error);
  });

  process.on("uncaughtException", (error) => {
    logBotError("Exceção não tratada no processo do bot.", error);
  });

  client.login(config.token).catch((error) => {
    logBotError("Não foi possível iniciar o bot.", error);
    process.exitCode = 1;
  });
}

try {
  bootstrap();
} catch (error) {
  logBotError(
    error instanceof Error
      ? error.message
      : "Não foi possível inicializar o bot do Creators Coliseu.",
    error,
  );
  process.exitCode = 1;
}
