create extension if not exists pgcrypto;
create extension if not exists unaccent;

do $$
begin
  create type public.app_role as enum ('admin_general', 'responsavel_creators', 'creator');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.creator_status as enum ('active', 'pending', 'paused');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.application_status as enum ('pending', 'approved', 'rejected');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.metric_status as enum ('pending', 'approved', 'rejected');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.notice_type as enum ('info', 'success', 'warning');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.notice_target_type as enum ('individual', 'general', 'category');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.discord_target_type as enum ('individual', 'general', 'category', 'metric_review');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.discord_log_status as enum ('sent', 'failed', 'skipped');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null,
  discord_name text,
  discord_id text,
  role public.app_role not null default 'creator',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.creators (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  name text not null,
  city_name text not null,
  category text not null,
  status public.creator_status not null default 'pending',
  avatar_url text,
  bio text,
  discord_channel_id text,
  joined_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.creator_rooms (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null unique references public.creators(id) on delete cascade,
  slug text not null unique,
  title text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.creator_applications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  discord_name text not null,
  discord_id text not null,
  city_name text not null,
  age integer not null check (age >= 13),
  category text not null,
  twitch_url text,
  tiktok_url text,
  youtube_url text,
  instagram_url text,
  frequency text not null,
  reason text not null,
  content_links text,
  observations text,
  status public.application_status not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null
);

create table if not exists public.metric_submissions (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creators(id) on delete cascade,
  platform text not null,
  content_type text not null,
  content_url text not null,
  content_date date not null,
  views integer not null default 0 check (views >= 0),
  likes integer not null default 0 check (likes >= 0),
  comments integer not null default 0 check (comments >= 0),
  shares integer not null default 0 check (shares >= 0),
  average_viewers integer check (average_viewers >= 0),
  live_duration numeric(8, 2) check (live_duration is null or live_duration >= 0),
  status public.metric_status not null default 'pending',
  creator_observation text,
  admin_observation text,
  rejection_reason text,
  submitted_at timestamptz not null default timezone('utc', now()),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null
);

create table if not exists public.metric_attachments (
  id uuid primary key default gen_random_uuid(),
  metric_submission_id uuid not null references public.metric_submissions(id) on delete cascade,
  file_url text not null,
  file_name text not null,
  file_type text not null,
  uploaded_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.creator_notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  type public.notice_type not null default 'info',
  target_type public.notice_target_type not null default 'general',
  target_creator_id uuid references public.creators(id) on delete set null,
  target_category text,
  sent_by uuid references public.profiles(id) on delete set null,
  send_to_discord boolean not null default false,
  sent_at timestamptz not null default timezone('utc', now()),
  constraint creator_notices_target_check check (
    (target_type = 'individual' and target_creator_id is not null)
    or (target_type = 'category' and target_category is not null)
    or (target_type = 'general')
  )
);

create table if not exists public.discord_settings (
  id uuid primary key default gen_random_uuid(),
  guild_id text not null,
  creators_category_id text not null,
  general_creators_channel_id text not null,
  auto_send_enabled boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.discord_message_logs (
  id uuid primary key default gen_random_uuid(),
  target_type public.discord_target_type not null,
  target_creator_id uuid references public.creators(id) on delete set null,
  channel_id text,
  message_type text not null,
  status public.discord_log_status not null default 'sent',
  error_message text,
  sent_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.metric_reviews (
  id uuid primary key default gen_random_uuid(),
  metric_submission_id uuid not null references public.metric_submissions(id) on delete cascade,
  reviewed_by uuid references public.profiles(id) on delete set null,
  decision public.metric_status not null,
  reason text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint metric_reviews_decision_check check (decision in ('approved', 'rejected'))
);

create index if not exists profiles_user_id_idx on public.profiles(user_id);
create index if not exists creators_profile_id_idx on public.creators(profile_id);
create index if not exists creators_status_idx on public.creators(status);
create index if not exists metric_submissions_creator_id_idx on public.metric_submissions(creator_id);
create index if not exists metric_submissions_status_idx on public.metric_submissions(status);
create index if not exists metric_attachments_metric_id_idx on public.metric_attachments(metric_submission_id);
create index if not exists metric_reviews_metric_id_idx on public.metric_reviews(metric_submission_id);
create index if not exists creator_notices_target_creator_idx on public.creator_notices(target_creator_id);
create index if not exists creator_notices_sent_at_idx on public.creator_notices(sent_at desc);
create index if not exists discord_message_logs_target_creator_idx on public.discord_message_logs(target_creator_id);
create index if not exists discord_message_logs_sent_at_idx on public.discord_message_logs(sent_at desc);
create index if not exists creator_applications_status_idx on public.creator_applications(status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, name, discord_name, discord_id, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1), 'Novo usuário'),
    new.raw_user_meta_data ->> 'discord_name',
    new.raw_user_meta_data ->> 'discord_id',
    'creator'
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create or replace function public.create_default_creator_room()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  generated_slug text;
begin
  generated_slug := regexp_replace(
    lower(unaccent(coalesce(new.name, 'creator'))),
    '[^a-z0-9]+',
    '-',
    'g'
  );

  generated_slug := trim(both '-' from generated_slug);

  if generated_slug = '' then
    generated_slug := 'creator-' || left(new.id::text, 8);
  end if;

  insert into public.creator_rooms (creator_id, slug, title, description)
  values (
    new.id,
    generated_slug || '-' || left(new.id::text, 6),
    'Sala de ' || new.name,
    'Sala individual criada automaticamente para o creator.'
  )
  on conflict (creator_id) do nothing;

  return new;
end;
$$;

create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.profiles
  where user_id = auth.uid()
  limit 1;
$$;

create or replace function public.current_creator_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select c.id
  from public.creators c
  join public.profiles p on p.id = c.profile_id
  where p.user_id = auth.uid()
  limit 1;
$$;

create or replace function public.current_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where user_id = auth.uid()
  limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role() = 'admin_general';
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role() in ('admin_general', 'responsavel_creators');
$$;

grant usage on schema public to anon, authenticated, service_role;
grant usage on schema storage to authenticated, service_role;
grant execute on function public.current_profile_id() to authenticated, service_role;
grant execute on function public.current_creator_id() to authenticated, service_role;
grant execute on function public.current_role() to authenticated, service_role;
grant execute on function public.is_admin() to authenticated, service_role;
grant execute on function public.is_staff() to authenticated, service_role;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.creators to authenticated;
grant select, insert, update, delete on public.creator_rooms to authenticated;
grant select, insert, update, delete on public.creator_applications to authenticated;
grant select, insert, update, delete on public.metric_submissions to authenticated;
grant select, insert, update, delete on public.metric_attachments to authenticated;
grant select, insert, update, delete on public.creator_notices to authenticated;
grant select, insert, update, delete on public.discord_settings to authenticated;
grant select, insert, update, delete on public.discord_message_logs to authenticated;
grant select, insert, update, delete on public.metric_reviews to authenticated;
grant insert on public.creator_applications to anon;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

drop trigger if exists creator_rooms_set_updated_at on public.creator_rooms;
create trigger creator_rooms_set_updated_at
  before update on public.creator_rooms
  for each row execute procedure public.set_updated_at();

drop trigger if exists discord_settings_set_updated_at on public.discord_settings;
create trigger discord_settings_set_updated_at
  before update on public.discord_settings
  for each row execute procedure public.set_updated_at();

drop trigger if exists creators_create_room on public.creators;
create trigger creators_create_room
  after insert on public.creators
  for each row execute procedure public.create_default_creator_room();

alter table public.profiles enable row level security;
alter table public.creators enable row level security;
alter table public.creator_rooms enable row level security;
alter table public.creator_applications enable row level security;
alter table public.metric_submissions enable row level security;
alter table public.metric_attachments enable row level security;
alter table public.creator_notices enable row level security;
alter table public.discord_settings enable row level security;
alter table public.discord_message_logs enable row level security;
alter table public.metric_reviews enable row level security;

drop policy if exists "Profiles are visible to self or staff" on public.profiles;
create policy "Profiles are visible to self or staff"
  on public.profiles
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_staff());

drop policy if exists "Profiles can be updated by self or staff" on public.profiles;
create policy "Profiles can be updated by self or staff"
  on public.profiles
  for update
  to authenticated
  using (user_id = auth.uid() or public.is_staff())
  with check (user_id = auth.uid() or public.is_staff());

drop policy if exists "Staff can insert profiles" on public.profiles;
create policy "Staff can insert profiles"
  on public.profiles
  for insert
  to authenticated
  with check (public.is_staff());

drop policy if exists "Staff can manage creators" on public.creators;
create policy "Staff can manage creators"
  on public.creators
  for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists "Creators can view own creator record" on public.creators;
create policy "Creators can view own creator record"
  on public.creators
  for select
  to authenticated
  using (id = public.current_creator_id());

drop policy if exists "Staff can manage creator rooms" on public.creator_rooms;
create policy "Staff can manage creator rooms"
  on public.creator_rooms
  for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists "Creators can view own room" on public.creator_rooms;
create policy "Creators can view own room"
  on public.creator_rooms
  for select
  to authenticated
  using (creator_id = public.current_creator_id());

drop policy if exists "Staff can view applications" on public.creator_applications;
create policy "Staff can view applications"
  on public.creator_applications
  for select
  to authenticated
  using (public.is_staff());

drop policy if exists "Staff can manage applications" on public.creator_applications;
create policy "Staff can manage applications"
  on public.creator_applications
  for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists "Public can create applications" on public.creator_applications;
create policy "Public can create applications"
  on public.creator_applications
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Staff can view all metric submissions" on public.metric_submissions;
create policy "Staff can view all metric submissions"
  on public.metric_submissions
  for select
  to authenticated
  using (public.is_staff());

drop policy if exists "Creators can view own metric submissions" on public.metric_submissions;
create policy "Creators can view own metric submissions"
  on public.metric_submissions
  for select
  to authenticated
  using (creator_id = public.current_creator_id());

drop policy if exists "Creators can submit own metrics" on public.metric_submissions;
create policy "Creators can submit own metrics"
  on public.metric_submissions
  for insert
  to authenticated
  with check (creator_id = public.current_creator_id());

drop policy if exists "Staff can review metrics" on public.metric_submissions;
create policy "Staff can review metrics"
  on public.metric_submissions
  for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists "Staff can manage metric attachments" on public.metric_attachments;
create policy "Staff can manage metric attachments"
  on public.metric_attachments
  for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists "Creators can view own metric attachments" on public.metric_attachments;
create policy "Creators can view own metric attachments"
  on public.metric_attachments
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.metric_submissions ms
      where ms.id = metric_attachments.metric_submission_id
        and ms.creator_id = public.current_creator_id()
    )
  );

