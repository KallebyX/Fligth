-- =========================================================================
-- 0011_realtime_uacts.sql — Stream user_activities via Supabase Realtime
-- =========================================================================
--
-- Enables INSERT replication on user_activities. RLS continues to gate which
-- rows each subscriber receives: only own activities or activities of
-- followed users will be pushed to the client.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'user_activities'
  ) then
    execute 'alter publication supabase_realtime add table public.user_activities';
  end if;
end $$;
