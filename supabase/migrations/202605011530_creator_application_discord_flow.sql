alter table public.creator_applications
  add column if not exists rejection_reason text,
  add column if not exists source text not null default 'site',
  add column if not exists reviewed_by_text text,
  add column if not exists reviewed_by_name text,
  add column if not exists review_channel_id text,
  add column if not exists review_message_id text;

update public.creator_applications
set source = 'site'
where source is null;

alter table public.creator_applications
  drop constraint if exists creator_applications_age_check;

alter table public.creator_applications
  alter column age drop not null;

alter table public.creator_applications
  add constraint creator_applications_age_check
  check (age is null or age >= 13);

alter table public.creator_applications
  drop constraint if exists creator_applications_source_check;

alter table public.creator_applications
  add constraint creator_applications_source_check
  check (source in ('site', 'discord'));

create index if not exists creator_applications_source_idx
  on public.creator_applications(source);

create index if not exists creator_applications_reviewed_at_idx
  on public.creator_applications(reviewed_at desc);

alter table public.discord_bot_logs
  add column if not exists application_id uuid references public.creator_applications(id) on delete set null,
  add column if not exists action_by text;

alter table public.discord_panels
  drop constraint if exists discord_panels_type_check;

alter table public.discord_panels
  add constraint discord_panels_type_check
  check (type in ('creator_ticket_panel', 'creator_application_form_panel'));
