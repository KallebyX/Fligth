# Audit Report — Fligth

End-to-end audit run on a comprehensive sweep of routes, server actions, components, forms, database (schema + RLS + triggers + functions), and infrastructure.

**Date**: ongoing — this doc is a living snapshot.
**Method**: 3 parallel Explore agents + Supabase MCP introspection + targeted file reads.
**Scope**: 215 .ts/.tsx files, 36 routes, 21 server actions, 4 API handlers, 30 tables, 56 RLS policies, 66 indexes, 8 functions, 5 triggers.

---

## TL;DR

The app is **substantially production-ready**. Build is green, type-check is clean, RLS is enforced on every table, webhook signatures verified, and the core flows (auth, lesson, exam, review, shop, social, gallery, schools) work end-to-end.

There are **7 critical findings** that should be addressed before broad public release, **11 medium-severity findings** that are good post-launch polish targets, and **9 known gaps** (deferred features, not bugs).

---

## 🔴 Critical findings (fix before public launch)

| # | Where | Issue | Recommendation |
|---|---|---|---|
| C1 | `app/actions/deleteAccount.ts` | Permanent account deletion gated only by the literal string `"EXCLUIR MINHA CONTA"`. No email confirmation, no 24h grace, no soft-delete. | Add email magic-link confirmation step + 24h soft-delete window (cascades fire after the window unless cancelled). |
| C2 | `app/actions/gallery.ts::createGalleryPost` | No server-side NSFW filter. Public moderation queue is the only line of defense; admin time is the bottleneck. | Add NSFW.JS pre-check in `UploadForm` + a server-side Google SafeSearch call in the `createGalleryPost` action. Block confidence ≥ 0.8 outright. |
| C3 | `app/actions/openStripePortal.ts` | No check that the user has an existing Stripe subscription before creating a Customer Portal session. Burns API calls; confuses non-paying users who land there. | Read `subscriptions` table first; redirect to `/pro` if no active sub. |
| C4 | `components/profile/EmailChangeDialog.tsx` (l. 29) | Email "validation" is `!clean.includes("@")` — accepts `a@b` and similar. | Use the same `EMAIL_RE` regex as `app/actions/schools.ts` (a real RFC-loose regex). Centralize in `lib/validators.ts`. |
| C5 | `app/actions/notifications.ts::markAllRead` | Returns `{ ok: boolean }` instead of standard `{ ok: true } \| { ok: false, error }` tagged union. Inconsistency means callers must special-case it. | Align to standard shape. |
| C6 | `app/actions/discover.ts::searchUsers` | Accepts unbounded query length. Long queries (10MB+) will full-text scan and tie up the DB connection. | Add `query.length <= 100` validation. |
| C7 | Various — see Agent C report | `<button>` with icon-only children sometimes missing `aria-label` (HUD NotificationsBell drop-down close, ModerationRow approve/reject icons before text). | Sweep and add `aria-label` from `messages/*.json::common.aria.*`. |

---

## 🟡 Medium-severity findings

| # | Where | Issue | Impact |
|---|---|---|---|
| M1 | `app/actions/submitAnswer.ts` | Service-client read of `questions.correct` doesn't retry on transient failure — silently marks answer wrong. | A network blip during a lesson costs the user a heart unfairly. |
| M2 | `app/(auth)/reset-password/page.tsx` | Uses `getSession()` (client-side) to redirect, while all other auth routes redirect from server. Inconsistent. | Stale-session edge cases on slow networks. |
| M3 | `components/profile/EmailChangeDialog.tsx`, `components/schools/SchoolUpsertForm.tsx`, `components/schools/LeadForm.tsx` | Form fields missing `autoComplete` attributes (`email`, `tel`, `organization`, `url`). | Password manager autofill broken; mobile keyboards don't switch type. |
| M4 | `messages/pt-BR.json` etc | `auth.email`, `auth.password` keys exist but lessons / leagues / shop / profile pages remain hardcoded PT. | EN/ES users see partial localization in core flows. |
| M5 | `components/learn/exercises/MultipleChoicePlayer.tsx`, `FillBlankPlayer.tsx` | `catch { }` swallows submission errors. UI shows frozen button with no message. | Hard-to-diagnose user reports. |
| M6 | `components/hud/NotificationsBell.tsx` | `useEffect` async ops silently fail. Bell count goes stale without indication. | User loses trust in notifications. |
| M7 | `components/profile/DeleteAccountDialog.tsx` (l. 12) | Confirmation phrase `"EXCLUIR MINHA CONTA"` hardcoded (no i18n). | EN/ES users have to type Portuguese literally. |
| M8 | `components/schools/SchoolUpsertForm.tsx` (l. 11) | UFS array hardcoded; auto-slug regex `[̀-ͯ]` inline. | Adding new countries / centralizing slug helper needs multi-file edits. |
| M9 | Dark mode coverage | Audit confirmed ~15-20 components are still light-only (LessonPath, LessonShell, LessonCompleteScreen, RoulettePanel, JackpotPanel, EditProfileForm, PublicProfile, onboarding). | User toggling dark mode sees inconsistency in the most-used screens. |
| M10 | `app/admin/page.tsx` | When non-admin user visits, renders an inline "Acesso restrito" card instead of `redirect("/")`. Other admin sub-routes redirect. Inconsistent. | Minor UX inconsistency — user might land on `/admin` and not see the redirect breadcrumb. |
| M11 | `lib/sound/synth.ts` | Audio context lazy-init runs only on first user gesture. Cold-start lessons can have audible "click" on the first SFX while context warms up. | Polish — not blocking. |

