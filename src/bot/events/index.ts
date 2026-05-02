import type { BotContext } from "../types";
import { registerGuildMemberAddEvent } from "./guild-member-add";
import { registerInteractionCreateEvent } from "./interaction-create";
import { registerReadyEvent } from "./ready";

export function registerBotEvents(context: BotContext) {
  registerReadyEvent(context);
  registerGuildMemberAddEvent(context);
  registerInteractionCreateEvent(context);
}
