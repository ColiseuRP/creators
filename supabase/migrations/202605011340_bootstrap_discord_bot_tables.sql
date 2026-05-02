create table if not exists public.creator_tickets (
  id uuid primary key default gen_random_uuid(),
  discord_user_id text not null,
  discord_username text,
  channel_id text not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  closed_at timestamptz,
  closed_by text,
  close_reason text
);

create table if not exists public.discord_bot_logs (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  discord_user_id text,
  channel_id text,
  status text not null,
  message text not null,
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists public.discord_panels (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  channel_id text not null,
  message_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists creator_tickets_discord_user_id_idx
  on public.creator_tickets(discord_user_id);

create index if not exists creator_tickets_status_idx
  on public.creator_tickets(status);

create unique index if not exists creator_tickets_open_user_idx
  on public.creator_tickets(discord_user_id)
  where status = 'open';

create index if not exists discord_bot_logs_created_at_idx
  on public.discord_bot_logs(created_at desc);

create unique index if not exists discord_panels_type_idx
  on public.discord_panels(type);
