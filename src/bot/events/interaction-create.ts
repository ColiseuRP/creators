import {
  buildLegacyTicketPanelMessage,
  CREATOR_TICKET_CLOSE_CUSTOM_ID,
  CREATOR_TICKET_CREATE_CUSTOM_ID,
  CREATOR_TICKET_TYPE_SELECT_CUSTOM_ID,
} from "../../shared/discord-ticketing";
import {
  CREATOR_APPLICATION_MODAL_CUSTOM_ID,
  CREATOR_APPLICATION_START_CUSTOM_ID,
} from "../../shared/creator-applications";
import {
  handleCreatorApplicationApprove,
  handleCreatorApplicationRejectButton,
  handleCreatorApplicationRejectSubmit,
  handleCreatorApplicationStart,
  handleCreatorApplicationSubmit,
  resolveCreatorApplicationApproveId,
  resolveCreatorApplicationRejectId,
  resolveCreatorApplicationRejectModalId,
} from "../interactions/creator-application";
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

    if (interaction.isModalSubmit()) {
      if (interaction.customId === CREATOR_APPLICATION_MODAL_CUSTOM_ID) {
        await handleCreatorApplicationSubmit(context, interaction);
        return;
      }

      const rejectModalId = resolveCreatorApplicationRejectModalId(interaction.customId);

      if (rejectModalId) {
        await handleCreatorApplicationRejectSubmit(context, interaction, rejectModalId);
      }

      return;
    }

    if (!interaction.isButton()) {
      return;
    }

    if (interaction.customId === CREATOR_APPLICATION_START_CUSTOM_ID) {
      await handleCreatorApplicationStart(context, interaction);
      return;
    }

    const approveApplicationId = resolveCreatorApplicationApproveId(interaction.customId);

    if (approveApplicationId) {
      await handleCreatorApplicationApprove(context, interaction, approveApplicationId);
      return;
    }

    const rejectApplicationId = resolveCreatorApplicationRejectId(interaction.customId);

    if (rejectApplicationId) {
      await handleCreatorApplicationRejectButton(context, interaction, rejectApplicationId);
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
