# Operations Runbook — Fligth

Day-2 operations. What to do when things break, how to deploy, where to look first.

## Quick health check

```bash
curl -fsS https://capitaolori.com/api/health | jq
```

Expected: `{"status": "ok", "checks": {"db": "ok", "auth": "ok", "storage": "ok"}}` and HTTP 200. Anything else → see "Degraded" below.

The endpoint is `app/api/health/route.ts`. It probes DB (cheap count from `subjects`), Auth admin (list 1 user), and Storage (list 1 file in `avatars`). Latency per check is included for trend graphs.

Recommended: configure an uptime monitor (Better Stack, UptimeRobot, or Vercel built-in) hitting `/api/health` every 60s and pinging Slack on 503 streaks of ≥ 2.

## Releases / deployments

The app deploys to Vercel from the `main` branch automatically. Feature branches get preview deploys.

- Branch policy: `claude/*` is for in-progress work; merge → `main`.
- iOS native: `npx cap sync ios && open ios/App/App.xcworkspace` → Xcode Archive → upload to TestFlight.
- Android (Capacitor 7): not yet deployed.
- Supabase migrations: applied via MCP (`apply_migration`) directly to prod. After each migration, run `get_advisors` (see below).

## Database

- Project: `ggveduxfkljidzkrmmoo` (region `sa-east-1`).
- Migrations: `db/migrations/*.sql`. Numbered. `0001` through latest applied = `list_migrations`.
- Daily backups: enabled by Supabase Pro plan. Retention ≥ 7 days. Restore procedure: Dashboard → Database → Backups → "Restore to new project" (do not restore in place).
- Connection pool: pgBouncer in transaction mode, port 6543. App code uses the Supabase SDK which routes through the pool automatically.

### Weekly checklist
```
□ mcp.supabase.get_advisors(type="security") → 0 ERROR, ≤ 2 WARN
□ mcp.supabase.get_advisors(type="performance") → review any new findings
□ select count(*) from auth.users → trending up
□ select count(*) from public.profiles where role='admin' → expected list only
□ select count(*) from public.purchases where status='fulfilled' and created_at > now() - interval '7 days'
□ select * from cron.job → confirm all expected jobs active=true:
    process_account_deletion_queue (*/15 * * * *)
    notify_streak_risk (cron set in migration 0016)
```

### Known advisor findings (acceptable)
- **Extension in public schema** (`http`, `pg_net`): used by `notify_streak_risk` to call Edge Functions via vault secrets. Migrating to a private schema requires renaming all callers — backlog.
- **Public bucket allows listing** (`avatars`, `gallery`): we serve public URLs to avatars/gallery thumbnails directly. Listing is enabled because that's how Supabase Storage is configured for the bucket; we'd need to add a deny-list-but-allow-read policy. Tracking but low priority — file names are UUIDs so enumeration leaks no PII.
- **Leaked password protection disabled**: enable in Dashboard → Auth → Password Security → "Check against HaveIBeenPwned". Free, recommended pre-launch.

## Monitoring & alerts

- **Sentry**: `instrumentation.ts` wires both server + client + edge. DSN in `SENTRY_DSN` env.
  - Recommended alerts (configure in dashboard):
    - Rate > 5/min @ level=error → Slack #incidents
    - Any unhandled `submitAnswer` failure → Slack with stack
    - Webhook 5xx from `/api/stripe/webhook` or `/api/revenuecat/webhook` → Slack
- **Vercel Speed Insights**: install with `npm i @vercel/speed-insights` + add `<SpeedInsights />` to `app/layout.tsx`. Tracks Core Web Vitals per route.
- **Supabase logs**: `mcp.supabase.get_logs(service="postgres" | "api" | "auth")`.

## Secrets matrix (Vercel + Supabase)

