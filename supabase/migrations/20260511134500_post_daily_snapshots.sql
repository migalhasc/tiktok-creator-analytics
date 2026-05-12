create table if not exists public.post_daily_snapshots (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  snapshot_date date not null,
  collected_at timestamptz not null default timezone('utc', now()),
  collection_source text not null,
  views bigint,
  likes bigint,
  comments bigint,
  shares bigint,
  saves bigint,
  reposts bigint,
  created_at timestamptz not null default timezone('utc', now()),
  unique (post_id, snapshot_date)
);

create index if not exists post_daily_snapshots_post_id_snapshot_date_idx
  on public.post_daily_snapshots(post_id, snapshot_date desc);

create index if not exists post_daily_snapshots_snapshot_date_idx
  on public.post_daily_snapshots(snapshot_date desc);