drop policy if exists "Creators can insert own metric attachments" on public.metric_attachments;
create policy "Creators can insert own metric attachments"
  on public.metric_attachments
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.metric_submissions ms
      where ms.id = metric_attachments.metric_submission_id
        and ms.creator_id = public.current_creator_id()
    )
  );

drop policy if exists "Staff can manage notices" on public.creator_notices;
create policy "Staff can manage notices"
  on public.creator_notices
  for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists "Creators can view relevant notices" on public.creator_notices;
create policy "Creators can view relevant notices"
  on public.creator_notices
  for select
  to authenticated
  using (
    public.is_staff()
    or target_type = 'general'
    or (target_type = 'individual' and target_creator_id = public.current_creator_id())
    or (
      target_type = 'category'
      and exists (
        select 1
        from public.creators c
        where c.id = public.current_creator_id()
          and c.category = creator_notices.target_category
      )
    )
  );

drop policy if exists "Staff can view discord settings" on public.discord_settings;
create policy "Staff can view discord settings"
  on public.discord_settings
  for select
  to authenticated
  using (public.is_staff());

drop policy if exists "Admins can manage discord settings" on public.discord_settings;
create policy "Admins can manage discord settings"
  on public.discord_settings
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Staff can view discord logs" on public.discord_message_logs;
create policy "Staff can view discord logs"
  on public.discord_message_logs
  for select
  to authenticated
  using (public.is_staff());

