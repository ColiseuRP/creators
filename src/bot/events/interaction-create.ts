import { CREATOR_TICKET_CLOSE_CUSTOM_ID, CREATOR_TICKET_CREATE_CUSTOM_ID } from "../../shared/discord-ticketing";
import type { BotContext } from "../types";
import { handleCreatorTicketClose } from "../interactions/creator-ticket-close";
import { handleCreatorTicketCreate } from "../interactions/creator-ticket-create";

export function registerInteractionCreateEvent(context: BotContext) {
  context.client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) {
      return;
    }

    if (interaction.customId === CREATOR_TICKET_CREATE_CUSTOM_ID) {
      await handleCreatorTicketCreate(context, interaction);
      return;
    }

    if (interaction.customId === CREATOR_TICKET_CLOSE_CUSTOM_ID) {
      await handleCreatorTicketClose(context, interaction);
    }
  });
}
