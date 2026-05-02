do $$
begin
  create type public.creator_ticket_status as enum ('open', 'closed', 'archived');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.creator_tickets (
  id uuid primary key default gen_random_uuid(),
  discord_user_id text not null,
  discord_username text not null,
  channel_id text not null unique,
  status public.creator_ticket_status not null default 'open',
  created_at timestamptz not null default timezone('utc', now()),
  closed_at timestamptz,
  closed_by text,
  close_reason text
);

create table if not exists public.discord_panels (
  id uuid primary key default gen_random_uuid(),
  type text not null unique check (type in ('creator_ticket_panel')),
  channel_id text not null,
  message_id text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.discord_bot_logs (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  discord_user_id text,
  channel_id text,
  status text not null check (status in ('success', 'failed', 'info')),
  message text not null,
  error_message text,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists creator_tickets_open_user_idx
  on public.creator_tickets(discord_user_id)
  where status = 'open';

create index if not exists creator_tickets_status_idx
  on public.creator_tickets(status, created_at desc);

create index if not exists creator_tickets_channel_id_idx
  on public.creator_tickets(channel_id);

create index if not exists discord_bot_logs_created_at_idx
  on public.discord_bot_logs(created_at desc);

alter table public.creator_tickets enable row level security;
alter table public.discord_panels enable row level security;
alter table public.discord_bot_logs enable row level security;

drop policy if exists "Staff can view creator tickets" on public.creator_tickets;
create policy "Staff can view creator tickets"
  on public.creator_tickets
  for select
  to authenticated
  using (public.is_staff());

drop policy if exists "Staff can manage creator tickets" on public.creator_tickets;
create policy "Staff can manage creator tickets"
  on public.creator_tickets
  for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists "Creators can view own creator tickets" on public.creator_tickets;
create policy "Creators can view own creator tickets"
  on public.creator_tickets
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.user_id = auth.uid()
        and p.discord_id = creator_tickets.discord_user_id
    )
  );

drop policy if exists "Staff can view discord panels" on public.discord_panels;
create policy "Staff can view discord panels"
  on public.discord_panels
  for select
  to authenticated
  using (public.is_staff());

drop policy if exists "Staff can manage discord panels" on public.discord_panels;
create policy "Staff can manage discord panels"
  on public.discord_panels
  for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists "Staff can view discord bot logs" on public.discord_bot_logs;
create policy "Staff can view discord bot logs"
  on public.discord_bot_logs
  for select
  to authenticated
  using (public.is_staff());

drop policy if exists "Staff can insert discord bot logs" on public.discord_bot_logs;
create policy "Staff can insert discord bot logs"
  on public.discord_bot_logs
  for insert
  to authenticated
  with check (public.is_staff());
