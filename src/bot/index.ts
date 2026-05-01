import process from "node:process";
import "./env";

import {
  ChannelType,
  Client,
  GatewayIntentBits,
  GuildMember,
  PermissionFlagsBits,
  type ButtonInteraction,
  type OverwriteResolvable,
  type TextChannel,
} from "discord.js";

import { createBotSupabaseClient } from "./supabase";
import {
  closeCreatorTicketRecord,
  createCreatorTicketRecord,
  createDiscordBotLogRecord,
  findCreatorTicketByChannelId,
  findOpenCreatorTicketByDiscordUser,
} from "../shared/discord-ticket-store";
import {
  buildClosingTicketMessage,
  buildCreatedTicketMessage,
  buildCreatorTicketChannelName,
  buildCreatorTicketWelcomeMessage,
  buildExistingTicketMessage,
  canManageTicket,
  CREATOR_TICKET_CLOSE_CUSTOM_ID,
  CREATOR_TICKET_CLOSE_DELAY_MS,
  CREATOR_TICKET_CREATE_CUSTOM_ID,
  parseDiscordIdList,
} from "../shared/discord-ticketing";

interface BotConfig {
  token: string;
  guildId: string;
  citizenRoleId: string | null;
  creatorsCategoryId: string | null;
  archivedTicketsCategoryId: string | null;
  staffRoleIds: string[];
}

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`A variável de ambiente ${name} não foi configurada para o bot.`);
  }

  return value;
}

function loadBotConfig(): BotConfig {
  return {
    token: getRequiredEnv("DISCORD_BOT_TOKEN"),
    guildId: getRequiredEnv("DISCORD_GUILD_ID"),
    citizenRoleId: process.env.DISCORD_CITIZEN_ROLE_ID?.trim() || null,
    creatorsCategoryId: process.env.DISCORD_CREATORS_CATEGORY_ID?.trim() || null,
    archivedTicketsCategoryId:
      process.env.DISCORD_ARCHIVED_TICKETS_CATEGORY_ID?.trim() || null,
    staffRoleIds: parseDiscordIdList(process.env.DISCORD_STAFF_ROLE_IDS),
  };
}

const config = loadBotConfig();
const supabase = createBotSupabaseClient();

function isGuildMember(member: GuildMember | ButtonInteraction["member"]): member is GuildMember {
  return member instanceof GuildMember;
}

function buildCreatorTicketOverwrites(input: {
  guildId: string;
  requesterId: string;
  botUserId: string;
  staffRoleIds: string[];
}) {
  const base: OverwriteResolvable[] = [
    {
      id: input.guildId,
      deny: [PermissionFlagsBits.ViewChannel],
    },
    {
      id: input.requesterId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
      ],
    },
    {
      id: input.botUserId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
      ],
    },
  ];

  return base.concat(
    input.staffRoleIds.map((roleId) => ({
      id: roleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.ManageMessages,
      ],
    })),
  );
}

async function logBotEvent(input: {
  type: string;
  discordUserId?: string | null;
  channelId?: string | null;
  status: "success" | "failed" | "info";
  message: string;
  errorMessage?: string | null;
}) {
  try {
    await createDiscordBotLogRecord(supabase, input);
  } catch (error) {
    console.error("[discord-bot] Falha ao registrar log interno.", error);
  }
}

