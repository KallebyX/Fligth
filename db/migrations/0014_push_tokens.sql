-- Push notification device tokens. One row per device per user.
-- APNs token is the deviceToken from iOS UIApplication; FCM token would
-- come from Firebase Messaging on Android. We separate by platform so the
-- backend knows which gateway to hit.
create table if not exists public.push_tokens (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null,
  platform text not null check (platform in ('ios','android','web')),
  device_label text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (token)
);

create index if not exists push_tokens_user_idx on public.push_tokens(user_id) where revoked_at is null;

alter table public.push_tokens enable row level security;

create policy "users can read own push tokens" on public.push_tokens
  for select using (auth.uid() = user_id);
create policy "users can insert own push tokens" on public.push_tokens
  for insert with check (auth.uid() = user_id);
create policy "users can update own push tokens" on public.push_tokens
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users can delete own push tokens" on public.push_tokens
  for delete using (auth.uid() = user_id);
