-- =========================================================================
-- 0008_outfits.sql — Mascot outfit economy
-- =========================================================================
--
-- Introduces gems (soft currency), a mascot outfit catalog, per-user
-- inventory, and the equipped slot on the profile. Outfit tiers:
--   * free          — granted automatically (e.g. the aviator-classic)
--   * prize         — earned via roulette / jackpot / league reward
--   * paid          — purchased with Stripe or with gems

alter table public.user_stats
  add column if not exists gems            int not null default 0,
  add column if not exists last_spin_at    timestamptz,
  add column if not exists last_jackpot_at timestamptz;

alter table public.profiles
  add column if not exists equipped_outfit_slug text;

create table if not exists public.mascot_outfits (
  slug             text primary key,
  name             text not null,
  description      text,
  tier             text not null check (tier in ('free','prize','paid')),
  rarity           text not null check (rarity in ('common','rare','epic','legendary')),
  price_gems       int,
  price_cents      int,
  stripe_price_id  text,
  asset_key        text not null,
  drop_weight      int not null default 0,
  created_at       timestamptz not null default now()
);

create table if not exists public.user_outfits (
  user_id      uuid not null references public.profiles(id) on delete cascade,
  outfit_slug  text not null references public.mascot_outfits(slug) on delete cascade,
  acquired_via text not null check (acquired_via in (
    'starter','roulette','jackpot','league_reward','purchase','pro_unlock'
  )),
  acquired_at  timestamptz not null default now(),
  primary key (user_id, outfit_slug)
);
create index if not exists user_outfits_user_idx on public.user_outfits (user_id);

alter table public.mascot_outfits enable row level security;
alter table public.user_outfits   enable row level security;

drop policy if exists "outfits: read" on public.mascot_outfits;
create policy "outfits: read" on public.mascot_outfits
  for select using (auth.role() = 'authenticated');

drop policy if exists "uoutfits: own all" on public.user_outfits;
create policy "uoutfits: own all" on public.user_outfits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
