-- Helper for webhook handlers (Stripe, RevenueCat) that need to recover
-- the Supabase user id when only the provider customer email is known.
-- SECURITY DEFINER so it works for the service role; argument is sanitized
-- by Supabase auth (no SQL injection vector since email is bound).
create or replace function public.find_user_id_by_email(p_email text)
returns uuid
language sql
security definer
set search_path = public, auth
as $$
  select id from auth.users where lower(email) = lower(p_email) limit 1;
$$;

-- Only service role should call this; revoke from authenticated/anon.
revoke all on function public.find_user_id_by_email(text) from public;
grant execute on function public.find_user_id_by_email(text) to service_role;
