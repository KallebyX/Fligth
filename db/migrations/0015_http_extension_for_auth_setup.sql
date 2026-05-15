-- 0015_http_extension_for_auth_setup.sql
--
-- Enable the `http` extension so we can call the Supabase Management API
-- (PATCH /v1/projects/{ref}/config/auth) directly from Postgres via SQL.
-- This is the path used by setup-auth-via-mcp.sql to apply OAuth providers
-- + email templates when sandbox networks can't reach api.supabase.com.
--
-- pg_net (async) is also useful but lacks PATCH, so `http` is the choice.
create extension if not exists http;
