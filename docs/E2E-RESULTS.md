_E2E test run results from production, captured via Vercel MCP + Supabase MCP._

_Date: 2026-05-20_

## TL;DR

Ran live E2E checks against `https://fligth.vercel.app` (production) and the
preview deployment for the in-flight branch. **Found 1 bug (SEO redirect),
1 fix shipped to preview**. Everything else green:

| Surface | Result |
|---|---|
| `/api/health` | ✅ 200 — db, auth, storage all `ok`, latencies 72–264ms |
| `/` (landing) | ✅ 200 — full hero + JSON-LD + footer + 6 feature cards |
| `/login` | ✅ 200 — email/password form + Apple + Google OAuth buttons |
| `/sitemap.xml` | ✅ 200 — 14 URLs (6 static + 8 schools) with priorities |
| `/robots.txt` | ✅ 200 — correct allow/disallow lists |
| `/escolas` (prod) | 🔴 redirected to /login (SEO bug — fixed in preview) |
| `/escolas/[slug]` (prod) | 🔴 redirected to /login (SEO bug — fixed in preview) |
| `/escolas/...` (preview) | ✅ 200 — content rendered, anon CTA shown |
| **Vercel runtime logs** | 0 errors / fatals in last 24h |
| **Vercel build status** | All 15 most recent deployments READY |
| **Supabase API logs** | All 200/204/206 — no 4xx/5xx |
| **Vitest** | 118 / 118 passing |

## Bug found: /escolas auth-walled the SEO-targeted pages

The original `/escolas` and `/escolas/[slug]` pages had
`if (!user) redirect("/login")` server-side. Crawlers (Googlebot,
LinkedIn, Twitter card preview) hitting the URLs advertised in
`sitemap.xml` got a `<meta http-equiv="refresh" content="1;url=/login">`
in the body — so the indexed page was always `/login`, not the school
schema we carefully built.

### Evidence (raw)

`/escolas/aero-clube-sao-paulo` on prod (`dpl_4ypiUHSUuHg1jcMvZ3p2PUs7uocM`):

```html
<meta id="__next-page-redirect" http-equiv="refresh" content="1;url=/login"/>
…
<template data-dgst="NEXT_REDIRECT;replace;/login;307;"></template>
```

Title + canonical + OG were correct (the `generateMetadata` worked fine
because it ran via service-role) — but the body redirected before any
crawler could read content.

### Fix (commit `43c92b9`, deployed to preview)

`app/escolas/page.tsx` + `app/escolas/[slug]/page.tsx`:
- Dropped `if (!user) redirect("/login")`.
- Service-role client for the schools/UFS reads (anon crawlers see rows).
- HUD chrome only renders when authenticated.
- Unauthenticated visitors see a "Faça login para enviar uma mensagem"
  card with /signup?next= + /login?next= CTAs that preserve deep-link.

Preview validation (https://fligth-f6fq8755l-oryum.vercel.app/escolas/aero-clube-sao-paulo):
- ✅ No `next-page-redirect` meta tag
- ✅ No `NEXT_REDIRECT;replace;/login` digest
- ✅ "Aero Clube de São Paulo" + "Tradicional aero clube paulista"
  in body
- ✅ "Faça login pra enviar" CTA visible to anon

### To ship to production

Merge PR #5 to `main`. Vercel only promotes the main branch to production;
`claude/*` branches get preview-only deployments by design.

## Other checks — all green

### Vercel runtime logs (last 7d)
```
get_runtime_logs(level=["error","fatal","warning"]) → No logs found
```

### Vercel build logs (latest production `dpl_E83qBhu8q4QdAAAHkMa2fRV15Yav`)
- Compile: ✓ 22.4s
- Type check + lint: ✓ (2 ESLint warnings, both about
  `react-hooks/exhaustive-deps` — non-blocking)
- Sentry warnings about missing auth token (source maps not uploaded
  in this build) — expected, `SENTRY_AUTH_TOKEN` is CI-only
- Deprecation warning on `disableLogger` from Sentry — non-blocking
- No errors, deployment READY

### Supabase logs (last hour, ~100 requests)
- All paths returned 2xx
- Hot paths: `/auth/v1/user` (session checks), `/rest/v1/user_stats`,
  `/rest/v1/profiles`, `/rest/v1/notifications`, `/rest/v1/lessons`,
  `/rest/v1/questions_public`, `/rest/v1/schools`, `/rest/v1/leagues`,
  `/rest/v1/follows`
- Edge Functions: realtime websocket `/realtime/v1/websocket` upgrading
  101 (working).

### Database content
```sql
select s.name, count(distinct u.id) as units, count(distinct l.id) as lessons, count(distinct q.id) as questions
from public.subjects s
left join public.units u on u.subject_id = s.id
left join public.lessons l on l.unit_id = u.id
left join public.questions q on q.lesson_id = l.id
group by s.id, s.name, s.order_index
order by s.order_index;
```
| Subject | Units | Lessons | Questions |
|---|---:|---:|---:|
| Regulamentos de Tráfego Aéreo | 4 | 6 | 26 |
| Meteorologia | 4 | 5 | 27 |
| Navegação Aérea | 4 | 5 | 27 |
| Teoria de Voo | 4 | 6 | 27 |
| Conhecimentos Técnicos | 4 | 5 | 27 |
| **Comunicações & ICAO** | 2 | 2 | 8 |
| **Identificação de Aeronaves** | 2 | 2 | 6 |

All 7 subjects materialized. New content (ICAO + aeronaves) seeded
correctly with the expected counts.

### Test coverage
- Vitest: 118 / 118 passing
- Files: validators, slug, NSFW, leveling, hearts, pro, divisions,
  validateExercise, outfits, plus colocated SM-2 tests
- CI workflow `.github/workflows/test.yml` configured but not yet
  triggered in repo (will run on next PR merge to main).

### Edge Functions
All 5 ACTIVE:
- `apply-auth-config` v1
- `safesearch` v1 (needs `GOOGLE_VISION_API_KEY` secret to actually filter)
- `send-push` v1 (needs APNs `.p8` secrets to actually fire push)
- `send-daily-reminder` v1
- `dispatch-school-leads` v1

External cron via `.github/workflows/scheduled-edge-functions.yml`
configured for hourly + 5-min triggers (needs `SUPABASE_PROJECT_REF` +
`SUPABASE_SERVICE_ROLE_KEY` repo secrets).

## What's left (not in code — needs your action)

1. **Merge PR #5 to main** — propagates the /escolas SEO fix to
   production (`capitaolori.com`).
2. **Rotate** `GOOGLE_VISION_API_KEY` (the one shared via chat) at
   Google Cloud Console. Then set the NEW key as a secret on the
   safesearch Edge Function via Supabase Dashboard.
3. **GitHub repo secrets** for the cron workflow:
   `SUPABASE_PROJECT_REF=ggveduxfkljidzkrmmoo` +
   `SUPABASE_SERVICE_ROLE_KEY=<jwt>`.
4. **Supabase Dashboard → Auth → enable "Leaked Password Protection"**
   (HaveIBeenPwned integration).
5. **APNs `.p8` + Team ID + Key ID** on `send-push` Edge Function for
   iOS push to fire.
