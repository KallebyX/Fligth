-- Apply OAuth provider config via Supabase Management API, executed from
-- inside Postgres (sandbox-friendly). Replace placeholders before running.
--
-- The http extension's default 5s timeout is shorter than the Management
-- API's response time, so bump curlopt first.
--
-- Required: SUPABASE_ACCESS_TOKEN (Personal Access Token sbp_...).
--
-- Variations:
--   - Google only: only google_client_id + google_secret
--   - Apple only: only apple_client_id + apple_secret (apple_secret is the
--     raw .p8 contents OR a pre-signed JWT)
--   - Both: include all four
--
-- Example usage via Supabase MCP execute_sql:
--   1. Run extension migration: db/migrations/0015_http_extension_for_auth_setup.sql
--   2. Edit this file inline, replace <PAT> and the OAuth fields
--   3. execute_sql with the contents below

-- Bump curl timeouts (per-session — resets on disconnect).
select http_set_curlopt('CURLOPT_TIMEOUT_MS', '30000');
select http_set_curlopt('CURLOPT_CONNECTTIMEOUT_MS', '10000');

with patched as (
  select * from http((
    'PATCH',
    'https://api.supabase.com/v1/projects/<PROJECT_REF>/config/auth',
    ARRAY[http_header('Authorization', 'Bearer <PAT>')],
    'application/json',
    jsonb_build_object(
      -- Google
      'external_google_enabled', true,
      'external_google_client_id', '<GOOGLE_CLIENT_ID>',
      'external_google_secret', '<GOOGLE_CLIENT_SECRET>'
      -- Apple (uncomment when you have the .p8 contents)
      -- ,'external_apple_enabled', true
      -- ,'external_apple_client_id', 'br.com.capitaolori.web'
      -- ,'external_apple_secret', '<APPLE_P8_CONTENTS_OR_JWT>'
    )::text
  )::http_request)
)
select status,
       content::jsonb -> 'external_google_enabled' as google_enabled,
       content::jsonb -> 'external_apple_enabled' as apple_enabled
from patched;
