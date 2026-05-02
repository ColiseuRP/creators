import {
  ChannelType,
  type ButtonInteraction,
  type ModalSubmitInteraction,
  type StringSelectMenuInteraction,
  type TextChannel,
} from "discord.js";

import {
  claimCreatorTicketRecord,
  findCreatorTicketByChannelId,
  findCreatorTicketById,
} from "../../shared/discord-ticket-store";
import {
  buildCreatorTicketNotifyModal,
  buildCreatorTicketStaffMenuReply,
  buildCreatorTicketRenameModal,
  buildCustomCreatorTicketChannelNameCandidates,
  CREATOR_TICKET_NOTIFY_INPUT_ID,
  CREATOR_TICKET_STAFF_NOTIFY_VALUE,
  CREATOR_TICKET_STAFF_RENAME_VALUE,
  CREATOR_TICKET_RENAME_INPUT_ID,
} from "../../shared/discord-ticketing";
import { dispatchBotLog } from "../services/log-dispatcher";
import { logBotError } from "../services/logger";
import type { BotContext } from "../types";
import { isGuildMember, isResponsibleStaff } from "../utils/is-responsible-staff";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(value: string) {
  return UUID_PATTERN.test(value);
}

function buildTicketChannelLink(context: BotContext, channelId: string) {
  return `https://discord.com/channels/${context.config.guildId}/${channelId}`;
}

