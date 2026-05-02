import {
  ChannelType,
  PermissionFlagsBits,
  type ButtonInteraction,
  type ModalSubmitInteraction,
  type TextChannel,
} from "discord.js";

import {
  closeCreatorTicketRecord,
  findCreatorTicketByChannelId,
  findCreatorTicketById,
} from "../../shared/discord-ticket-store";
import {
  buildClosingTicketMessage,
  buildCreatorTicketCloseModal,
  canManageTicket,
  CREATOR_TICKET_CLOSE_DELAY_MS,
  CREATOR_TICKET_CLOSE_REASON_INPUT_ID,
  getCreatorTicketTypeLabel,
} from "../../shared/discord-ticketing";
import { dispatchBotLog } from "../services/log-dispatcher";
import { logBotError, logBotInfo } from "../services/logger";
import type { BotContext } from "../types";
import { isGuildMember } from "../utils/is-responsible-staff";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(value: string) {
  return UUID_PATTERN.test(value);
}

async function archiveOrDeleteTicketChannel(
  context: BotContext,
  input: {
    channel: TextChannel;
    closedBy: string;
    openerDiscordUserId: string;
    closeReason: string;
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
      closeReason: input.closeReason,
    });
    return "archived" as const;
  }

  await closeCreatorTicketRecord(context.supabase, {
    channelId: input.channel.id,
    status: "closed",
    closedBy: input.closedBy,
    closeReason: input.closeReason,
  });
  await input.channel.delete("Ticket Creators Coliseu encerrado.");
  return "closed" as const;
}

function actorCanManageOpenTicket(
  context: BotContext,
  input: {
    ticketOwnerDiscordUserId: string;
    actorDiscordUserId: string;
    member: ButtonInteraction["member"] | ModalSubmitInteraction["member"];
  },
) {
  const memberRoleIds = isGuildMember(input.member)
    ? [...input.member.roles.cache.keys()]
    : [];
  const memberIsAdmin = isGuildMember(input.member)
    ? input.member.permissions.has(PermissionFlagsBits.Administrator)
    : false;

  return canManageTicket({
    openerDiscordUserId: input.ticketOwnerDiscordUserId,
    actorDiscordUserId: input.actorDiscordUserId,
    actorRoleIds: memberRoleIds,
    staffRoleIds: context.config.staffRoleIds,
    actorIsAdministrator: memberIsAdmin,
  });
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

    if (
      !actorCanManageOpenTicket(context, {
        ticketOwnerDiscordUserId: ticket.discord_user_id,
        actorDiscordUserId: interaction.user.id,
        member: interaction.member,
      })
    ) {
      await interaction.reply({
        content: "Você não tem permissão para fechar este ticket.",
        ephemeral: true,
      });
      return;
    }

    await dispatchBotLog(context, {
      type: "ticket_close_modal_opened",
      discordUserId: ticket.discord_user_id,
      discordUsername: ticket.discord_username,
      channelId: ticket.channel_id,
      ticketId: ticket.id,
      ticketType: ticket.ticket_type,
      actionBy: interaction.user.id,
      status: "info",
      message: `${interaction.user.tag} iniciou o fechamento do ticket ${ticket.channel_id}.`,
    });

    await interaction.showModal(buildCreatorTicketCloseModal(ticket.id));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logBotError(
      `Falha ao abrir o fechamento do ticket ${interaction.channelId}.`,
      error,
    );

    await dispatchBotLog(context, {
      type: "ticket_close_failed",
      discordUserId: interaction.user.id,
      discordUsername: interaction.user.tag,
      channelId: interaction.channelId,
      status: "failed",
      actionBy: interaction.user.id,
      message: `Falha ao abrir o fechamento do ticket para ${interaction.user.tag}.`,
      errorMessage,
    });

    await interaction.reply({
      content: "Não foi possível concluir esta ação no momento.",
      ephemeral: true,
    });
  }
}

export async function handleCreatorTicketCloseModalSubmit(
  context: BotContext,
  interaction: ModalSubmitInteraction,
  ticketId: string,
) {
  if (!interaction.inCachedGuild() || interaction.channel?.type !== ChannelType.GuildText) {
    await interaction.reply({
      content: "Este ticket não pode ser encerrado neste contexto.",
      ephemeral: true,
    });
    return;
  }

  if (!isValidUuid(ticketId)) {
    await interaction.reply({
      content: "Não foi possível concluir esta ação no momento.",
      ephemeral: true,
    });
    return;
  }

  try {
    const ticket = await findCreatorTicketById(context.supabase, ticketId);

    if (!ticket || ticket.status !== "open" || ticket.channel_id !== interaction.channel.id) {
      await interaction.reply({
        content: "Este ticket não está mais disponível para fechamento.",
        ephemeral: true,
      });
      return;
    }

    if (
      !actorCanManageOpenTicket(context, {
        ticketOwnerDiscordUserId: ticket.discord_user_id,
        actorDiscordUserId: interaction.user.id,
        member: interaction.member,
      })
    ) {
      await interaction.reply({
        content: "Você não tem permissão para fechar este ticket.",
        ephemeral: true,
      });
      return;
    }

    const closeReason = interaction.fields
      .getTextInputValue(CREATOR_TICKET_CLOSE_REASON_INPUT_ID)
      .trim();

    if (!closeReason) {
      await interaction.reply({
        content: "Informe o motivo do fechamento do ticket.",
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
          closeReason,
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
          channelId: ticket.channel_id,
          ticketId: ticket.id,
          ticketType: ticket.ticket_type,
          actionBy: interaction.user.id,
          status: "success",
          message: `${successMessage} Motivo: ${closeReason}`,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        logBotError(`Não foi possível fechar o ticket ${interaction.channelId}.`, error);

        await dispatchBotLog(context, {
          type: "ticket_close_failed",
          discordUserId: ticket.discord_user_id,
          discordUsername: ticket.discord_username,
          channelId: interaction.channelId,
          ticketId: ticket.id,
          ticketType: ticket.ticket_type,
          actionBy: interaction.user.id,
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
      ticketId,
      actionBy: interaction.user.id,
      status: "failed",
      message: `Falha ao processar o fechamento do ticket por ${interaction.user.tag}.`,
      errorMessage,
    });

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "Não foi possível fechar o ticket.",
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      content: "Não foi possível fechar o ticket.",
      ephemeral: true,
    });
  }
}
