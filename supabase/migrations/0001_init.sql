-- Morning Coffee Community: initial schema.
-- Run once in Supabase > SQL Editor. It is safe to run again (everything is "if not exists").
--
-- Access model: the Next.js server talks to the database with the service-role key and
-- checks who may see what (same rules as the app today). Row Level Security is switched on
-- for every table with no public policies, so the browser's anon key can read nothing.

create extension if not exists pgcrypto;

-- People ---------------------------------------------------------------------------------
-- One row per signed-up person; id is the Supabase Auth user id.
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  email text not null,
  role text not null default 'member' check (role in ('member', 'admin')),
  tier text not null default 'free' check (tier in ('free', 'premium')),
  status text not null default 'active' check (status in ('active', 'paused', 'cancelled')),
  premium_until timestamptz,
  note text not null default '',
  email_preferences jsonb not null default '{}'::jsonb,
  stripe_customer_id text,
  joined date not null default current_date,
  created_at timestamptz not null default now()
);
create unique index if not exists profiles_email_key on profiles (lower(email));

-- Create a profile automatically when someone signs up.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''), new.email)
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- Content --------------------------------------------------------------------------------
create table if not exists posts (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  access text not null default 'public' check (access in ('public', 'premium')),
  status text not null default 'draft' check (status in ('draft', 'published')),
  category text not null default '',
  cover int not null default 1,
  cover_image_id text,
  date date not null default current_date,
  excerpt text not null default '',
  body text not null default '',
  blocks jsonb not null default '[]'::jsonb,
  audio_path text,
  audio_name text,
  created_at timestamptz not null default now()
);

create table if not exists podcasts (
  id text primary key default gen_random_uuid()::text,
  num int not null default 0,
  title text not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  duration text not null default '',
  audio_path text,
  audio_name text not null default '',
  date date not null default current_date,
  description text not null default '',
  created_at timestamptz not null default now()
);

-- Saturday sessions. Zoom details stay on the server.
create table if not exists sessions (
  id text primary key default gen_random_uuid()::text,
  date date not null,
  time text not null default '10:30',
  topic text not null default '',
  notes text not null default '',
  blocks jsonb not null default '[]'::jsonb,
  zoom_meeting_id text,
  zoom_url text,
  zoom_pass text,
  podcast_id text references podcasts (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists events (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  date date not null,
  start_time text not null default '10:00',
  end_time text not null default '12:00',
  venue text not null default '',
  address text not null default '',
  map_url text not null default '',
  seats int not null default 10 check (seats >= 0),
  price text not null default 'Free',
  summary text not null default '',
  blocks jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create table if not exists event_attendees (
  event_id text not null references events (id) on delete cascade,
  member_id uuid not null references profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (event_id, member_id)
);

-- Consultations --------------------------------------------------------------------------
-- Weekly times Sibel offers: weekday 0 (Sunday) to 6, times like '10:00'.
create table if not exists availability (
  weekday int primary key check (weekday between 0 and 6),
  times text[] not null default '{}'
);

create table if not exists company_links (
  id text primary key default gen_random_uuid()::text,
  token text not null unique,
  label text not null default '',
  created_at date not null default current_date,
  expires_at date not null,
  revoked boolean not null default false,
  booking_id text
);

create table if not exists bookings (
  id text primary key default gen_random_uuid()::text,
  member_id uuid references profiles (id) on delete set null,
  date date not null,
  time text not null,
  topic text not null default '',
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  zoom_meeting_id text,
  zoom_url text,
  source text check (source in ('company')),
  company text,
  contact text,
  email text,
  phone text,
  link_id text references company_links (id) on delete set null,
  created_at timestamptz not null default now()
);
alter table company_links
  drop constraint if exists company_links_booking_fk;
alter table company_links
  add constraint company_links_booking_fk foreign key (booking_id) references bookings (id) on delete set null;

create table if not exists admin_notices (
  id text primary key default gen_random_uuid()::text,
  kind text not null default 'company-booking',
  booking_id text references bookings (id) on delete cascade,
  seen boolean not null default false,
  created_at timestamptz not null default now()
);

-- Email ----------------------------------------------------------------------------------
create table if not exists announcements (
  id text primary key default gen_random_uuid()::text,
  subject text not null,
  audience text not null default 'all',
  category text,
  groups text[] not null default '{}',
  recipient_ids uuid[] not null default '{}',
  date date not null default current_date,
  body text not null default '',
  html text,
  image_id text,
  email_status text,
  created_at timestamptz not null default now()
);

-- One row per email Resend was asked to send; counts toward the daily limit.
create table if not exists email_log (
  id uuid primary key default gen_random_uuid(),
  announcement_id text references announcements (id) on delete set null,
  member_id uuid references profiles (id) on delete set null,
  to_email text not null,
  subject text not null,
  resend_id text,
  status text not null default 'sent' check (status in ('sent', 'failed')),
  error text,
  sent_at timestamptz not null default now()
);
create index if not exists email_log_sent_at on email_log (sent_at);

-- Site -----------------------------------------------------------------------------------
-- Key/value settings: consultation rules, site title, copy edits, images, footer, templates...
create table if not exists site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- Uploaded files (post covers, library images, email images). Bytes live in Storage.
create table if not exists media_files (
  id text primary key default gen_random_uuid()::text,
  file_name text not null,
  type text not null,
  size int not null,
  storage_path text not null,
  uploaded_at timestamptz not null default now()
);

-- Payments (filled by the Stripe webhook later) -----------------------------------------
create table if not exists subscriptions (
  id text primary key,
  member_id uuid not null references profiles (id) on delete cascade,
  status text not null,
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

-- Lock everything down: no policy means the anon and signed-in browser roles see nothing.
do $$
declare t text;
begin
  for t in select unnest(array[
    'profiles','posts','podcasts','sessions','events','event_attendees','availability',
    'company_links','bookings','admin_notices','announcements','email_log','site_settings',
    'media_files','subscriptions'
  ]) loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

-- Private storage buckets for audio and images (served only through the app).
insert into storage.buckets (id, name, public)
values ('audio', 'audio', false), ('images', 'images', false)
on conflict (id) do nothing;
