import { setTimeout as delay } from "node:timers/promises";

import type { ChatInputCommandInteraction } from "discord.js";

import { dispatchBotLog } from "../services/log-dispatcher";
import { logBotError, logBotInfo } from "../services/logger";
import type { BotContext } from "../types";

const CREATOR_DM_DELAY_MS = 1500;

function buildCreatorsBroadcastMessage(noticesChannelId: string) {
  return [
    "📢 Aviso importante — Creators Coliseu",
    "",
    "Olá!",
    "",
    `Há uma mensagem importante para todos os creators no canal <#${noticesChannelId}>.`,
    "",
    "Por favor, acesse o canal e confira as informações assim que possível.",
    "",
    "Atenciosamente,",
    "Equipe Coliseu RP",
  ].join("\n");
}

export async function handleAvisarCreatorsCommand(
  context: BotContext,
  interaction: ChatInputCommandInteraction,
) {
  if (!interaction.inCachedGuild()) {
    await interaction.reply({
      content: "Este comando só pode ser usado dentro do servidor configurado.",
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    await interaction.editReply({
      content: "Envio iniciado. O bot enviará a mensagem para os creators aprovados.",
    });

    logBotInfo("[Creators Coliseu] Iniciando envio de DM para creators aprovados.");

    await dispatchBotLog(context, {
      type: "creators_dm_broadcast_started",
      channelId: context.config.noticesChannelId,
      actionBy: interaction.user.id,
      status: "info",
      message: "Início do envio de DM para creators aprovados.",
    });

    const approvedRole = await interaction.guild.roles.fetch(
      context.config.approvedCreatorRoleId,
    );

    if (!approvedRole) {
      await interaction.editReply({
        content: "O cargo de creators aprovados não foi encontrado no servidor.",
      });
      return;
    }

    await interaction.guild.members.fetch();

    const approvedMembers = approvedRole.members.filter((member) => !member.user.bot);

    let sentCount = 0;
    let failedCount = 0;
    const totalFound = approvedMembers.size;
    const message = buildCreatorsBroadcastMessage(context.config.noticesChannelId);

    for (const member of approvedMembers.values()) {
      try {
        await member.send(message);
        sentCount += 1;

        logBotInfo(`[Creators Coliseu] DM enviada para ${member.user.tag}`);

        await dispatchBotLog(context, {
          type: "creators_dm_sent",
          discordUserId: member.user.id,
          discordUsername: member.user.tag,
          channelId: context.config.noticesChannelId,
          actionBy: interaction.user.id,
          status: "success",
          message: `DM enviada para ${member.user.tag}.`,
        });
      } catch (error) {
        failedCount += 1;

        const errorMessage = error instanceof Error ? error.message : String(error);

        logBotError(
          `[Creators Coliseu] Falha ao enviar DM para ${member.user.tag}: ${errorMessage}`,
          error,
        );

        await dispatchBotLog(context, {
          type: "creators_dm_failed",
          discordUserId: member.user.id,
          discordUsername: member.user.tag,
          channelId: context.config.noticesChannelId,
          actionBy: interaction.user.id,
          status: "failed",
          message: `Falha ao enviar DM para ${member.user.tag}.`,
          errorMessage,
        });
      }

      await delay(CREATOR_DM_DELAY_MS);
    }

    logBotInfo(
      `[Creators Coliseu] Envio finalizado. Enviados: ${sentCount} | Falharam: ${failedCount}`,
    );

    await dispatchBotLog(context, {
      type: "creators_dm_broadcast_finished",
      channelId: context.config.noticesChannelId,
      actionBy: interaction.user.id,
      status: "success",
      message: `Envio finalizado. Enviados: ${sentCount} | Falharam: ${failedCount} | Total encontrado: ${totalFound}`,
    });

    await interaction.editReply({
      content: [
        "Envio finalizado.",
        `Enviados: ${sentCount}`,
        `Falharam: ${failedCount}`,
        `Total encontrado: ${totalFound}`,
      ].join("\n"),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logBotError("[Creators Coliseu] Falha ao iniciar o envio de DM para creators aprovados.", error);

    await dispatchBotLog(context, {
      type: "creators_dm_broadcast_finished",
      channelId: context.config.noticesChannelId,
      actionBy: interaction.user.id,
      status: "failed",
      message: "Falha ao concluir o envio de DM para creators aprovados.",
      errorMessage,
    });

    await interaction.editReply({
      content: "Não foi possível concluir o envio das mensagens no momento.",
    });
  }
}
