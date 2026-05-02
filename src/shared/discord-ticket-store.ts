import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  CreatorTicket,
  CreatorTicketStatus,
  DiscordBotLog,
  DiscordPanel,
  DiscordPanelType,
  DiscordTicketSnapshot,
} from "../lib/types";

type DatabaseClient = SupabaseClient | null;

interface StoreReadOptions {
  fallbackToMemory?: boolean;
}

interface CreateCreatorTicketInput {
  discordUserId: string;
  discordUsername: string;
  channelId: string;
}

interface CloseCreatorTicketInput {
  channelId: string;
  status: Extract<CreatorTicketStatus, "closed" | "archived">;
  closedBy: string | null;
  closeReason?: string | null;
}

interface UpsertDiscordPanelInput {
  type: DiscordPanelType;
  channelId: string;
  messageId: string;
}

interface CreateDiscordBotLogInput {
  type: string;
  discordUserId?: string | null;
  channelId?: string | null;
  status: DiscordBotLog["status"];
  message: string;
  errorMessage?: string | null;
}

const memoryState: {
  tickets: CreatorTicket[];
  panels: DiscordPanel[];
  logs: DiscordBotLog[];
} = {
  tickets: [
    {
      id: "mock-ticket-open-1",
      discord_user_id: "333333333333333333",
      discord_username: "luna.live",
      channel_id: "987654321000000010",
      status: "open",
      created_at: "2026-04-29T15:00:00.000Z",
      closed_at: null,
      closed_by: null,
      close_reason: null,
    },
    {
      id: "mock-ticket-closed-1",
      discord_user_id: "555555555555555555",
      discord_username: "pedroshorts",
      channel_id: "987654321000000011",
      status: "closed",
      created_at: "2026-04-25T13:10:00.000Z",
      closed_at: "2026-04-25T14:00:00.000Z",
      closed_by: "111111111111111111",
      close_reason: "Atendimento finalizado pela equipe.",
    },
  ],
  panels: [
    {
      id: "mock-panel-1",
      type: "creator_ticket_panel",
      channel_id: "1447948746670477469",
      message_id: "1448000000000000001",
      created_at: "2026-04-28T12:00:00.000Z",
      updated_at: "2026-04-29T08:30:00.000Z",
    },
  ],
  logs: [
    {
      id: "mock-bot-log-1",
      type: "ticket_panel_published",
      discord_user_id: null,
      channel_id: "1447948746670477469",
      status: "success",
      message: "Painel de tickets publicado com sucesso.",
      error_message: null,
      created_at: "2026-04-29T08:30:00.000Z",
    },
  ],
};

function isMissingTableError(
  error: {
    code?: string | null;
    message?: string | null;
    details?: string | null;
    hint?: string | null;
  } | null,
) {
  return (
    error?.code === "42P01" ||
    error?.code === "PGRST205" ||
    error?.message?.includes("relation") ||
    error?.message?.includes("Could not find the table") ||
    error?.message?.includes("schema cache") ||
    error?.message?.includes("does not exist") ||
    error?.details?.includes("schema cache") ||
    error?.hint?.includes("schema cache") ||
    false
  );
}

function getNowIso() {
  return new Date().toISOString();
}

function createMemoryId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function listCreatorTickets(
  client: DatabaseClient,
  limit?: number,
  options?: StoreReadOptions,
) {
  const fallbackToMemory = options?.fallbackToMemory ?? true;

  if (!client) {
    const tickets = [...memoryState.tickets].sort((a, b) =>
      b.created_at.localeCompare(a.created_at),
    );
    return typeof limit === "number" ? tickets.slice(0, limit) : tickets;
  }

  let query = client
    .from("creator_tickets")
    .select("*")
    .order("created_at", { ascending: false });

  if (typeof limit === "number") {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    if (isMissingTableError(error)) {
      if (fallbackToMemory) {
        return listCreatorTickets(null, limit, options);
      }

      throw new Error(error.message);
    }

    throw new Error(error.message);
  }

  return (data ?? []) as CreatorTicket[];
}

export async function getCreatorTicketSnapshot(
  client: DatabaseClient,
  options?: StoreReadOptions,
): Promise<DiscordTicketSnapshot> {
  const tickets = await listCreatorTickets(client, undefined, options);
  const panel = await getDiscordPanelByType(client, "creator_ticket_panel", options);

  return {
    openCount: tickets.filter((ticket) => ticket.status === "open").length,
    closedCount: tickets.filter((ticket) => ticket.status === "closed").length,
    archivedCount: tickets.filter((ticket) => ticket.status === "archived").length,
    totalCount: tickets.length,
    recentTickets: tickets.slice(0, 5),
    panel,
  };
}

export async function findOpenCreatorTicketByDiscordUser(
  client: DatabaseClient,
  discordUserId: string,
) {
  if (!client) {
    return (
      memoryState.tickets.find(
        (ticket) => ticket.discord_user_id === discordUserId && ticket.status === "open",
      ) ?? null
    );
  }

  const { data, error } = await client
    .from("creator_tickets")
    .select("*")
    .eq("discord_user_id", discordUserId)
    .eq("status", "open")
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error)) {
      return findOpenCreatorTicketByDiscordUser(null, discordUserId);
    }

    throw new Error(error.message);
  }

  return (data as CreatorTicket | null) ?? null;
}

