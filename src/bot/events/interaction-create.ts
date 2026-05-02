import {
  buildLegacyTicketPanelMessage,
  CREATOR_TICKET_CLOSE_CUSTOM_ID,
  CREATOR_TICKET_CREATE_CUSTOM_ID,
  CREATOR_TICKET_TYPE_SELECT_CUSTOM_ID,
} from "../../shared/discord-ticketing";
import { handleCreatorTicketClose } from "../interactions/creator-ticket-close";
import { handleCreatorTicketCreate } from "../interactions/creator-ticket-create";
import type { BotContext } from "../types";

export function registerInteractionCreateEvent(context: BotContext) {
  context.client.on("interactionCreate", async (interaction) => {
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === CREATOR_TICKET_TYPE_SELECT_CUSTOM_ID) {
        await handleCreatorTicketCreate(context, interaction);
      }

      return;
    }

    if (!interaction.isButton()) {
      return;
    }

    if (interaction.customId === CREATOR_TICKET_CREATE_CUSTOM_ID) {
      await interaction.reply({
        content: buildLegacyTicketPanelMessage(),
        ephemeral: true,
      });
      return;
    }

    if (interaction.customId === CREATOR_TICKET_CLOSE_CUSTOM_ID) {
      await handleCreatorTicketClose(context, interaction);
    }
  });
}
