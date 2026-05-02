import { GuildMember, PermissionFlagsBits } from "discord.js";

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
import { setupTicketsCommand } from "../commands/setup-tickets";
import { handleCreatorTicketClose } from "../interactions/creator-ticket-close";
import { handleCreatorTicketCreate } from "../interactions/creator-ticket-create";
import { publishCreatorTicketPanelFromBot } from "../services/panel-publisher";
import type { BotContext } from "../types";

function canRunSetupCommand(context: BotContext, member: unknown) {
  if (!(member instanceof GuildMember)) {
    return false;
  }

  return (
    member.permissions.has(PermissionFlagsBits.Administrator) ||
    member.roles.cache.some((role) => context.config.staffRoleIds.includes(role.id))
  );
}

export function registerInteractionCreateEvent(context: BotContext) {
  context.client.on("interactionCreate", async (interaction) => {
    if (interaction.isChatInputCommand()) {
      if (!canRunSetupCommand(context, interaction.member)) {
        await interaction.reply({
          content: "Você não tem permissão para usar este comando.",
          ephemeral: true,
        });
        return;
      }

      if (interaction.commandName === setupTicketsCommand.name) {
        const result = await publishCreatorTicketPanelFromBot(context);
        await interaction.reply({
          content:
            result.success
              ? result.message
              : `${result.message} ${result.errorMessage ?? ""}`.trim(),
          ephemeral: true,
        });
      }

      return;
    }

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
