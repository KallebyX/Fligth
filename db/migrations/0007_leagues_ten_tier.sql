-- =========================================================================
-- 0007_leagues_ten_tier.sql — Expand league divisions to the 10 Duolingo tiers
-- =========================================================================
--
-- Existing rows only used 4 divisions (bronze/prata/ouro/diamante). The
-- intermediate tiers (safira, rubi, esmeralda, ametista, perola, obsidiana)
-- become legal targets for cron-driven promotions.

alter table public.leagues drop constraint if exists leagues_division_check;
alter table public.leagues
  add constraint leagues_division_check
  check (division in (
    'bronze','prata','ouro','safira','rubi','esmeralda',
    'ametista','perola','obsidiana','diamante'
  ));
