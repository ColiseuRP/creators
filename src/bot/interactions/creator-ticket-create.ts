import {
  ChannelType,
  GuildMember,
  type StringSelectMenuInteraction,
} from "discord.js";

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
  getCreatorTicketTypeAudienceLabel,
  parseCreatorTicketTypeValue,
} from "../../shared/discord-ticketing";
import { dispatchBotLog } from "../services/log-dispatcher";
import { logBotError, logBotInfo } from "../services/logger";
import type { BotContext } from "../types";
import { buildCreatorTicketOverwrites } from "../utils/build-ticket-overwrites";

function isGuildMember(
  member: GuildMember | StringSelectMenuInteraction["member"],
): member is GuildMember {
  return member instanceof GuildMember;
}

export async function handleCreatorTicketCreate(
  context: BotContext,
  interaction: StringSelectMenuInteraction,
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
      content: "Este menu não está vinculado ao servidor configurado.",
      ephemeral: true,
    });
    return;
  }

  const ticketType = parseCreatorTicketTypeValue(interaction.values[0]);

  if (!ticketType) {
    await interaction.reply({
      content: "Tipo de atendimento inválido. Tente novamente pelo painel.",
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    await dispatchBotLog(context, {
      type: "ticket_type_selected",
      discordUserId: interaction.user.id,
      discordUsername: interaction.user.tag,
      ticketType,
      status: "info",
      message: `${interaction.user.tag} selecionou ${getCreatorTicketTypeAudienceLabel(ticketType)} no painel de tickets.`,
    });

    const existingTicket = await findOpenCreatorTicketByDiscordUser(
      context.supabase,
      interaction.user.id,
    );

    if (existingTicket) {
      const duplicateMessage = buildExistingTicketMessage(existingTicket.channel_id);

      await dispatchBotLog(context, {
        type: "ticket_duplicate_blocked",
        discordUserId: interaction.user.id,
        discordUsername: interaction.user.tag,
        channelId: existingTicket.channel_id,
        ticketType: existingTicket.ticket_type ?? ticketType,
        status: "info",
        message: `Tentativa de ticket duplicado bloqueada para ${interaction.user.tag}.`,
      });

      await interaction.editReply({
        content: duplicateMessage,
      });
      return;
    }

    const botUserId = interaction.client.user?.id;

    if (!botUserId) {
      throw new Error("O identificador do bot não está disponível.");
    }

    const member = interaction.member;
    const displayName = isGuildMember(member) ? member.displayName : interaction.user.username;
    const channelName = buildCreatorTicketChannelName(ticketType, displayName);

    const channel = await interaction.guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: context.config.creatorsCategoryId,
      topic: `${getCreatorTicketTypeAudienceLabel(ticketType)} | Creators Coliseu | ${interaction.user.id}`,
      permissionOverwrites: buildCreatorTicketOverwrites({
        guildId: interaction.guild.id,
        requesterId: interaction.user.id,
        botUserId,
        staffRoleIds: context.config.staffRoleIds,
      }),
    });

    await channel.send(
      buildCreatorTicketWelcomeMessage({
        ticketType,
        userId: interaction.user.id,
        staffRoleId: context.config.responsavelStaffRoleId,
      }),
    );

    try {
      await createCreatorTicketRecord(context.supabase, {
        discordUserId: interaction.user.id,
        discordUsername: interaction.user.tag,
        channelId: channel.id,
        ticketType,
      });
    } catch (error) {
      const fallbackTicket = await findOpenCreatorTicketByDiscordUser(
        context.supabase,
        interaction.user.id,
      );

      if (fallbackTicket) {
        await channel.delete("Ticket duplicado evitado após criação concorrente.");
        await interaction.editReply({
          content: buildExistingTicketMessage(fallbackTicket.channel_id),
        });
        return;
      }

      await channel.delete("Falha ao registrar o ticket internamente.");
      throw error;
    }

    const successMessage =
      ticketType === "streamer"
        ? `Ticket streamer criado para ${interaction.user.tag}.`
        : `Ticket influencer criado para ${interaction.user.tag}.`;

    logBotInfo(successMessage);

    await dispatchBotLog(context, {
      type: ticketType === "streamer" ? "ticket_streamer_created" : "ticket_influencer_created",
      discordUserId: interaction.user.id,
      discordUsername: interaction.user.tag,
      channelId: channel.id,
      ticketType,
      status: "success",
      message: successMessage,
    });

    await interaction.editReply({
      content: buildCreatedTicketMessage(ticketType, channel.id),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logBotError(`Falha ao criar ticket para ${interaction.user.tag}.`, error);

    await dispatchBotLog(context, {
      type: "ticket_create_failed",
      discordUserId: interaction.user.id,
      discordUsername: interaction.user.tag,
      ticketType,
      status: "failed",
      message: `Falha ao criar ticket para ${interaction.user.tag}.`,
      errorMessage,
    });

    await interaction.editReply({
      content: buildTicketCreationErrorMessage(),
    });
  }
}
