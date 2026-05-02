export function logBotInfo(message: string) {
  console.log(`[discord-bot] ${message}`);
}

export function logBotWarn(message: string) {
  console.warn(`[discord-bot] ${message}`);
}

export function logBotError(message: string, error?: unknown) {
  console.error(`[discord-bot] ${message}`, error ?? "");
}
