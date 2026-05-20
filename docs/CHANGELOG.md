# Changelog

All notable changes to Fligth. Semver-ish: web app + native shell share
the same version stream.

The format is loosely based on [Keep a Changelog](https://keepachangelog.com/),
adapted to this repo's reality (no separate "released" line — every merge
to `main` ships to Vercel; iOS goes to TestFlight via the GitHub workflow).

## [Unreleased] — Season 1 + Battle Pass + referrals + new content

### Added — content
- **Comunicações & ICAO** new subject (id 6). Full A-Z phonetic alphabet
  with pronunciation guide, 4 R/T phraseology questions (Cleared to
  land, Wilco vs Roger, Go around, Mayday/Pan-Pan).
- **Identificação de Aeronaves** new subject (id 7). 6 multiple-choice
  questions with Wikimedia images: Cessna 172, Piper PA-28, Diamond
  DA20, Spitfire, Concorde, Boeing 747.
- **Image support for `multiple_choice`** kind — payload accepts
  image_url + image_alt + image_caption.

### Added — Battle Pass / Seasons
- `seasons`, `missions`, `user_mission_progress` tables with RLS.
- Season 1 "Decolagem" — 8 weeks, 6 missions across 3 tiers
  (Iniciante/Intermediário/Lendário). Rewards: gems, XP, outfits.
- `/season` page with hero, countdown, mission rows grouped by tier.
- Claim CTA on completed missions; idempotent via `claimed_at`.
- Hook into `completeLesson` increments lessons_completed +
  perfect_lessons + xp_earned + streak_days mission kinds.

### Added — Referrals
- `profiles.referral_code` (6-char base32 auto-generated) + `referred_by`.
- `referral_credits` table tracking who got rewarded.
- `/invite` page with share link, native Share API, copy button, placard.
- Stamp on `/callback` from `?ref=`, payout after 3rd lesson via
  `maybeGrantReferralReward` (30 days Pro stacked on `pro_until`).

### Added — UX discovery
- Feed in main nav (mobile bottom bar + desktop side bar).
- Side nav expanded: Friends, Gallery, Schools, Pro, **Season, Invite** —
  9 items total (was 5).
- Profile page CTAs: "Temporada" + "Indicar (+1 mês Pro)" buttons in
  the top action bar.

### Added — P2W consumables in `products`
- `heart_pack_5` (R$1.99) — instant 5 hearts.
- `heart_unlimited_24h` (R$4.99) — 24h unlimited hearts.
- `streak_freeze_pack_3` (R$2.99) — 3 freeze shields.

### Added — Social linking helper
- View `public.user_linked_providers` (security_invoker) aggregates
  auth.identities by provider.
- `getLinkedProviders()` server action reads identities from current
  user — ready to wire into `/profile/edit`.

### Added — SEO
- `app/sitemap.ts`: static + dynamic (per-school) entries, hourly
  revalidation.
- `app/robots.ts`: allow public pages, block authenticated app surfaces,
  point to sitemap.
- `app/layout.tsx`: metadataBase, title.template, alternates.languages
  (hreflang), Twitter image, Open Graph image, googleBot rules.
- `app/escolas/[slug]/page.tsx::generateMetadata` for per-school OG.
- JSON-LD MobileApplication + EducationalOrganization on landing.

## [Audit cycle] — post-audit polish cycle

Closes the comprehensive E2E audit catalogued in `docs/AUDIT-REPORT.md`.
27 actionable items planned (7 critical + 11 medium + 9 deferred gaps);
all 18 in-scope code findings closed, 2 partial (i18n + dark-mode tail).
Bonus: 2 ERROR-level Supabase advisor findings + 11 unindexed FKs +
9 RLS initplan optimizations.

### Added
- **24h soft-delete for accounts** (A1). New columns
  `profiles.deletion_requested_at` + `deletion_executes_at`; cron
  `process_account_deletion_queue` every 15min; banner on `/profile`
  with countdown + cancel button.
- **Server-side NSFW filter for gallery uploads** (A2). New Edge
  Function `safesearch` calls Google Cloud Vision SafeSearch;
  `gallery_posts.nsfw_score` column for forensics; graceful
  degradation if API key not set.
- **Stripe Customer Portal guard** (A3): only opens for users with
  active/trialing/past_due subs.
- **Central validators** (A4 + B8): `lib/validators.ts` with
  `EMAIL_RE`, `PHONE_RE_BR`, `USERNAME_RE`, `UFS`, `RESERVED_USERNAMES`.
- **Central slug helper** (B8): `lib/slug.ts::toSlug()` with proper
  Unicode `\p{M}` regex.
- **Submit-answer retry on transient failure** (B1): 3-attempt loop
  with backoff; distinguishes `PGRST116` from infra error.
- **Server-side reset-password redirect** (B2): converted route to
  async server component; client form extracted.
- **Inline error display in exercise players** (B5): `ExerciseShell`
  gains `errorMessage` prop; 5 players propagate caught errors.
