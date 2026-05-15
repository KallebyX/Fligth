-- pg_cron permite jobs SQL agendados rodando dentro do Postgres.
-- pg_net é assíncrono — devolve um id imediatamente, perfeito para um cron
-- que enfileira N pushes sem segurar a transação.
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- notify_streak_risk: roda diariamente. Para cada usuário com streak > 0,
-- sem atividade hoje, e com push token ativo, invoca a edge function
-- send-push enfileirando uma notificação "ofensiva em risco".
--
-- A função roda como SECURITY DEFINER para conseguir ler auth.users e
-- public.push_tokens. O JWT no Authorization é a anon key (pública,
-- segura — a edge function valida internamente o ownership do user_id).
--
-- IMPORTANTE: anon key hardcoded. Se rotacionar, atualizar v_anon_key
-- ou migrar pra ler de current_setting('app.anon_key').
create or replace function public.notify_streak_risk()
returns int
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_user record;
  v_count int := 0;
  v_anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdndmVkdXhma2xqaWR6a3JtbW9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MDI4ODgsImV4cCI6MjA5NDA3ODg4OH0.TL62DFKGzImF7fS2jSuik1Qa1F7NmhWmpChNUBI8F2c';
begin
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

revoke all on function public.notify_streak_risk() from public;
grant execute on function public.notify_streak_risk() to service_role;

-- Schedule diário às 21:00 UTC = 18:00 Brasília. Hora boa: o usuário
-- ainda tem 6 horas pra abrir o app antes do dia virar. Idempotente.
do $$
declare
  v_jobid bigint;
begin
  select jobid into v_jobid from cron.job where jobname = 'streak-risk-daily';
  if v_jobid is not null then
    perform cron.unschedule(v_jobid);
  end if;
end $$;

select cron.schedule(
  'streak-risk-daily',
  '0 21 * * *',
  $$select public.notify_streak_risk();$$
);