async function assignCitizenRole(member: GuildMember) {
  if (member.guild.id !== config.guildId || !config.citizenRoleId) {
    return;
  }

  try {
    await member.roles.add(config.citizenRoleId);

    const successMessage = `Cargo Cidadão adicionado para ${member.user.tag}.`;
    console.log(successMessage);

    await logBotEvent({
      type: "member_join_role_assigned",
      discordUserId: member.user.id,
      status: "success",
      message: successMessage,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `Não foi possível adicionar o cargo Cidadão para ${member.user.tag}: ${errorMessage}`,
    );

    await logBotEvent({
      type: "member_join_role_failed",
      discordUserId: member.user.id,
      status: "failed",
      message: `Falha ao adicionar o cargo Cidadão para ${member.user.tag}.`,
      errorMessage,
    });
  }
}

async function handleCreateTicket(interaction: ButtonInteraction) {
  if (!interaction.inCachedGuild()) {
    await interaction.reply({
      content: "Não foi possível abrir a sala neste contexto.",
      ephemeral: true,
    });
    return;
  }

  if (interaction.guild.id !== config.guildId) {
    await interaction.reply({
      content: "Este botão não está vinculado ao servidor configurado.",
      ephemeral: true,
    });
    return;
  }

  if (!config.creatorsCategoryId) {
    await interaction.reply({
      content: "A categoria de tickets dos creators não está configurada.",
      ephemeral: true,
    });
    return;
  }

  try {
    const existingTicket = await findOpenCreatorTicketByDiscordUser(
      supabase,
      interaction.user.id,
    );

    if (existingTicket) {
      await interaction.reply({
        content: buildExistingTicketMessage(existingTicket.channel_id),
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
      parent: config.creatorsCategoryId,
      topic: `Atendimento Creators Coliseu | ${interaction.user.id}`,
      permissionOverwrites: buildCreatorTicketOverwrites({
        guildId: interaction.guild.id,
        requesterId: interaction.user.id,
        botUserId,
        staffRoleIds: config.staffRoleIds,
      }),
    });

    if (channel.type !== ChannelType.GuildText) {
      await channel.delete("Canal de ticket criado em formato inválido.");
      throw new Error("O canal criado não é compatível com atendimento por texto.");
    }

    await channel.send(buildCreatorTicketWelcomeMessage(`<@${interaction.user.id}>`));

    try {
      await createCreatorTicketRecord(supabase, {
        discordUserId: interaction.user.id,
        discordUsername: interaction.user.tag,
        channelId: channel.id,
      });
    } catch (error) {
      const fallbackTicket = await findOpenCreatorTicketByDiscordUser(
        supabase,
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

    await logBotEvent({
      type: "ticket_created",
      discordUserId: interaction.user.id,
      channelId: channel.id,
      status: "success",
      message: `Ticket criado para ${interaction.user.tag}.`,
    });

    await interaction.reply({
      content: buildCreatedTicketMessage(channel.id),
      ephemeral: true,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    await logBotEvent({
      type: "ticket_create_failed",
      discordUserId: interaction.user.id,
      status: "failed",
      message: `Falha ao criar ticket para ${interaction.user.tag}.`,
      errorMessage,
    });

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "Não foi possível criar sua sala de atendimento agora. Tente novamente em instantes.",
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      content: "Não foi possível criar sua sala de atendimento agora. Tente novamente em instantes.",
      ephemeral: true,
    });
  }
}

async function archiveOrDeleteTicketChannel(input: {
  channel: TextChannel;
  closedBy: string;
  openerDiscordUserId: string;
}) {
  if (config.archivedTicketsCategoryId) {
    await input.channel.permissionOverwrites.edit(input.openerDiscordUserId, {
      SendMessages: false,
      AttachFiles: false,
      EmbedLinks: false,
    });
    await input.channel.setParent(config.archivedTicketsCategoryId, {
      lockPermissions: false,
    });
    await closeCreatorTicketRecord(supabase, {
      channelId: input.channel.id,
      status: "archived",
      closedBy: input.closedBy,
      closeReason: "Ticket movido para a categoria de arquivados.",
    });
    return "archived" as const;
  }

  await closeCreatorTicketRecord(supabase, {
    channelId: input.channel.id,
    status: "closed",
    closedBy: input.closedBy,
    closeReason: "Ticket encerrado e removido do canal ativo.",
  });
  await input.channel.delete("Ticket Creators Coliseu encerrado.");
  return "closed" as const;
}

async function handleCloseTicket(interaction: ButtonInteraction) {
  if (!interaction.inCachedGuild() || interaction.channel?.type !== ChannelType.GuildText) {
    await interaction.reply({
      content: "Este ticket não pode ser encerrado neste contexto.",
      ephemeral: true,
    });
    return;
  }

  try {
    const ticket = await findCreatorTicketByChannelId(supabase, interaction.channel.id);

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
        staffRoleIds: config.staffRoleIds,
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

        const closureStatus = await archiveOrDeleteTicketChannel({
          channel,
          closedBy: interaction.user.id,
          openerDiscordUserId: ticket.discord_user_id,
        });

        await logBotEvent({
          type: "ticket_closed",
          discordUserId: ticket.discord_user_id,
          channelId: channel.id,
          status: "success",
          message:
            closureStatus === "archived"
              ? `Ticket de ${ticket.discord_username} arquivado com sucesso.`
              : `Ticket de ${ticket.discord_username} fechado com sucesso.`,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        await logBotEvent({
          type: "ticket_close_failed",
          discordUserId: ticket.discord_user_id,
          channelId: interaction.channelId,
          status: "failed",
          message: `Falha ao fechar o ticket de ${ticket.discord_username}.`,
          errorMessage,
        });

        console.error(
          `[discord-bot] Não foi possível fechar o ticket ${interaction.channelId}: ${errorMessage}`,
        );
      }
    }, CREATOR_TICKET_CLOSE_DELAY_MS);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    await logBotEvent({
      type: "ticket_close_failed",
      discordUserId: interaction.user.id,
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

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

client.once("ready", () => {
  console.log(`[discord-bot] Bot Creators Coliseu online como ${client.user?.tag ?? "bot"}.`);
});

client.on("guildMemberAdd", async (member) => {
  await assignCitizenRole(member);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) {
    return;
  }

  if (interaction.customId === CREATOR_TICKET_CREATE_CUSTOM_ID) {
    await handleCreateTicket(interaction);
    return;
  }

  if (interaction.customId === CREATOR_TICKET_CLOSE_CUSTOM_ID) {
    await handleCloseTicket(interaction);
  }
});

process.on("unhandledRejection", (error) => {
  console.error("[discord-bot] Rejeição não tratada.", error);
});

process.on("uncaughtException", (error) => {
  console.error("[discord-bot] Exceção não tratada.", error);
});

client.login(config.token).catch((error) => {
  console.error("[discord-bot] Não foi possível iniciar o bot.", error);
  process.exitCode = 1;
});
