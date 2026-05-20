-- Seed test users for TestFlight beta. Idempotent — skips emails that
-- already exist in auth.users. See docs/TESTFLIGHT-USERS.md for the full
-- credential table.
--
-- Run from Supabase SQL editor (production project ggveduxfkljidzkrmmoo):
--   https://supabase.com/dashboard/project/ggveduxfkljidzkrmmoo/sql/new
--
-- Or via Supabase CLI:
--   supabase db execute --file scripts/seed-testflight-users.sql

do $$
declare
  testers text[][] := array[
    -- email, password, display_name, username, country, color
    array['tester1@capitaolori.com',  'TestPilot2026!', 'Capitão Teste 1', 'tester_1', 'BR', 'sky'],
    array['tester2@capitaolori.com',  'TestPilot2026!', 'Co-Piloto Teste', 'tester_2', 'BR', 'grass'],
    array['tester3@capitaolori.com',  'TestPilot2026!', 'Aviadora Teste',  'tester_3', 'BR', 'sun'],
    array['demo@capitaolori.com',     'DemoPilot2026!', 'Piloto Demo',     'demo',     'BR', 'gold'],
    array['internal@capitaolori.com', 'TestPilot2026!', 'Piloto Interno',  'internal', 'BR', 'alert'],
    array['review@capitaolori.com',   'AppleReview!1',  'App Review',      'review',   'US', 'ink']
  ];
  t text[];
  new_id uuid;
  xp_values int[]     := array[0, 150, 320, 580, 880, 1240];
  streak_values int[] := array[0, 3, 7, 12, 18, 24];
  hearts_values int[] := array[5, 5, 4, 5, 3, 5];
  gems_values int[]   := array[0, 25, 80, 150, 220, 320];
  i int := 0;
begin
  foreach t slice 1 in array testers loop
    i := i + 1;

    if exists (select 1 from auth.users where email = t[1]) then
      raise notice 'Skipping existing user: %', t[1];
      continue;
    end if;

    new_id := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      new_id, 'authenticated', 'authenticated', t[1],
      crypt(t[2], gen_salt('bf', 10)),
      now(), now(), now(),
      jsonb_build_object('provider', 'email', 'providers', array['email']),
      jsonb_build_object('display_name', t[3]),
      '', '', ''
    );

    -- handle_new_user trigger creates profile + user_stats rows.
    update public.profiles set
      display_name  = t[3],
      username      = t[4],
      country_code  = t[5],
      profile_color = t[6],
      bio = case
        when t[4] = 'review' then 'Apple Review test account — feel free to log in.'
        when t[4] = 'demo'   then 'Conta de demonstração — use livremente.'
        else 'Conta de teste interno do Capitão Lorí.'
      end
    where id = new_id;

    update public.user_stats set
      total_xp           = xp_values[i],
      current_streak     = streak_values[i],
      longest_streak     = greatest(streak_values[i], 7),
      hearts             = hearts_values[i],
      gems               = gems_values[i],
      streak_freezes     = case when i % 2 = 0 then 1 else 0 end,
      last_activity_date = case when streak_values[i] > 0 then current_date else null end
    where user_id = new_id;

    raise notice 'Created user: % (%) with % XP', t[1], new_id, xp_values[i];
  end loop;
end $$;

-- Verify
select
  u.email,
  p.username,
  p.display_name,
  s.total_xp,
  s.current_streak,
  s.hearts,
  s.gems
from auth.users u
join public.profiles p on p.id = u.id
join public.user_stats s on s.user_id = u.id
where u.email like '%@capitaolori.com'
order by s.total_xp;
