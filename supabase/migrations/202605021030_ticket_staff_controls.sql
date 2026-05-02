alter table if exists public.creator_tickets
  add column if not exists ticket_type text;

alter table if exists public.creator_tickets
  add column if not exists claimed_by text;

alter table if exists public.creator_tickets
  add column if not exists claimed_by_name text;

alter table if exists public.creator_tickets
  add column if not exists claimed_at timestamptz;

alter table if exists public.creator_tickets
  add column if not exists close_reason text;

alter table if exists public.creator_tickets
  add column if not exists closed_by text;

alter table if exists public.creator_tickets
  add column if not exists closed_at timestamptz;

alter table if exists public.discord_bot_logs
  add column if not exists ticket_id uuid references public.creator_tickets(id) on delete set null;

alter table if exists public.discord_bot_logs
  add column if not exists action_by text;

create index if not exists creator_tickets_claimed_at_idx
  on public.creator_tickets(claimed_at desc);

create index if not exists discord_bot_logs_ticket_id_idx
  on public.discord_bot_logs(ticket_id);

create index if not exists discord_bot_logs_action_by_idx
  on public.discord_bot_logs(action_by, created_at desc);
