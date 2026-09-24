-- Zettafry — missing tables fix.
-- Run this once in the Supabase SQL Editor on your project.
-- These tables were never committed as SQL in the original repo (they were
-- created through Lovable Cloud's own tooling), so a fresh Supabase project
-- needs them created manually. All access goes through the service-role
-- client on the server, so RLS is enabled with no public policies —
-- the anon/publishable key cannot read or write these tables directly.

create extension if not exists pgcrypto;

-- Daily usage counters, one row per user per day.
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

-- Single-row app-wide config (preferred model, daily limits).
create table if not exists public.app_config (
  id text primary key,
  preferred_model text,
  message_limit integer not null default 30,
  file_limit integer not null default 10,
  updated_at timestamptz not null default now()
);
alter table public.app_config enable row level security;

-- Seed the one config row the app expects (id = 'default').
insert into public.app_config (id, message_limit, file_limit)
values ('default', 30, 10)
on conflict (id) do nothing;
