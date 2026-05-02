import {
  ActionRowBuilder,
  ChannelType,
  GuildMember,
  ModalBuilder,
  PermissionFlagsBits,
  TextInputBuilder,
  TextInputStyle,
  type ButtonInteraction,
  type ModalSubmitInteraction,
  type TextChannel,
} from "discord.js";

import {
  buildCreatorApplicationApprovedDm,
  buildCreatorApplicationRejectedDm,
  buildCreatorApplicationReviewPayload,
  CREATOR_APPLICATION_APPROVE_PREFIX,
  CREATOR_APPLICATION_MODAL_CUSTOM_ID,
  CREATOR_APPLICATION_REJECT_PREFIX,
  CREATOR_APPLICATION_REJECT_MODAL_PREFIX,
  CREATOR_APPLICATION_REJECT_REASON_FIELD_ID,
  extractCreatorApplicationIdFromCustomId,
} from "../../shared/creator-applications";
import {
  createCreatorApplicationRecord,
  findCreatorApplicationById,
  reviewCreatorApplicationRecord,
  syncApprovedCreatorFromApplication,
  updateCreatorApplicationReviewMessage,
} from "../../shared/creator-application-store";
import { dispatchBotLog } from "../services/log-dispatcher";
import { logBotError } from "../services/logger";
import type { BotContext } from "../types";

function isGuildMember(
  member: GuildMember | ButtonInteraction["member"] | ModalSubmitInteraction["member"],
): member is GuildMember {
  return member instanceof GuildMember;
}

function canReviewApplications(
  context: BotContext,
  member: GuildMember | ButtonInteraction["member"] | ModalSubmitInteraction["member"],
) {
  if (!isGuildMember(member)) {
    return false;
  }

  return (
    member.permissions.has(PermissionFlagsBits.Administrator) ||
    member.roles.cache.some((role) => context.config.staffRoleIds.includes(role.id))
  );
}

function buildCreatorApplicationModal() {
  return new ModalBuilder()
    .setCustomId(CREATOR_APPLICATION_MODAL_CUSTOM_ID)
    .setTitle("Inscrição Creators Coliseu")
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("city_name")
          .setLabel("Nome na cidade")
          .setPlaceholder("Ex: Snow")
          .setRequired(true)
          .setStyle(TextInputStyle.Short),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("category")
          .setLabel("Categoria")
          .setPlaceholder("Streamer ou Influencer")
          .setRequired(true)
          .setStyle(TextInputStyle.Short),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("social_links")
          .setLabel("Redes sociais / canal")
          .setPlaceholder("Envie links da Twitch, TikTok, Instagram, YouTube ou Kick")
          .setRequired(true)
          .setStyle(TextInputStyle.Paragraph),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("frequency")
          .setLabel("Frequência de conteúdo")
          .setPlaceholder("Ex: 5 lives por semana, 3 posts semanais...")
          .setRequired(true)
          .setStyle(TextInputStyle.Short),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("reason")
          .setLabel("Por que quer ser creator?")
          .setPlaceholder(
            "Explique brevemente por que deseja participar do programa",
          )
          .setRequired(true)
          .setStyle(TextInputStyle.Paragraph),
      ),
    );
}

function buildRejectReasonModal(applicationId: string) {
  return new ModalBuilder()
    .setCustomId(`${CREATOR_APPLICATION_REJECT_MODAL_PREFIX}${applicationId}`)
    .setTitle("Motivo da negação")
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId(CREATOR_APPLICATION_REJECT_REASON_FIELD_ID)
          .setLabel("Motivo")
          .setPlaceholder("Informe o motivo da negação")
          .setRequired(true)
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(1000),
      ),
    );
}

async function getReviewChannel(context: BotContext, interactionGuildId: string) {
  const channel = await context.client.channels.fetch(
    context.config.creatorFormSubmissionsChannelId,
  );

  if (!channel || channel.type !== ChannelType.GuildText || channel.guildId !== interactionGuildId) {
    throw new Error("Canal de formulários do Discord não encontrado.");
  }

  return channel as TextChannel;
}

async function syncReviewMessageInDiscord(
  context: BotContext,
  applicationId: string,
  fallbackMessage?: ButtonInteraction["message"] | null,
) {
  const application = await findCreatorApplicationById(context.supabase, applicationId, {
    fallbackToMemory: false,
  });

  if (!application) {
    return;
  }

  const payload = buildCreatorApplicationReviewPayload({
    application,
    status: application.status,
    reviewedByLabel: application.reviewed_by_name ?? application.discord_name,
    rejectionReason: application.rejection_reason ?? null,
    disableActions: true,
  });

  try {
    if (application.review_channel_id && application.review_message_id) {
      const channel = await context.client.channels.fetch(application.review_channel_id);

      if (channel?.type === ChannelType.GuildText) {
        const message = await channel.messages.fetch(application.review_message_id);
        await message.edit(payload);
        return;
      }
    }

    if (fallbackMessage) {
      await fallbackMessage.edit(payload);
    }
  } catch (error) {
    logBotError("Falha ao atualizar a mensagem de revisão da inscrição.", error);
  }
}

