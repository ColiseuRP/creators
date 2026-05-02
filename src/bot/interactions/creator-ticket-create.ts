import { ChannelType, GuildMember, type ButtonInteraction } from "discord.js";

import {
  createCreatorTicketRecord,
  findOpenCreatorTicketByDiscordUser,
} from "../../shared/discord-ticket-store";
import {
  buildCreatedTicketMessage,
  buildCreatorTicketChannelName,
  buildCreatorTicketWelcomeMessage,
  buildExistingTicketMessage,
  buildTicketCreationErrorMessage,
} from "../../shared/discord-ticketing";
import { dispatchBotLog } from "../services/log-dispatcher";
import { logBotError, logBotInfo } from "../services/logger";
import type { BotContext } from "../types";
import { buildCreatorTicketOverwrites } from "../utils/build-ticket-overwrites";

function isGuildMember(member: GuildMember | ButtonInteraction["member"]): member is GuildMember {
  return member instanceof GuildMember;
}

export async function handleCreatorTicketCreate(
  context: BotContext,
  interaction: ButtonInteraction,
) {
  if (!interaction.inCachedGuild()) {
    await interaction.reply({
      content: buildTicketCreationErrorMessage(),
      ephemeral: true,
    });
    return;
  }

  if (interaction.guild.id !== context.config.guildId) {
    await interaction.reply({
      content: "Este botão não está vinculado ao servidor configurado.",
      ephemeral: true,
    });
    return;
  }

  try {
    const existingTicket = await findOpenCreatorTicketByDiscordUser(
      context.supabase,
      interaction.user.id,
    );

    if (existingTicket) {
      const duplicateMessage = buildExistingTicketMessage(existingTicket.channel_id);

      await dispatchBotLog(context, {
        type: "ticket_duplicate_blocked",
        discordUserId: interaction.user.id,
        channelId: existingTicket.channel_id,
        status: "info",
        message: `Tentativa de ticket duplicado bloqueada para ${interaction.user.tag}.`,
      });

      await interaction.reply({
        content: duplicateMessage,
        ephemeral: true,
      });
      return;
    }

    const botUserId = interaction.client.user?.id;

    if (!botUserId) {
      throw new Error("O identificador do bot não está disponível.");
    }

    const member = interaction.member;
    const displayName = isGuildMember(member) ? member.displayName : interaction.user.username;
    const channelName = buildCreatorTicketChannelName(displayName);

    const channel = await interaction.guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: context.config.creatorsCategoryId,
      topic: `Atendimento Creators Coliseu | ${interaction.user.id}`,
      permissionOverwrites: buildCreatorTicketOverwrites({
        guildId: interaction.guild.id,
        requesterId: interaction.user.id,
        botUserId,
        staffRoleIds: context.config.staffRoleIds,
      }),
    });

    await channel.send(buildCreatorTicketWelcomeMessage(`<@${interaction.user.id}>`));

    try {
      await createCreatorTicketRecord(context.supabase, {
        discordUserId: interaction.user.id,
        discordUsername: interaction.user.tag,
        channelId: channel.id,
      });
    } catch (error) {
      const fallbackTicket = await findOpenCreatorTicketByDiscordUser(
        context.supabase,
        interaction.user.id,
      );

      if (fallbackTicket) {
        await channel.delete("Ticket duplicado evitado após criação concorrente.");
        await interaction.reply({
          content: buildExistingTicketMessage(fallbackTicket.channel_id),
          ephemeral: true,
        });
        return;
      }

      await channel.delete("Falha ao registrar o ticket internamente.");
      throw error;
    }

    const successMessage = `Ticket criado para ${interaction.user.tag}.`;
    logBotInfo(successMessage);

    await dispatchBotLog(context, {
      type: "ticket_created",
      discordUserId: interaction.user.id,
      channelId: channel.id,
      status: "success",
      message: successMessage,
    });

    await interaction.reply({
      content: buildCreatedTicketMessage(channel.id),
      ephemeral: true,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logBotError(`Falha ao criar ticket para ${interaction.user.tag}.`, error);

    await dispatchBotLog(context, {
      type: "ticket_create_failed",
      discordUserId: interaction.user.id,
      status: "failed",
      message: `Falha ao criar ticket para ${interaction.user.tag}.`,
      errorMessage,
    });

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: buildTicketCreationErrorMessage(),
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      content: buildTicketCreationErrorMessage(),
      ephemeral: true,
    });
  }
}
