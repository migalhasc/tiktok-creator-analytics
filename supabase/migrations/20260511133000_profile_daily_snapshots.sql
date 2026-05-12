create table if not exists public.profile_daily_snapshots (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  snapshot_date date not null,
  collected_at timestamptz not null default timezone('utc', now()),
  collection_source text not null,
  followers bigint,
  following bigint,
  total_likes bigint,
  total_posts integer,
  created_at timestamptz not null default timezone('utc', now()),
  unique (profile_id, snapshot_date)
);

create index if not exists profile_daily_snapshots_profile_id_snapshot_date_idx
  on public.profile_daily_snapshots(profile_id, snapshot_date desc);

create index if not exists profile_daily_snapshots_snapshot_date_idx
  on public.profile_daily_snapshots(snapshot_date desc);
