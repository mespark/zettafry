-- Zettafry — required Supabase schema.
-- Run once in the SQL Editor on a fresh project. All access goes through
-- the service-role client on the server, so RLS is enabled with no public
-- policies — the browser's anon/publishable key can never read or write
-- these tables directly.

create extension if not exists pgcrypto;

-- Daily usage counters, one row per signed-in user per day.
create table if not exists public.usage_daily (
  user_id uuid not null,
  day date not null,
  messages integer not null default 0,
  files integer not null default 0,
  primary key (user_id, day)
);
alter table public.usage_daily enable row level security;

-- Saved extraction results, shown in the user's history.
create table if not exists public.extraction_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  created_at timestamptz not null default now(),
  source_name text,
  result jsonb
);
alter table public.extraction_history enable row level security;
create index if not exists extraction_history_user_created_idx
  on public.extraction_history (user_id, created_at desc);
