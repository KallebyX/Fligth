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
-- public.push_tokens. O JWT no Authorization é lido do Supabase Vault
-- (segredo 'fligth_anon_key') em vez de hardcoded — definido em 0017.
--
-- Pré-requisito (rodar UMA vez fora desta migration, com a anon key real):
--
--   select vault.create_secret(
--     new_secret => '<NEXT_PUBLIC_SUPABASE_ANON_KEY>',
--     new_name => 'fligth_anon_key',
--     new_description => 'Public anon JWT used by pg_cron to call edge functions'
--   );
--
-- A função real (que faz o lookup no Vault) está em 0017. Esta migration
-- só configura cron + extensions + dummy function pra schedule funcionar.
create or replace function public.notify_streak_risk()
returns int
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
begin
  -- Stub: substituído por 0017_streak_risk_use_vault.
  return 0;
end;
$$;

revoke all on function public.notify_streak_risk() from public;
grant execute on function public.notify_streak_risk() to service_role;

-- Schedule diário às 21:00 UTC = 18:00 Brasília. Idempotente.
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