export async function findCreatorTicketByChannelId(client: DatabaseClient, channelId: string) {
  if (!client) {
    return memoryState.tickets.find((ticket) => ticket.channel_id === channelId) ?? null;
  }

  const { data, error } = await client
    .from("creator_tickets")
    .select("*")
    .eq("channel_id", channelId)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error)) {
      return findCreatorTicketByChannelId(null, channelId);
    }

    throw new Error(error.message);
  }

  return (data as CreatorTicket | null) ?? null;
}

export async function createCreatorTicketRecord(
  client: DatabaseClient,
  input: CreateCreatorTicketInput,
) {
  if (!client) {
    const ticket: CreatorTicket = {
      id: createMemoryId("ticket"),
      discord_user_id: input.discordUserId,
      discord_username: input.discordUsername,
      channel_id: input.channelId,
      status: "open",
      created_at: getNowIso(),
      closed_at: null,
      closed_by: null,
      close_reason: null,
    };

    memoryState.tickets.unshift(ticket);
    return ticket;
  }

  const { data, error } = await client
    .from("creator_tickets")
    .insert({
      discord_user_id: input.discordUserId,
      discord_username: input.discordUsername,
      channel_id: input.channelId,
      status: "open",
    })
    .select("*")
    .single();

  if (error) {
    if (isMissingTableError(error)) {
      return createCreatorTicketRecord(null, input);
    }

    throw new Error(error.message);
  }

  return data as CreatorTicket;
}

export async function closeCreatorTicketRecord(
  client: DatabaseClient,
  input: CloseCreatorTicketInput,
) {
  if (!client) {
    const current = memoryState.tickets.find((ticket) => ticket.channel_id === input.channelId);

    if (!current) {
      return null;
    }

    current.status = input.status;
    current.closed_at = getNowIso();
    current.closed_by = input.closedBy;
    current.close_reason = input.closeReason ?? null;

    return current;
  }

  const { data, error } = await client
    .from("creator_tickets")
    .update({
      status: input.status,
      closed_at: getNowIso(),
      closed_by: input.closedBy,
      close_reason: input.closeReason ?? null,
    })
    .eq("channel_id", input.channelId)
    .select("*")
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error)) {
      return closeCreatorTicketRecord(null, input);
    }

    throw new Error(error.message);
  }

  return (data as CreatorTicket | null) ?? null;
}

export async function getDiscordPanelByType(
  client: DatabaseClient,
  type: DiscordPanelType,
  options?: StoreReadOptions,
) {
  const fallbackToMemory = options?.fallbackToMemory ?? true;

  if (!client) {
    return memoryState.panels.find((panel) => panel.type === type) ?? null;
  }

  const { data, error } = await client
    .from("discord_panels")
    .select("*")
    .eq("type", type)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error)) {
      if (fallbackToMemory) {
        return getDiscordPanelByType(null, type, options);
      }

      throw new Error(error.message);
    }

    throw new Error(error.message);
  }

  return (data as DiscordPanel | null) ?? null;
}

export async function upsertDiscordPanelRecord(
  client: DatabaseClient,
  input: UpsertDiscordPanelInput,
) {
  if (!client) {
    const current = memoryState.panels.find((panel) => panel.type === input.type);

    if (current) {
      current.channel_id = input.channelId;
      current.message_id = input.messageId;
      current.updated_at = getNowIso();
      return current;
    }

    const panel: DiscordPanel = {
      id: createMemoryId("panel"),
      type: input.type,
      channel_id: input.channelId,
      message_id: input.messageId,
      created_at: getNowIso(),
      updated_at: getNowIso(),
    };

    memoryState.panels.push(panel);
    return panel;
  }

  const existing = await getDiscordPanelByType(client, input.type);

  if (existing) {
    const { data, error } = await client
      .from("discord_panels")
      .update({
        channel_id: input.channelId,
        message_id: input.messageId,
        updated_at: getNowIso(),
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) {
      if (isMissingTableError(error)) {
        return upsertDiscordPanelRecord(null, input);
      }

      throw new Error(error.message);
    }

    return data as DiscordPanel;
  }

  const { data, error } = await client
    .from("discord_panels")
    .insert({
      type: input.type,
      channel_id: input.channelId,
      message_id: input.messageId,
    })
    .select("*")
    .single();

  if (error) {
    if (isMissingTableError(error)) {
      return upsertDiscordPanelRecord(null, input);
    }

    throw new Error(error.message);
  }

  return data as DiscordPanel;
}

export async function createDiscordBotLogRecord(
  client: DatabaseClient,
  input: CreateDiscordBotLogInput,
) {
  if (!client) {
    const log: DiscordBotLog = {
      id: createMemoryId("bot-log"),
      type: input.type,
      discord_user_id: input.discordUserId ?? null,
      channel_id: input.channelId ?? null,
      status: input.status,
      message: input.message,
      error_message: input.errorMessage ?? null,
      created_at: getNowIso(),
    };

    memoryState.logs.unshift(log);
    return log;
  }

  const { data, error } = await client
    .from("discord_bot_logs")
    .insert({
      type: input.type,
      discord_user_id: input.discordUserId ?? null,
      channel_id: input.channelId ?? null,
      status: input.status,
      message: input.message,
      error_message: input.errorMessage ?? null,
    })
    .select("*")
    .single();

  if (error) {
    if (isMissingTableError(error)) {
      return createDiscordBotLogRecord(null, input);
    }

    throw new Error(error.message);
  }

  return data as DiscordBotLog;
}