drop policy if exists "Staff can insert discord logs" on public.discord_message_logs;
create policy "Staff can insert discord logs"
  on public.discord_message_logs
  for insert
  to authenticated
  with check (public.is_staff());

drop policy if exists "Staff can view metric reviews" on public.metric_reviews;
create policy "Staff can view metric reviews"
  on public.metric_reviews
  for select
  to authenticated
  using (public.is_staff());

drop policy if exists "Creators can view own metric reviews" on public.metric_reviews;
create policy "Creators can view own metric reviews"
  on public.metric_reviews
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.metric_submissions ms
      where ms.id = metric_reviews.metric_submission_id
        and ms.creator_id = public.current_creator_id()
    )
  );

drop policy if exists "Staff can insert metric reviews" on public.metric_reviews;
create policy "Staff can insert metric reviews"
  on public.metric_reviews
  for insert
  to authenticated
  with check (public.is_staff());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'metric-attachments',
  'metric-attachments',
  false,
  5242880,
  array['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

grant select, insert, update, delete on storage.objects to authenticated, service_role;

drop policy if exists "Metric attachments are readable by owner or staff" on storage.objects;
create policy "Metric attachments are readable by owner or staff"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'metric-attachments'
    and (
      public.is_staff()
      or split_part(name, '/', 1) = coalesce(public.current_creator_id()::text, '')
    )
  );

drop policy if exists "Metric attachments are insertable by owner or staff" on storage.objects;
create policy "Metric attachments are insertable by owner or staff"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'metric-attachments'
    and (
      public.is_staff()
      or split_part(name, '/', 1) = coalesce(public.current_creator_id()::text, '')
    )
  );

drop policy if exists "Metric attachments are updatable by owner or staff" on storage.objects;
create policy "Metric attachments are updatable by owner or staff"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'metric-attachments'
    and (
      public.is_staff()
      or split_part(name, '/', 1) = coalesce(public.current_creator_id()::text, '')
    )
  )
  with check (
    bucket_id = 'metric-attachments'
    and (
      public.is_staff()
      or split_part(name, '/', 1) = coalesce(public.current_creator_id()::text, '')
    )
  );

drop policy if exists "Metric attachments are deletable by owner or staff" on storage.objects;
create policy "Metric attachments are deletable by owner or staff"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'metric-attachments'
    and (
      public.is_staff()
      or split_part(name, '/', 1) = coalesce(public.current_creator_id()::text, '')
    )
  );
