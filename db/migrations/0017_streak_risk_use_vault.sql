-- Implementação real do notify_streak_risk: lê anon key do Vault, itera
-- usuários com streak em risco e enfileira pushes via send-push.
--
-- Pré-requisito (UMA vez, antes desta migration):
--
--   select vault.create_secret(
--     new_secret => '<anon_jwt>',
--     new_name => 'fligth_anon_key',
--     new_description => 'Public anon JWT for pg_cron edge function calls'
--   );
create or replace function public.notify_streak_risk()
returns int
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_user record;
  v_count int := 0;
  v_anon_key text;
begin
  select decrypted_secret into v_anon_key
  from vault.decrypted_secrets
  where name = 'fligth_anon_key';

  if v_anon_key is null then
    raise notice 'Vault secret fligth_anon_key not found — streak push skipped';
    return 0;
  end if;

  for v_user in (
    select s.user_id, s.current_streak, coalesce(p.display_name, p.username, 'piloto') as name
    from public.user_stats s
    left join public.profiles p on p.id = s.user_id
    where s.current_streak > 0
      and (s.last_activity_date is null or s.last_activity_date < current_date)
      and exists (
        select 1 from public.push_tokens t
        where t.user_id = s.user_id and t.revoked_at is null
      )
  ) loop
    perform net.http_post(
      url := 'https://ggveduxfkljidzkrmmoo.supabase.co/functions/v1/send-push',
      body := jsonb_build_object(
        'user_id', v_user.user_id::text,
        'title', 'Sua ofensiva está em risco!',
        'body', v_user.name || ', faça uma lição agora pra manter os ' ||
                v_user.current_streak || ' dia' ||
                case when v_user.current_streak = 1 then '' else 's' end ||
                ' de streak.'
      ),
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || v_anon_key,
        'Content-Type', 'application/json'
      ),
      timeout_milliseconds := 5000
    );
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;
