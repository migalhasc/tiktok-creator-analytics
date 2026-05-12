create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  profile_url text not null,
  display_name text,
  biography text,
  followers bigint,
  following bigint,
  likes bigint,
  videos_count integer,
  is_verified boolean,
  avatar_url text,
  provider_payload jsonb not null default '{}'::jsonb,
  cache_status text not null default 'fresh',
  last_fetched_at timestamptz,
  last_refresh_started_at timestamptz,
  last_error_code text,
  last_error_message text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_cache_status_check check (cache_status in ('fresh', 'stale', 'refreshing', 'error'))
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  tiktok_post_id text not null,
  post_url text not null,
  author_username text not null,
  description text,
  hashtags text[] not null default '{}',
  published_at timestamptz,
  likes bigint,
  comments bigint,
  shares bigint,
  views bigint,
  saves bigint,
  reposts bigint,
  video_url text,
  thumbnail_url text,
  provider_payload jsonb not null default '{}'::jsonb,
  last_seen_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (profile_id, tiktok_post_id),
  unique (post_url)
);

create index if not exists posts_profile_id_idx on public.posts(profile_id);
create index if not exists posts_published_at_idx on public.posts(published_at desc);

create table if not exists public.fetch_runs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  username text not null,
  source text not null,
  status text not null,
  records_count integer,
  error_code text,
  error_message text,
  provider_payload jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default timezone('utc', now()),
  finished_at timestamptz,
  constraint fetch_runs_status_check check (status in ('started', 'success', 'failed'))
);

create index if not exists fetch_runs_username_idx on public.fetch_runs(username, started_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
before update on public.posts
for each row execute procedure public.set_updated_at();