| Env var | Where | What for |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel public | Browser + SSR Supabase client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel public | Browser + SSR Supabase client |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel server | Webhook fulfillment, exam pool, account delete |
| `STRIPE_SECRET_KEY` | Vercel server | Stripe SDK server-side |
| `STRIPE_WEBHOOK_SECRET` | Vercel server | `/api/stripe/webhook` signature verify |
| `REVENUECAT_WEBHOOK_TOKEN` | Vercel server | `/api/revenuecat/webhook` bearer check |
| `CRON_SECRET` | Vercel server + Cron job header | `/api/cron/leagues` auth |
| `SENTRY_DSN` | Vercel public + server | Error reporting |
| `SENTRY_AUTH_TOKEN` | Vercel server (CI only) | Sentry source-map upload |
| `GOOGLE_VISION_API_KEY` | Supabase Edge Function `safesearch` secrets | NSFW gating (PR 4) |
| `APNS_TEAM_ID`, `APNS_KEY_ID`, `APNS_PRIVATE_KEY`, `APNS_BUNDLE_ID`, `APNS_HOST` | Supabase Edge Function `send-push` secrets | iOS push |
| `FCM_PROJECT_ID`, `FCM_SERVICE_ACCOUNT` | Supabase Edge Function `send-push` secrets | Android push (planned) |

### Rotation

- **Supabase service-role key**: Dashboard → Settings → API → "Roll service role JWT secret". After roll: update Vercel env, redeploy. Hot-swap: roll the key, deploy, then revoke old (Supabase generates new without invalidating old until you click). ETA: 5 min.
- **Stripe webhook secret**: Stripe Dashboard → Webhooks → endpoint → "Roll secret". Update Vercel, redeploy.
- **CRON_SECRET**: generate `openssl rand -hex 32`, update Vercel + Vercel Cron job config.

## Incident response — degraded states

### `/api/health` returns 503
1. Inspect the failing check (`db`, `auth`, `storage`).
2. Check Supabase status page: status.supabase.com.
3. `mcp.supabase.get_logs(service="postgres")` for DB error traces.
4. If DB up but API failing: usually rate limit on free tier — check Dashboard → Reports.

### Stripe webhook backlog
- Stripe dashboard → Webhooks → endpoint → "View deliveries".
- Failed events stay queued; replay via "Resend".
- Common cause: `STRIPE_WEBHOOK_SECRET` mismatch (after rotation, before deploy). Check signature error in route handler logs.

### Push notifications silent
- Edge Function `send-push` logs: `mcp.supabase.get_logs(service="edge-function")` (filter by name).
- Common: APNs auth token expired (rotates every 12 months). Re-generate `.p8` in Apple Developer + update secret.

### Account-deletion cron stuck
```sql
select * from cron.job where jobname = 'process_account_deletion_queue';
-- active = true? schedule sane?
select * from cron.job_run_details where jobid = <id> order by start_time desc limit 5;
```

### Database restore
1. Dashboard → Database → Backups.
2. Pick a backup ≤ 24h before the incident.
3. "Restore to new project". Wait ~15min.
4. Validate: connect via SQL editor, `select count(*) from auth.users`.
5. Swap Vercel env vars to point at new project (URL + ANON_KEY + SERVICE_ROLE_KEY).
6. Trigger Vercel redeploy.
7. Sanity: hit `/api/health` against new env.

**This is destructive** — old project keeps data but the swap means anything between backup and swap is lost. Communicate to users.

## Performance tuning

### Recent query log
```
mcp.supabase.get_logs(service="postgres")
```

### Index audit
```sql
-- Most-scanned tables (sequential, not via index)
select schemaname, relname, seq_scan, seq_tup_read, idx_scan
from pg_stat_user_tables
where schemaname = 'public'
order by seq_tup_read desc limit 10;

-- Indexes never used
select schemaname, relname, indexrelname, idx_scan
from pg_stat_user_indexes
where schemaname = 'public' and idx_scan = 0;
```

### Vercel Build minutes
- Check Vercel Dashboard → Usage. Typical cold build ~3 min. If creeping: prune deps + check next/image config.

## Capacitor / iOS specifics

- Universal Links require `/.well-known/apple-app-site-association` JSON served by Vercel at the production domain. This is wired in `public/.well-known/apple-app-site-association`.
- iOS push: Apple revokes tokens silently if app was uninstalled. The `push_tokens` table has `revoked_at` — set to `now()` from the Edge Function when APNs returns 410.
- App version bumps: increment `CFBundleShortVersionString` + `CFBundleVersion` in `ios/App/App/Info.plist`. Archive in Xcode → Distribute → TestFlight.

## Adding a new env var

1. Add to `.env.local.example` (template, no secret values) so contributors know it exists.
2. Add to Vercel → Project → Settings → Environment Variables (Production + Preview + Development).
3. Add to this file's secrets matrix above with what-for.
4. If used in middleware or RSC, redeploy is required.
