alter table if exists public.creator_tickets
  add column if not exists ticket_type text;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'creator_tickets'
  ) and not exists (
    select 1
    from pg_constraint
    where conname = 'creator_tickets_ticket_type_check'
  ) then
    alter table public.creator_tickets
      add constraint creator_tickets_ticket_type_check
      check (ticket_type is null or ticket_type in ('streamer', 'influencer'));
  end if;
end $$;

create index if not exists creator_tickets_ticket_type_idx
  on public.creator_tickets(ticket_type, created_at desc);

alter table if exists public.discord_bot_logs
  add column if not exists discord_username text;

alter table if exists public.discord_bot_logs
  add column if not exists ticket_type text;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'discord_bot_logs'
  ) and not exists (
    select 1
    from pg_constraint
    where conname = 'discord_bot_logs_ticket_type_check'
  ) then
    alter table public.discord_bot_logs
      add constraint discord_bot_logs_ticket_type_check
      check (ticket_type is null or ticket_type in ('streamer', 'influencer'));
  end if;
end $$;

create index if not exists discord_bot_logs_ticket_type_idx
  on public.discord_bot_logs(ticket_type, created_at desc);