async function sendApplicationDmWithClient(
  context: BotContext,
  discordUserId: string,
  content: string,
) {
  const user = await context.client.users.fetch(discordUserId);
  return user.send(content);
}

async function addApprovedRoleToMember(
  context: BotContext,
  interaction: ButtonInteraction | ModalSubmitInteraction,
  discordUserId: string,
) {
  if (!interaction.inCachedGuild()) {
    throw new Error("Servidor do Discord não encontrado para adicionar o cargo.");
  }

  const member = await interaction.guild.members.fetch(discordUserId);
  await member.roles.add(context.config.approvedCreatorRoleId);
}

async function finalizeDiscordApplicationReview(
  context: BotContext,
  interaction: ButtonInteraction | ModalSubmitInteraction,
  input: {
    applicationId: string;
    decision: "approved" | "rejected";
    rejectionReason?: string | null;
  },
) {
  const application = await findCreatorApplicationById(context.supabase, input.applicationId, {
    fallbackToMemory: false,
  });

  if (!application) {
    throw new Error("Inscrição não encontrada.");
  }

  if (application.status !== "pending") {
    throw new Error("Esta inscrição já foi analisada.");
  }

  const updatedApplication = await reviewCreatorApplicationRecord(context.supabase, {
    applicationId: application.id,
    decision: input.decision,
    reviewedBy: null,
    reviewedByText: interaction.user.id,
    reviewedByName: interaction.user.tag,
    rejectionReason: input.decision === "rejected" ? input.rejectionReason ?? null : null,
  });

  if (!updatedApplication) {
    throw new Error("Inscrição não encontrada.");
  }

  await dispatchBotLog(context, {
    type:
      input.decision === "approved"
        ? "creator_application_approved"
        : "creator_application_rejected",
    discordUserId: updatedApplication.discord_id,
    discordUsername: updatedApplication.discord_name,
    channelId: updatedApplication.review_channel_id ?? interaction.channelId,
    applicationId: updatedApplication.id,
    actionBy: interaction.user.id,
    status: "success",
    message:
      input.decision === "approved"
        ? `Inscrição aprovada por ${interaction.user.tag}.`
        : `Inscrição negada por ${interaction.user.tag}.`,
  });

  const warnings: string[] = [];

  if (input.decision === "approved") {
    const syncResult = await syncApprovedCreatorFromApplication(
      context.supabase,
      updatedApplication,
    );

    if (syncResult.skipped && syncResult.reason) {
      warnings.push(
        "A inscrição foi aprovada, mas a Sala do Creator ainda depende de vínculo no site.",
      );
    }
  }

  if (updatedApplication.discord_id) {
    const dmMessage =
      input.decision === "approved"
        ? buildCreatorApplicationApprovedDm(
            updatedApplication.name,
            context.config.ticketChannelId,
          )
        : buildCreatorApplicationRejectedDm(
            updatedApplication.name,
            updatedApplication.rejection_reason ?? "Não informado pela equipe.",
          );

    try {
      await sendApplicationDmWithClient(context, updatedApplication.discord_id, dmMessage);
      await dispatchBotLog(context, {
        type: "creator_application_dm_sent",
        discordUserId: updatedApplication.discord_id,
        discordUsername: updatedApplication.discord_name,
        channelId: updatedApplication.review_channel_id ?? interaction.channelId,
        applicationId: updatedApplication.id,
        actionBy: interaction.user.id,
        status: "success",
        message: "Mensagem privada enviada com sucesso ao creator.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      warnings.push(
        "A inscrição foi atualizada, mas não foi possível enviar DM para o usuário.",
      );

      await dispatchBotLog(context, {
        type: "creator_application_dm_failed",
        discordUserId: updatedApplication.discord_id,
        discordUsername: updatedApplication.discord_name,
        channelId: updatedApplication.review_channel_id ?? interaction.channelId,
        applicationId: updatedApplication.id,
        actionBy: interaction.user.id,
        status: "failed",
        message: "A inscrição foi atualizada, mas a DM não pôde ser enviada.",
        errorMessage,
      });
    }
  } else {
    warnings.push("A inscrição foi atualizada, mas o Discord ID não está cadastrado.");
  }

  if (input.decision === "approved" && updatedApplication.discord_id) {
    try {
      await addApprovedRoleToMember(context, interaction, updatedApplication.discord_id);
      await dispatchBotLog(context, {
        type: "creator_application_role_added",
        discordUserId: updatedApplication.discord_id,
        discordUsername: updatedApplication.discord_name,
        channelId: updatedApplication.review_channel_id ?? interaction.channelId,
        applicationId: updatedApplication.id,
        actionBy: interaction.user.id,
        status: "success",
        message: "Cargo de creator aprovado adicionado com sucesso.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      warnings.push(
        "A inscrição foi aprovada, mas não foi possível adicionar o cargo automaticamente.",
      );

      await dispatchBotLog(context, {
        type: "creator_application_role_failed",
        discordUserId: updatedApplication.discord_id,
        discordUsername: updatedApplication.discord_name,
        channelId: updatedApplication.review_channel_id ?? interaction.channelId,
        applicationId: updatedApplication.id,
        actionBy: interaction.user.id,
        status: "failed",
        message: "A inscrição foi aprovada, mas houve falha ao adicionar o cargo.",
        errorMessage,
      });
    }
  }

  await syncReviewMessageInDiscord(
    context,
    updatedApplication.id,
    "message" in interaction ? interaction.message : null,
  );

  return {
    application: updatedApplication,
    warnings,
  };
}

export async function handleCreatorApplicationStart(
  context: BotContext,
  interaction: ButtonInteraction,
) {
  try {
    await dispatchBotLog(context, {
      type: "creator_form_started",
      discordUserId: interaction.user.id,
      discordUsername: interaction.user.tag,
      channelId: interaction.channelId,
      status: "info",
      message: `${interaction.user.tag} iniciou o formulário de inscrição.`,
    });

    await interaction.showModal(buildCreatorApplicationModal());
  } catch (error) {
    logBotError("Falha ao abrir o formulário de inscrição.", error);

    if (interaction.replied || interaction.deferred) {
      return;
    }

    await interaction.reply({
      content: "Não foi possível abrir o formulário agora. Tente novamente.",
      ephemeral: true,
    });
  }
}

export async function handleCreatorApplicationSubmit(
  context: BotContext,
  interaction: ModalSubmitInteraction,
) {
  if (!interaction.inCachedGuild()) {
    await interaction.reply({
      content: "Este formulário só pode ser usado dentro do servidor oficial.",
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const cityName = interaction.fields.getTextInputValue("city_name").trim();
  const category = interaction.fields.getTextInputValue("category").trim();
  const socialLinks = interaction.fields.getTextInputValue("social_links").trim();
  const frequency = interaction.fields.getTextInputValue("frequency").trim();
  const reason = interaction.fields.getTextInputValue("reason").trim();
  const member = interaction.member;
  const displayName = isGuildMember(member)
    ? member.displayName
    : interaction.user.globalName ?? interaction.user.username;

  try {
    const application = await createCreatorApplicationRecord(context.supabase, {
      name: displayName,
      discordName: interaction.user.tag,
      discordId: interaction.user.id,
      cityName,
      age: null,
      category,
      frequency,
      reason,
      contentLinks: socialLinks,
      observations: "Inscrição enviada pelo formulário oficial do Discord.",
      source: "discord",
    });

    await dispatchBotLog(context, {
      type: "creator_application_submitted",
      discordUserId: interaction.user.id,
      discordUsername: interaction.user.tag,
      channelId: interaction.channelId,
      applicationId: application.id,
      status: "success",
      message: `Inscrição enviada por ${interaction.user.tag}.`,
    });

    try {
      const reviewChannel = await getReviewChannel(context, interaction.guild.id);
      const reviewMessage = await reviewChannel.send(
        buildCreatorApplicationReviewPayload({
          application,
          status: "pending",
          disableActions: false,
        }),
      );

      await updateCreatorApplicationReviewMessage(context.supabase, {
        applicationId: application.id,
        reviewChannelId: reviewChannel.id,
        reviewMessageId: reviewMessage.id,
      });

      await dispatchBotLog(context, {
        type: "creator_application_sent_to_review_channel",
        discordUserId: interaction.user.id,
        discordUsername: interaction.user.tag,
        channelId: reviewChannel.id,
        applicationId: application.id,
        status: "success",
        message: "Inscrição enviada ao canal de formulários para análise.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      await dispatchBotLog(context, {
        type: "creator_application_sent_to_review_channel",
        discordUserId: interaction.user.id,
        discordUsername: interaction.user.tag,
        channelId: context.config.creatorFormSubmissionsChannelId,
        applicationId: application.id,
        status: "failed",
        message: "A inscrição foi salva, mas não foi enviada ao canal de análise.",
        errorMessage,
      });

      logBotError("Falha ao enviar a inscrição para o canal de análise.", error);
    }

    await interaction.editReply({
      content: "Sua inscrição foi enviada para análise da equipe Creators Coliseu.",
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    await dispatchBotLog(context, {
      type: "creator_application_submitted",
      discordUserId: interaction.user.id,
      discordUsername: interaction.user.tag,
      channelId: interaction.channelId,
      status: "failed",
      message: "Falha ao salvar a inscrição enviada pelo Discord.",
      errorMessage,
    });

    logBotError("Falha ao salvar inscrição enviada pelo formulário do Discord.", error);

    await interaction.editReply({
      content:
        "Não foi possível enviar sua inscrição no momento. Procure a equipe Creators Coliseu.",
    });
  }
}

export async function handleCreatorApplicationApprove(
  context: BotContext,
  interaction: ButtonInteraction,
  applicationId: string,
) {
  if (!interaction.inCachedGuild() || !canReviewApplications(context, interaction.member)) {
    await interaction.reply({
      content: "Você não tem permissão para analisar inscrições.",
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    const result = await finalizeDiscordApplicationReview(context, interaction, {
      applicationId,
      decision: "approved",
    });

    await interaction.editReply({
      content:
        result.warnings.length > 0
          ? `Inscrição aprovada com sucesso. ${result.warnings.join(" ")}`
          : "Inscrição aprovada com sucesso.",
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logBotError("Falha ao aprovar inscrição pelo Discord.", error);

    if (interaction.replied || interaction.deferred) {
      await interaction.editReply({
        content: errorMessage,
      });
      return;
    }

    await interaction.reply({
      content: errorMessage,
      ephemeral: true,
    });
  }
}

export async function handleCreatorApplicationRejectButton(
  context: BotContext,
  interaction: ButtonInteraction,
  applicationId: string,
) {
  if (!interaction.inCachedGuild() || !canReviewApplications(context, interaction.member)) {
    await interaction.reply({
      content: "Você não tem permissão para analisar inscrições.",
      ephemeral: true,
    });
    return;
  }

  try {
    const application = await findCreatorApplicationById(context.supabase, applicationId, {
      fallbackToMemory: false,
    });

    if (!application) {
      await interaction.reply({
        content: "Inscrição não encontrada.",
        ephemeral: true,
      });
      return;
    }

    if (application.status !== "pending") {
      await interaction.reply({
        content: "Esta inscrição já foi analisada.",
        ephemeral: true,
      });
      return;
    }

    await interaction.showModal(buildRejectReasonModal(applicationId));
  } catch (error) {
    logBotError("Falha ao abrir o modal de negação da inscrição.", error);

    await interaction.reply({
      content: "Não foi possível abrir o motivo da negação agora.",
      ephemeral: true,
    });
  }
}

export async function handleCreatorApplicationRejectSubmit(
  context: BotContext,
  interaction: ModalSubmitInteraction,
  applicationId: string,
) {
  if (!interaction.inCachedGuild() || !canReviewApplications(context, interaction.member)) {
    await interaction.reply({
      content: "Você não tem permissão para analisar inscrições.",
      ephemeral: true,
    });
    return;
  }

  const rejectionReason = interaction.fields
    .getTextInputValue(CREATOR_APPLICATION_REJECT_REASON_FIELD_ID)
    .trim();

  if (rejectionReason.length < 5) {
    await interaction.reply({
      content: "Informe o motivo da negação.",
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    const result = await finalizeDiscordApplicationReview(context, interaction, {
      applicationId,
      decision: "rejected",
      rejectionReason,
    });

    await interaction.editReply({
      content:
        result.warnings.length > 0
          ? `Inscrição negada com sucesso. ${result.warnings.join(" ")}`
          : "Inscrição negada com sucesso.",
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logBotError("Falha ao negar inscrição pelo Discord.", error);

    await interaction.editReply({
      content: errorMessage,
    });
  }
}

export function resolveCreatorApplicationApproveId(customId: string) {
  return extractCreatorApplicationIdFromCustomId(customId, CREATOR_APPLICATION_APPROVE_PREFIX);
}

export function resolveCreatorApplicationRejectId(customId: string) {
  return extractCreatorApplicationIdFromCustomId(customId, CREATOR_APPLICATION_REJECT_PREFIX);
}

export function resolveCreatorApplicationRejectModalId(customId: string) {
  return extractCreatorApplicationIdFromCustomId(
    customId,
    CREATOR_APPLICATION_REJECT_MODAL_PREFIX,
  );
}