---

## 🟢 Positive patterns

| # | Finding | Why it matters |
|---|---|---|
| P1 | RLS enabled on **every** public table; 56 policies | Single source of truth for access control. App layer is defense-in-depth, not the gate. |
| P2 | Server actions consistently return `{ ok, error }` tagged union (20/21) | Type-safe error handling at every call site. |
| P3 | Webhook routes verify signatures (Stripe `constructEvent`, RevenueCat shared-secret) | No spoofable webhook attack surface. |
| P4 | Service role usage is narrow: only webhooks, exam pool fetch, account delete admin call | Blast radius of any compromised service-role key is limited to those paths. |
| P5 | All sensitive table writes (`purchases`, `subscriptions`, server-only fields) explicitly denied to client via `WITH CHECK false` | Belt and suspenders — even if RLS were bypassed, INSERTs fail. |
| P6 | Polymorphic `questions.kind` with view-only public access (`questions_public` strips `correct`) | The exam's "answer key" can never leak via API. |
| P7 | `handle_new_user()` + `handle_new_user_avatar()` Postgres triggers bootstrap `profiles` + `user_stats` automatically | No race conditions between client and server profile creation. |
| P8 | Trigger-maintained counters (`gallery_likes`, `gallery_comments`) | No counter drift; no app-layer double-counting. |
| P9 | Spaced repetition (SM-2) stored per attempt with `due_at` indexed | `/review` query is single index scan; theory_step properly excluded. |
| P10 | `next-intl` with cookie-based locale (no URL rewrites) | Capacitor universal links keep working; share-able URLs unchanged. |
| P11 | Dark mode no-flash inline script | iOS users on system dark mode see immediate dark paint on cold start. |
| P12 | BottomSheet abstraction with focus trap, drag-to-dismiss, Esc, body scroll lock | Centralized accessibility primitives; reused by all dialogs. |

---

## ⚠️ Known gaps (deferred, not bugs)

| # | Gap | Plan |
|---|---|---|
| G1 | Push daily reminder Edge Function not implemented | `supabase/functions/send-daily-reminder/` — scheduled job. See ARCHITECTURE.md §"Notifications". |
| G2 | i18n coverage incomplete for core flows (learn / leagues / shop / profile content) | Per-namespace migration in priority order. See messages/pt-BR.json for current key set. |
| G3 | Dark mode coverage incomplete for ~15 surfaces | One-line `dark:bg-X` swaps; see DB-SCHEMA.md and plan file for cheat sheet. |
| G4 | School seed data empty in prod (`schools` row count = 0) | Admin must manually create via `/admin/escolas/novo`. Otherwise `/escolas` shows empty state. |
| G5 | Lead webhook delivery not wired (`school_lead_webhooks` exists but no dispatcher) | Future: cron / Edge Function that polls fresh `school_leads`, POSTs signed payload to webhook_url, falls back to `email_notify`. |
| G6 | Gallery NSFW filter not wired | C2 above. Plan: NSFW.JS client + Google SafeSearch server. |
| G7 | Pull-to-refresh wired only in `/galeria` and `/escolas` | Extend to `/learn`, `/leagues`, `/friends`, `/profile`. |
| G8 | In-app review prompt (Capacitor) not wired | `capacitor-rate-app` after 5 lessons completed. |
| G9 | Onboarding coach is modal-only (no spotlight on actual HUD elements) | Future: data-coach attributes + bounding-box positioned tooltips. |

---

## Security observations (red-team style)

### Auth surface
- **JWT in cookies (HttpOnly, SameSite=Lax)** — XSS can't extract them.
- **OAuth state nonce** — handled by Supabase Auth.
- **Password reset link expiry** — 1h (Supabase default).
- **Rate limiting** — Supabase Auth handles login attempts; gallery upload is custom (3/24h); leads are open (relies on consent friction + ip_hash for forensics).

### Injection / data exfil
- **SQL injection** — impossible: all queries are parameterized via Supabase SDK or RPC.
- **Service role accidentally exposed** — checked: no `process.env.SUPABASE_SERVICE_ROLE_KEY` references in client components or `lib/supabase/client.ts`.
- **Open redirects** — `/login?next=X` validates X is a same-origin path (Next.js redirect normalizes).
- **CSRF on server actions** — Next.js server actions use built-in protection (origin check + same-site cookies).

