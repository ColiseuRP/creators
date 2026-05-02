import "server-only";

import { getServerEnvValue } from "@/lib/server-env";

interface DiscordApiResult<T> {
  success: boolean;
  data: T | null;
  errorMessage: string | null;
}

function buildDiscordDetailSuffix(
  detail: {
    message?: string;
    code?: number | string;
  } | null,
) {
  if (!detail?.message && !detail?.code) {
    return "";
  }

  const parts = [detail.message, detail.code ? `código ${detail.code}` : null].filter(
    Boolean,
  );

  return parts.length > 0 ? ` (${parts.join(" / ")})` : "";
}

function parseDiscordFailureDetail(rawBody: string) {
  if (!rawBody) {
    return null;
  }

  try {
    return JSON.parse(rawBody) as {
      message?: string;
      code?: number | string;
    };
  } catch {
    return {
      message: rawBody.slice(0, 400),
    };
  }
}

function parseDiscordApiFailure(
  status: number,
  rawBody: string,
  context: "message" | "dm" | "role",
) {
  const detail = parseDiscordFailureDetail(rawBody);
  const suffix = buildDiscordDetailSuffix(detail);

  if (status === 401) {
    return `Token do Discord não configurado ou inválido.${suffix}`;
  }

  if (status === 403 || detail?.code === 50001 || detail?.code === 50013) {
    if (context === "role") {
      return `O bot não tem permissão para adicionar o cargo automaticamente.${suffix}`;
    }

    if (context === "dm") {
      return `Não foi possível enviar a mensagem privada no Discord.${suffix}`;
    }

    return `O bot não tem permissão para enviar mensagens neste canal.${suffix}`;
  }

  if (status === 404 || detail?.code === 10003) {
    if (context === "role") {
      return `O cargo ou o membro não foi encontrado no servidor.${suffix}`;
    }

    if (context === "dm") {
      return `Usuário não encontrado para enviar mensagem privada.${suffix}`;
    }

    return `Canal não encontrado no servidor.${suffix}`;
  }

  if (detail?.code === 50007) {
    return "Não foi possível enviar a mensagem privada no Discord.";
  }

  if (status >= 500) {
    return "Não foi possível conectar ao Discord. Tente novamente.";
  }

  if (context === "role") {
    return `Não foi possível adicionar o cargo automaticamente.${suffix}`;
  }

  if (context === "dm") {
    return `Não foi possível enviar a mensagem privada no Discord.${suffix}`;
  }

  return `O Discord recusou a ação solicitada.${suffix}`;
}

async function requestDiscord<T>(
  path: string,
  init: RequestInit,
  context: "message" | "dm" | "role",
): Promise<DiscordApiResult<T>> {
  const token = getServerEnvValue("DISCORD_BOT_TOKEN");

  if (!token) {
    return {
      success: false,
      data: null,
      errorMessage: "Token do Discord não configurado.",
    };
  }

  try {
    const response = await fetch(`https://discord.com/api/v10${path}`, {
      ...init,
      headers: {
        Authorization: `Bot ${token}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });

    if (!response.ok) {
      const rawBody = await response.text();

      return {
        success: false,
        data: null,
        errorMessage: parseDiscordApiFailure(response.status, rawBody, context),
      };
    }

    if (response.status === 204) {
      return {
        success: true,
        data: null,
        errorMessage: null,
      };
    }

    const payload = (await response.json()) as T;

    return {
      success: true,
      data: payload,
      errorMessage: null,
    };
  } catch (error) {
    console.error("[discord-admin] Falha ao executar requisição ao Discord.", {
      path,
      error,
    });

    return {
      success: false,
      data: null,
      errorMessage: "Não foi possível conectar ao Discord. Tente novamente.",
    };
  }
}

export async function upsertDiscordChannelMessage(
  channelId: string,
  payload: unknown,
  messageId?: string | null,
) {
  return requestDiscord<{ id?: string }>(
    messageId
      ? `/channels/${channelId}/messages/${messageId}`
      : `/channels/${channelId}/messages`,
    {
      method: messageId ? "PATCH" : "POST",
      body: JSON.stringify(payload),
    },
    "message",
  );
}

export async function updateDiscordChannelMessage(
  channelId: string,
  messageId: string,
  payload: unknown,
) {
  return upsertDiscordChannelMessage(channelId, payload, messageId);
}

export async function sendDiscordDirectMessage(
  discordUserId: string,
  content: string,
) {
  const dmChannelResult = await requestDiscord<{ id?: string }>(
    "/users/@me/channels",
    {
      method: "POST",
      body: JSON.stringify({
        recipient_id: discordUserId,
      }),
    },
    "dm",
  );

  if (!dmChannelResult.success || !dmChannelResult.data?.id) {
    return {
      success: false,
      channelId: null,
      messageId: null,
      errorMessage:
        dmChannelResult.errorMessage ??
        "Não foi possível enviar a mensagem privada no Discord.",
    };
  }

  const messageResult = await requestDiscord<{ id?: string }>(
    `/channels/${dmChannelResult.data.id}/messages`,
    {
      method: "POST",
      body: JSON.stringify({
        content,
      }),
    },
    "dm",
  );

  return {
    success: messageResult.success,
    channelId: dmChannelResult.data.id,
    messageId: messageResult.data?.id ?? null,
    errorMessage: messageResult.errorMessage,
  };
}

export async function addDiscordMemberRole(
  discordUserId: string,
  roleId: string,
) {
  const guildId = getServerEnvValue("DISCORD_GUILD_ID");

  if (!guildId) {
    return {
      success: false,
      errorMessage: "Servidor do Discord não configurado.",
    };
  }

  const result = await requestDiscord<null>(
    `/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`,
    {
      method: "PUT",
      body: JSON.stringify({}),
    },
    "role",
  );

  return {
    success: result.success,
    errorMessage: result.errorMessage,
  };
}