- **NotificationsBell error state** (B6): AlertTriangle replaces
  unread chip on fetch failure; "Tentar de novo" CTA inside dropdown.
- **Dark mode coverage** (B9): top 15+ surfaces — lesson path/shell/
  complete, leaderboard row, outfit card, shop panels, profile form,
  friends cards, gallery feed, schools filters, exam runner, admin
  pages, moderation row.
- **Audio context warm-up** (B11): `lib/sound/mixer.ts::warmupAudio()`
  called on first user gesture per session via `useSfx`.
- **Daily reminder Edge Function** (C1): `send-daily-reminder` +
  RPC `daily_reminder_targets(hour_utc)` + pg_cron hourly trigger.
- **Lead webhook dispatcher Edge Function** (C5): HMAC-SHA256 signed
  POSTs to `school_lead_webhooks.webhook_url`, fallback email after
  5 failures.
- **Seed 8 Brazilian aviation schools** (C4).
- **In-app review prompt (Apple HIG)** (C8): `lib/native/rateApp.ts`
  triggers on first perfect lesson, native-only, one-shot.
- **Pull-to-refresh extension** (C7): added to `/learn`, `/leagues`,
  `/friends`, `/profile`.
- **Onboarding spotlight tour** (C9): `CoachSpotlight` renders SVG
  mask cutout + callout over real HUD chips; 4 steps; self-gated
  via localStorage.
- **Health endpoint** (E1): `/api/health` probes DB + auth + storage
  in parallel; 200 ok / 503 degraded.
- **Vercel Speed Insights** (E3) wired in `app/layout.tsx`.
- **Vitest + 118 unit tests + GitHub Actions CI** (D2 + D5):
  validators, slug, NSFW, leveling, hearts, pro, SM-2, divisions,
  validateExercise, outfits.
- **GitHub Actions cron** for `send-daily-reminder` (hourly) +
  `dispatch-school-leads` (every 5min).
- **i18n keys** for `learn`, `leagues`, `shop`, `common.aria`,
  `deleteAccount.confirmPhrase` in pt-BR / en / es. Real wiring done
  for AbandonDialog, ExerciseShell, all 5 players, BottomSheet,
  GalleryFeed, OutfitCard.
- **5 Edge Functions deployed live**: `apply-auth-config`,
  `safesearch`, `send-push`, `send-daily-reminder`,
  `dispatch-school-leads`.
- **Performance indexes**: 11 unindexed foreign keys closed
  (migration `unindexed_foreign_keys`).
- **RLS initplan optimization** on 9 hot-path policies (profiles,
  user_progress, user_question_attempts, user_stats, league_members)
  — wrapped `auth.uid()/role()` in `(select ...)` to fold into
  initplan constants.
- **Docs**: 7 markdown files in `docs/`: ARCHITECTURE, DB-SCHEMA, API,
  ROUTES, E2E-TEST-PLAN, AUDIT-REPORT, OPS, README, CHANGELOG.

### Changed
- **`/admin` non-admin path redirects to `/learn`** (B10) instead of
  rendering inline "Acesso restrito" card.
- **`markAllRead` return shape** (A5) standardized to
  `{ ok: true } | { ok: false, error }`.
- **`searchUsers` query length capped at 100 chars** (A6).
- **DeleteAccountDialog copy** rewritten for 24h grace period;
  no longer signs the user out so they can cancel.

### Fixed
- Email validation `!includes("@")` accepted `a@b` — now uses proper
  regex via `lib/validators.ts`.
- 2 ERROR-level Supabase advisor findings: `questions_public` and
  `public_activities_v` views switched to `security_invoker`.
- 4 functions had mutable `search_path`; pinned to `public, pg_temp`.
- 4 SECURITY DEFINER RPCs (`find_user_id_by_email`,
  `handle_new_user`, `handle_new_user_avatar`, `notify_streak_risk`)
  had EXECUTE granted to `anon` + `authenticated`; revoked.

### Deferred
- **i18n coverage**: scaffolding shipped (keys + 8 components wired)
  but ~150 strings still hardcoded PT in shop panels, profile edit,
  gallery upload, schools forms, onboarding.
- **Dark mode coverage**: top 15+ surfaces done; long tail of less-
  trafficked screens (admin sub-pages, onboarding steps, exam
  results) remains.
- **E2E tests** (Playwright): test infra (test Supabase project /
  ephemeral schema) needed before implementing.
- **RLS test suite**: same infra dependency.
- **External ops setup**: `GOOGLE_VISION_API_KEY` secret on Edge
  Function, APNs certs on `send-push`, "Leaked Password Protection"
  toggle, Sentry alert rules.

---

## [iOS TestFlight] — pre-audit baseline

The state before the audit cycle started. iOS build accepted by Apple
(Xcode 26 / iOS 26 SDK validation pass), 5 subjects with 27 lessons,
21 exercise variants seeded, 8 outfits + 5 leagues + Stripe & RevenueCat
checkout wired, HIG sweep on the top 4 screens. See git log before
commit `bf6591b` for the change set.
