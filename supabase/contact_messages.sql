-- Run this once in the Supabase SQL editor (or via `supabase db push`)
-- before the contact form in src/routes/contact.tsx will work.

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

-- Public visitors can submit a message, but cannot read anyone else's.
create policy "public_can_insert_contact_messages"
on public.contact_messages
for insert
to anon
with check (true);
