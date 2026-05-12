-- =========================================================================
-- 0010_notifications.sql — In-app notifications (followed_you, etc.)
-- =========================================================================
--
-- Lightweight unread/read inbox. Inserts only via service_role; SELECT/UPDATE
-- own-only via RLS so users can flip read_at when they open the bell drawer.

create table if not exists public.notifications (
  id         bigserial primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  kind       text not null check (kind in (
    'followed_you','outfit_unlocked','league_promoted'
  )),
  payload    jsonb not null default '{}'::jsonb,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, read_at nulls first, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "notif: read own"   on public.notifications;
drop policy if exists "notif: update own" on public.notifications;
create policy "notif: read own"
  on public.notifications for select using (auth.uid() = user_id);
create policy "notif: update own"
  on public.notifications for update using (auth.uid() = user_id);
-- INSERTs only via service_role (no explicit policy = denied to authenticated).