async function renameTicketChannelWithFallback(
  channel: TextChannel,
  ticketType: "streamer" | "influencer" | null,
  requestedName: string,
) {
  const candidateNames = buildCustomCreatorTicketChannelNameCandidates(
    ticketType,
    requestedName,
  );

  let lastError: unknown = null;

  for (const channelName of candidateNames) {
    try {
      await channel.setName(channelName);
      return channelName;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("Não foi possível alterar o nome do canal.");
}

function buildTicketNotifyMessage(input: {
  channelLink: string;
  customMessage: string | null;
}) {
  const baseMessage = input.customMessage?.trim()
    ? input.customMessage.trim()
    : [
        "Olá!",
        "",
        "A equipe respondeu sua sala de atendimento e está aguardando seu retorno.",
      ].join("\n");

  return [
    "📩 Atualização no seu ticket — Creators Coliseu",
    "",
    baseMessage,
    "",
    `Acesse seu ticket aqui: ${input.channelLink}`,
    "",
    "Atenciosamente,",
    "Equipe Coliseu RP",
  ].join("\n");
}

async function getOpenTicketForChannel(
  context: BotContext,
  channelId: string,
) {
  const ticket = await findCreatorTicketByChannelId(context.supabase, channelId);
  return ticket && ticket.status === "open" ? ticket : null;
}

export async function handleCreatorTicketStaffMenu(
  context: BotContext,
  interaction: ButtonInteraction,
) {
  if (!interaction.inCachedGuild() || interaction.channel?.type !== ChannelType.GuildText) {
    await interaction.reply({
      content: "Não foi possível concluir esta ação no momento.",
      ephemeral: true,
    });
    return;
  }

  if (!isResponsibleStaff(context, isGuildMember(interaction.member) ? interaction.member : null)) {
    await interaction.reply({
      content: "Você não tem permissão para usar o Menu Staff.",
      ephemeral: true,
    });
    return;
  }

  const ticket = await getOpenTicketForChannel(context, interaction.channel.id);

  if (!ticket) {
    await interaction.reply({
      content: "Este ticket não está mais disponível.",
      ephemeral: true,
    });
    return;
  }

  await interaction.reply({
    ...buildCreatorTicketStaffMenuReply(),
    ephemeral: true,
  });
}

export async function handleCreatorTicketStaffActionSelect(
  context: BotContext,
  interaction: StringSelectMenuInteraction,
) {
  if (!interaction.inCachedGuild() || interaction.channel?.type !== ChannelType.GuildText) {
    await interaction.reply({
      content: "Não foi possível concluir esta ação no momento.",
      ephemeral: true,
    });
    return;
  }

  if (!isResponsibleStaff(context, isGuildMember(interaction.member) ? interaction.member : null)) {
    await interaction.reply({
      content: "Você não tem permissão para usar o Menu Staff.",
      ephemeral: true,
    });
    return;
  }

  const ticket = await getOpenTicketForChannel(context, interaction.channel.id);

  if (!ticket) {
    await interaction.reply({
      content: "Este ticket não está mais disponível.",
      ephemeral: true,
    });
    return;
  }

  const action = interaction.values[0];

  if (action === CREATOR_TICKET_STAFF_RENAME_VALUE) {
    await interaction.showModal(buildCreatorTicketRenameModal(ticket.id));
    return;
  }

  if (action === CREATOR_TICKET_STAFF_NOTIFY_VALUE) {
    await interaction.showModal(buildCreatorTicketNotifyModal(ticket.id));
    return;
  }

  await interaction.reply({
    content: "Não foi possível concluir esta ação no momento.",
    ephemeral: true,
  });
}

export async function handleCreatorTicketClaim(
  context: BotContext,
  interaction: ButtonInteraction,
) {
  if (!interaction.inCachedGuild() || interaction.channel?.type !== ChannelType.GuildText) {
    await interaction.reply({
      content: "Não foi possível concluir esta ação no momento.",
      ephemeral: true,
    });
    return;
  }

  if (!isResponsibleStaff(context, isGuildMember(interaction.member) ? interaction.member : null)) {
    await interaction.reply({
      content: "Você não tem permissão para assumir tickets.",
      ephemeral: true,
    });
    return;
  }

  try {
    const ticket = await getOpenTicketForChannel(context, interaction.channel.id);

    if (!ticket) {
      await interaction.reply({
        content: "Este ticket não está mais disponível.",
        ephemeral: true,
      });
      return;
    }

    if (ticket.claimed_by) {
      await interaction.reply({
        content: `Este ticket já foi assumido por ${ticket.claimed_by_name ?? "outro responsável"}.`,
        ephemeral: true,
      });
      return;
    }

    const claimedTicket = await claimCreatorTicketRecord(context.supabase, {
      ticketId: ticket.id,
      claimedBy: interaction.user.id,
      claimedByName: interaction.user.tag,
    });

    await interaction.channel.send({
      embeds: [
        {
          title: "✅ Ticket assumido",
          description: [
            `Este ticket foi assumido por <@${interaction.user.id}>.`,
            "",
            "Aguarde o atendimento do responsável.",
          ].join("\n"),
          color: 0x2e8b57,
          footer: {
            text: "Creators Coliseu • Atendimento oficial",
          },
        },
      ],
    });

    await interaction.reply({
      content: "Ticket assumido com sucesso.",
      ephemeral: true,
    });

    await dispatchBotLog(context, {
      type: "ticket_claimed",
      discordUserId: ticket.discord_user_id,
      discordUsername: ticket.discord_username,
      channelId: ticket.channel_id,
      ticketId: ticket.id,
      ticketType: ticket.ticket_type,
      actionBy: interaction.user.id,
      status: "success",
      message: `Ticket assumido por ${claimedTicket?.claimed_by_name ?? interaction.user.tag}.`,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logBotError(
      `Não foi possível assumir o ticket ${interaction.channelId}.`,
      error,
    );

    await dispatchBotLog(context, {
      type: "ticket_claim_failed",
      discordUserId: interaction.user.id,
      discordUsername: interaction.user.tag,
      channelId: interaction.channelId,
      actionBy: interaction.user.id,
      status: "failed",
      message: `Falha ao assumir o ticket ${interaction.channelId}.`,
      errorMessage,
    });

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "Não foi possível concluir esta ação no momento.",
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      content: "Não foi possível concluir esta ação no momento.",
      ephemeral: true,
    });
  }
}

export async function handleCreatorTicketRenameModalSubmit(
  context: BotContext,
  interaction: ModalSubmitInteraction,
  ticketId: string,
) {
  if (!interaction.inCachedGuild() || interaction.channel?.type !== ChannelType.GuildText) {
    await interaction.reply({
      content: "Não foi possível concluir esta ação no momento.",
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

  if (!isResponsibleStaff(context, isGuildMember(interaction.member) ? interaction.member : null)) {
    await interaction.reply({
      content: "Você não tem permissão para usar esta ação.",
      ephemeral: true,
    });
    return;
  }

  try {
    const ticket = await findCreatorTicketById(context.supabase, ticketId);

    if (!ticket || ticket.status !== "open" || ticket.channel_id !== interaction.channel.id) {
      await interaction.reply({
        content: "Este ticket não está mais disponível.",
        ephemeral: true,
      });
      return;
    }

    const requestedName = interaction.fields
      .getTextInputValue(CREATOR_TICKET_RENAME_INPUT_ID)
      .trim();

    if (!requestedName) {
      await interaction.reply({
        content: "Informe um nome válido para o canal.",
        ephemeral: true,
      });
      return;
    }

    const renamedChannel = await renameTicketChannelWithFallback(
      interaction.channel,
      ticket.ticket_type,
      requestedName,
    );

    await dispatchBotLog(context, {
      type: "ticket_renamed",
      discordUserId: ticket.discord_user_id,
      discordUsername: ticket.discord_username,
      channelId: ticket.channel_id,
      ticketId: ticket.id,
      ticketType: ticket.ticket_type,
      actionBy: interaction.user.id,
      status: "success",
      message: `Canal do ticket alterado para ${renamedChannel}.`,
    });

    await interaction.reply({
      content: "Nome do canal alterado com sucesso.",
      ephemeral: true,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logBotError(
      `Não foi possível alterar o nome do ticket ${interaction.channelId}.`,
      error,
    );

    await dispatchBotLog(context, {
      type: "ticket_rename_failed",
      discordUserId: interaction.user.id,
      discordUsername: interaction.user.tag,
      channelId: interaction.channelId,
      ticketId,
      actionBy: interaction.user.id,
      status: "failed",
      message: `Falha ao alterar o nome do ticket ${interaction.channelId}.`,
      errorMessage,
    });

    await interaction.reply({
      content: "Não foi possível alterar o nome do canal.",
      ephemeral: true,
    });
  }
}

export async function handleCreatorTicketNotifyModalSubmit(
  context: BotContext,
  interaction: ModalSubmitInteraction,
  ticketId: string,
) {
  if (!interaction.inCachedGuild() || interaction.channel?.type !== ChannelType.GuildText) {
    await interaction.reply({
      content: "Não foi possível concluir esta ação no momento.",
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

  if (!isResponsibleStaff(context, isGuildMember(interaction.member) ? interaction.member : null)) {
    await interaction.reply({
      content: "Você não tem permissão para usar esta ação.",
      ephemeral: true,
    });
    return;
  }

  try {
    const ticket = await findCreatorTicketById(context.supabase, ticketId);

    if (!ticket || ticket.status !== "open" || ticket.channel_id !== interaction.channel.id) {
      await interaction.reply({
        content: "Este ticket não está mais disponível.",
        ephemeral: true,
      });
      return;
    }

    const customMessage = interaction.fields
      .getTextInputValue(CREATOR_TICKET_NOTIFY_INPUT_ID)
      .trim();
    const channelLink = buildTicketChannelLink(context, ticket.channel_id);
    const user = await context.client.users.fetch(ticket.discord_user_id);

    await user.send(
      buildTicketNotifyMessage({
        channelLink,
        customMessage: customMessage.length > 0 ? customMessage : null,
      }),
    );

    await dispatchBotLog(context, {
      type: "ticket_notify_sent",
      discordUserId: ticket.discord_user_id,
      discordUsername: ticket.discord_username,
      channelId: ticket.channel_id,
      ticketId: ticket.id,
      ticketType: ticket.ticket_type,
      actionBy: interaction.user.id,
      status: "success",
      message: `Notificação privada enviada para ${ticket.discord_username}.`,
    });

    await interaction.reply({
      content: "Notificação enviada no privado do usuário.",
      ephemeral: true,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logBotError(
      `Não foi possível enviar DM sobre o ticket ${interaction.channelId}.`,
      error,
    );

    await dispatchBotLog(context, {
      type: "ticket_notify_failed",
      discordUserId: interaction.user.id,
      discordUsername: interaction.user.tag,
      channelId: interaction.channelId,
      ticketId,
      actionBy: interaction.user.id,
      status: "failed",
      message: `Falha ao notificar o creator no ticket ${interaction.channelId}.`,
      errorMessage,
    });

    await interaction.reply({
      content:
        "Não foi possível enviar DM para o usuário. Ele pode estar com mensagens privadas bloqueadas.",
      ephemeral: true,
    });
  }
}
