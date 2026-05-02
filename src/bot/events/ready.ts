import { botCommands } from "../commands";
import { logBotInfo, logBotWarn } from "../services/logger";
import type { BotContext } from "../types";

export function registerReadyEvent(context: BotContext) {
  context.client.once("clientReady", () => {
    logBotInfo(`Bot Creators Coliseu online como ${context.client.user?.tag ?? "bot"}`);
    logBotInfo("Auto cargo Cidadão ativado.");
    logBotInfo("Sistema de tickets carregado.");
    logBotInfo("Painel de tickets pronto para publicação.");
    logBotInfo("Formulário de inscrição carregado.");
    logBotInfo("Painel do formulário pronto para publicação.");

    if (!context.supabase) {
      logBotWarn(
        "Supabase não configurado para o bot. Tickets, painéis e logs usarão fallback em memória nesta sessão.",
      );
    }

    if (
      context.config.staffRoleIds.length === 1 &&
      context.config.staffRoleIds[0] === context.config.responsavelStaffRoleId
    ) {
      logBotWarn(
        "Apenas o cargo responsável principal está configurado para os tickets. Preencha DISCORD_STAFF_ROLE_IDS caso queira liberar outros cargos da equipe.",
      );
    }

    if (context.config.generalCreatorsChannelId === context.config.noticesChannelId) {
      logBotInfo(
        "Canal geral dos creators não configurado separadamente. O canal de avisos será usado como compatibilidade.",
      );
    }

    if (botCommands.length > 0) {
      logBotInfo(
        `Comandos preparados para futura expansão: ${botCommands
          .map((command) => command.name)
          .join(", ")}`,
      );
    }
  });
}
