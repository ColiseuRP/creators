import type { GuildMember } from "discord.js";

import type { BotContext } from "../types";
import { dispatchBotLog } from "../services/log-dispatcher";
import { logBotError, logBotInfo } from "../services/logger";

async function assignCitizenRole(context: BotContext, member: GuildMember) {
  if (member.guild.id !== context.config.guildId) {
    return;
  }

  try {
    await member.roles.add(context.config.citizenRoleId);

    const successMessage = `Cargo Cidadão adicionado para ${member.user.tag}.`;
    logBotInfo(successMessage);

    await dispatchBotLog(context, {
      type: "member_join_role_assigned",
      discordUserId: member.user.id,
      status: "success",
      message: successMessage,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const logMessage = `Não foi possível adicionar o cargo Cidadão para ${member.user.tag}: ${errorMessage}`;

    logBotError(logMessage, error);

    await dispatchBotLog(context, {
      type: "member_join_role_failed",
      discordUserId: member.user.id,
      status: "failed",
      message: `Falha ao adicionar o cargo Cidadão para ${member.user.tag}.`,
      errorMessage,
    });
  }
}

export function registerGuildMemberAddEvent(context: BotContext) {
  context.client.on("guildMemberAdd", async (member) => {
    await assignCitizenRole(context, member);
  });
}