### Storage
- **Public buckets** — `avatars` and `gallery` are publicly readable. That's intentional (avatars need to render for unauthenticated landing pages; gallery feed needs CDN behavior). Owner-only writes enforced by storage RLS.
- **Storage path prefix RLS** — `(storage.foldername(name))[1] = auth.uid()::text` prevents user A from uploading into user B's folder.

### LGPD / PII
- **Email + password + ip_hash** are PII. Stored encrypted at rest by Supabase.
- **`school_leads.ip_hash`** is SHA-256 truncated to 32 chars — not reversible to the IP. Acceptable for anti-fraud forensics.
- **`auth.users.deleted_at` cascade** — accounts fully removed; no soft retention.
- **Right-to-be-forgotten** — `deleteAccount` handles. (But see C1.)

### Webhook hardening
- **Stripe signature** — `stripe.webhooks.constructEvent` checks timestamp tolerance (default 5 min) + HMAC.
- **RevenueCat shared secret** — Bearer token. **Risk**: if rotated, hard-coded in `.env`. Document rotation process.
- **Cron secret** — same Bearer. Vercel Cron sends header automatically; manual triggers need explicit header.

### Native-side
- **Universal links** — `/.well-known/apple-app-site-association` returns 200 with `application/json`. Domain must match Apple Developer entitlement.
- **Sign in with Apple** — Services ID `br.com.capitaolori.web` configured; native uses App ID `br.com.capitaolori.app`.

---

## Performance observations

### Built-in next/image migration done
- Gallery feed post images, school covers + logos, OAuth avatars all use `next/image`.
- `next.config.mjs` whitelists `*.supabase.co`, `lh3.googleusercontent.com`, etc.

### Indexes
- Every common query pattern has a matching index (see DB-SCHEMA.md "Indexes" section).
- Covering index `profiles_username_avatar_idx` (INCLUDE) keeps leaderboard row queries in index-only.

### Bundle size
- First Load JS shared ≈ 223 KB (stable target).
- `react-confetti` dynamic-imported (only loads on lesson complete / outfit reveal / level up).
- next-intl messages lazy-loaded per locale (~12KB gzipped each).

### Caching strategy
- All authenticated routes `force-dynamic` (Supabase cookie can't be cached).
- Marketing + legal pages are static.
- Image optimization via Vercel CDN.

---

## Inconsistencies catalog (minor cleanups)

| Where | Inconsistency |
|---|---|
| `app/actions/notifications.ts::markAllRead` returns `{ ok: boolean }` | All others return `{ ok: true \| false, error? }` |
| `app/(auth)/reset-password/page.tsx` uses client `getSession()` | Other auth flows redirect from server |
| `app/admin/page.tsx` non-admin path renders card | Other admin paths use `redirect("/admin")` |
| `components/profile/EmailChangeDialog.tsx` email validation `!includes("@")` | Lead form uses proper regex |
| Routes `/configuracoes` uses i18n; `/profile/edit` does not | Mixed PT-only and translated copy |
| HUD reads notifications via `loadNotifications()` helper (not server action) | All other DB access goes through server actions for consistency |

None of these are blockers; flagging for housekeeping PRs.

---

## Test coverage state

Current automated coverage: **none committed** (`tests/` folder not present in repo).

Recommended additions (in priority order):
1. **End-to-end via Playwright** — top 5 flows: signup, lesson complete, exam pass, like a gallery post, submit a school lead.
2. **Server action unit tests** — validate input handling for `submitAnswer`, `completeLesson`, `submitSchoolLead`, `createGalleryPost`.
3. **Schema migration smoke tests** — apply 0001→latest on fresh local DB; verify all 30 tables + 56 policies present.
4. **RLS test suite** — for each table, attempt forbidden access as a different user; assert 0 rows / error.

---

## Build & deploy state

- **Build**: `npx next build` exits 0. 38 routes compiled. Bundle sizes within expected envelope.
- **TypeScript**: `npx tsc --noEmit` exits 0.
- **Lint**: warnings only; the previous ESLint hook-name bug (`useStreakFreeze` triggered `react-hooks/rules-of-hooks`) was fixed in commit `a9a3d90`.
- **Vercel**: production deployment on `main` branch.
- **TestFlight**: build accepted (Xcode 26 / iOS 26 SDK).
- **Supabase migrations**: 18 applied to prod (`rls_consolidation`, `gallery`, `schools` last 3 in series).

---

## Recommendation summary

**Block release** until C1, C2, C3, C4 fixed (deletion safety, NSFW, portal check, email regex).

**Fix in v1.0.1**: C5–C7 + M1–M5.

**Polish in v1.1**: M6–M11 + G1–G3 + G6–G9.

**Backlog**: tests + monitoring + analytics dashboards.
