import {
  ChannelType,
  GuildMember,
  PermissionFlagsBits,
  type ButtonInteraction,
  type TextChannel,
} from "discord.js";

import {
  closeCreatorTicketRecord,
  findCreatorTicketByChannelId,
} from "../../shared/discord-ticket-store";
import {
  buildClosingTicketMessage,
  canManageTicket,
  CREATOR_TICKET_CLOSE_DELAY_MS,
  getCreatorTicketTypeLabel,
} from "../../shared/discord-ticketing";
import { dispatchBotLog } from "../services/log-dispatcher";
import { logBotError, logBotInfo } from "../services/logger";
import type { BotContext } from "../types";

function isGuildMember(member: GuildMember | ButtonInteraction["member"]): member is GuildMember {
  return member instanceof GuildMember;
}

async function archiveOrDeleteTicketChannel(
  context: BotContext,
  input: {
    channel: TextChannel;
    closedBy: string;
    openerDiscordUserId: string;
  },
) {
  if (context.config.archivedTicketsCategoryId) {
    await input.channel.permissionOverwrites.edit(input.openerDiscordUserId, {
      SendMessages: false,
      AttachFiles: false,
      EmbedLinks: false,
    });
    await input.channel.setParent(context.config.archivedTicketsCategoryId, {
      lockPermissions: false,
    });
    await closeCreatorTicketRecord(context.supabase, {
      channelId: input.channel.id,
      status: "archived",
      closedBy: input.closedBy,
      closeReason: "Ticket movido para a categoria de arquivados.",
    });
    return "archived" as const;
  }

  await closeCreatorTicketRecord(context.supabase, {
    channelId: input.channel.id,
    status: "closed",
    closedBy: input.closedBy,
    closeReason: "Ticket encerrado e removido do canal ativo.",
  });
  await input.channel.delete("Ticket Creators Coliseu encerrado.");
  return "closed" as const;
}

export async function handleCreatorTicketClose(
  context: BotContext,
  interaction: ButtonInteraction,
) {
  if (!interaction.inCachedGuild() || interaction.channel?.type !== ChannelType.GuildText) {
    await interaction.reply({
      content: "Este ticket não pode ser encerrado neste contexto.",
      ephemeral: true,
    });
    return;
  }

  try {
    const ticket = await findCreatorTicketByChannelId(context.supabase, interaction.channel.id);

    if (!ticket || ticket.status !== "open") {
      await interaction.reply({
        content: "Este canal não está vinculado a um ticket aberto.",
        ephemeral: true,
      });
      return;
    }

    const member = interaction.member;
    const memberRoleIds = isGuildMember(member) ? [...member.roles.cache.keys()] : [];
    const memberIsAdmin = isGuildMember(member)
      ? member.permissions.has(PermissionFlagsBits.Administrator)
      : false;

    if (
      !canManageTicket({
        openerDiscordUserId: ticket.discord_user_id,
        actorDiscordUserId: interaction.user.id,
        actorRoleIds: memberRoleIds,
        staffRoleIds: context.config.staffRoleIds,
        actorIsAdministrator: memberIsAdmin,
      })
    ) {
      await interaction.reply({
        content: "Você não tem permissão para fechar este ticket.",
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      content: buildClosingTicketMessage(),
    });

    setTimeout(async () => {
      try {
        const channel = interaction.channel;

        if (!channel || channel.type !== ChannelType.GuildText) {
          throw new Error("Canal do ticket não está mais disponível.");
        }

        const closureStatus = await archiveOrDeleteTicketChannel(context, {
          channel,
          closedBy: interaction.user.id,
          openerDiscordUserId: ticket.discord_user_id,
        });

        const ticketLabel = getCreatorTicketTypeLabel(ticket.ticket_type);
        const successMessage =
          closureStatus === "archived"
            ? `Ticket ${ticketLabel} de ${ticket.discord_username} arquivado com sucesso.`
            : `Ticket ${ticketLabel} de ${ticket.discord_username} fechado com sucesso.`;

        logBotInfo(successMessage);

        await dispatchBotLog(context, {
          type: "ticket_closed",
          discordUserId: ticket.discord_user_id,
          discordUsername: ticket.discord_username,
          channelId: channel.id,
          ticketType: ticket.ticket_type,
          status: "success",
          message: successMessage,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        logBotError(`Não foi possível fechar o ticket ${interaction.channelId}.`, error);

        await dispatchBotLog(context, {
          type: "ticket_close_failed",
          discordUserId: ticket.discord_user_id,
          discordUsername: ticket.discord_username,
          channelId: interaction.channelId,
          ticketType: ticket.ticket_type,
          status: "failed",
          message: `Falha ao fechar o ticket de ${ticket.discord_username}.`,
          errorMessage,
        });
      }
    }, CREATOR_TICKET_CLOSE_DELAY_MS);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logBotError(
      `Falha ao processar o fechamento do ticket por ${interaction.user.tag}.`,
      error,
    );

    await dispatchBotLog(context, {
      type: "ticket_close_failed",
      discordUserId: interaction.user.id,
      discordUsername: interaction.user.tag,
      channelId: interaction.channelId,
      status: "failed",
      message: `Falha ao processar o fechamento do ticket por ${interaction.user.tag}.`,
      errorMessage,
    });

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "Não foi possível fechar o ticket agora.",
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      content: "Não foi possível fechar o ticket agora.",
      ephemeral: true,
    });
  }
}
