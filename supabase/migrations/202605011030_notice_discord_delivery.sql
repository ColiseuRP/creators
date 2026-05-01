alter type public.discord_log_status add value if not exists 'pending';

alter table public.creator_notices
  add column if not exists discord_status public.discord_log_status,
  add column if not exists discord_channel_id text,
  add column if not exists discord_error_message text,
  add column if not exists discord_last_attempt_at timestamptz,
  add column if not exists discord_sent_at timestamptz;

alter table public.discord_message_logs
  add column if not exists notice_id uuid references public.creator_notices(id) on delete set null,
  add column if not exists attempted_at timestamptz not null default timezone('utc', now()),
  add column if not exists delivered_at timestamptz;

alter table public.discord_message_logs
  alter column status set default 'pending';

update public.creator_notices
set
  discord_status = case
    when send_to_discord then 'skipped'::public.discord_log_status
    else null
  end,
  discord_channel_id = coalesce(discord_channel_id, null),
  discord_error_message = coalesce(discord_error_message, null),
  discord_last_attempt_at = coalesce(discord_last_attempt_at, null),
  discord_sent_at = coalesce(discord_sent_at, null)
where
  discord_status is null;

update public.discord_message_logs
set attempted_at = sent_at
where attempted_at is null;

update public.discord_message_logs
set delivered_at = sent_at
where delivered_at is null
  and status = 'sent';

create index if not exists discord_message_logs_notice_id_idx
  on public.discord_message_logs(notice_id);

create index if not exists discord_message_logs_attempted_at_idx
  on public.discord_message_logs(attempted_at desc);
