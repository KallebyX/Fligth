# Architecture — Capitão Lorí (Fligth)

Aviation theory training app for Brazilian Private Pilot (PPA) license. Duolingo-style with 5 subjects, 25 lessons, 100-question mock exams, leaderboards, gems shop, and a community gallery.

## Stack at a glance

| Layer | Tech | Notes |
|---|---|---|
| Web framework | Next.js 15 App Router (TypeScript) | Server components by default, server actions for mutations |
| Auth | Supabase Auth (email/password + OAuth Google/Apple) | Native Sign in with Apple via Capacitor |
| Database | PostgreSQL 17 (Supabase managed) | Row Level Security enabled on every public table |
| Storage | Supabase Storage | Buckets: `avatars` (public), `gallery` (public read, owner write) |
| Native shell | Capacitor 7 (iOS + Android) | Remote-URL mode: WebView loads from Vercel (Next.js server-rendered). `webDir: "public"` only |
| Hosting | Vercel | Dynamic SSR (`ƒ` for almost every route) |
| Payments | Stripe (web) + RevenueCat (iOS/Android IAP) | Webhooks update `purchases` + `subscriptions` |
| Push | FCM (Android) + APNs (iOS) via custom Edge Function `send-push` | Tokens stored in `push_tokens` |
| i18n | next-intl v4 | Cookie-based `NEXT_LOCALE` (PT-BR / EN / ES), no URL rewrites |
| Theming | Tailwind + custom CSS vars + ThemeProvider | Light / Dark / Auto (system) with no-flash inline script |
| Observability | Sentry (server + client + edge) | Tunneled via `/monitoring` to survive ad-blockers |

## Repository layout

```
app/                  # Next.js routes + server actions
  (auth)/             # /login, /signup, /forgot-password, /reset-password, /callback
  (legal)/            # /privacy, /terms, /support
  (marketing)/        # / (landing)
  admin/              # /admin + sub-routes (gallery moderation, schools CRUD)
  api/                # Route handlers: /api/cron/leagues, /api/stripe/webhook, /api/revenuecat/webhook
  actions/            # 21 server actions (mutations)
  learn/              # /learn (trail), /learn/[subject]/[lesson] (player)
  leagues/, shop/, friends/, profile/, configuracoes/, galeria/, escolas/, exam/, review/, pro/, onboarding/
components/           # 147 .tsx files grouped by feature
  hud/, mascot/, learn/, learn/exercises/, leagues/, shop/, profile/, settings/, gallery/, schools/
  ui/                 # Primitives: Button, Input, Card, BottomSheet, Skeleton, PullToRefresh
  nav/, auth/, theme/, onboarding/, hearts/, exam/, friends/
lib/                  # Pure logic + helpers
  supabase/           # client + server + service-role factories + types.ts (hand-maintained)
  outfits/, leagues/, exercises/, sound/, push/, leveling.ts, hearts.ts, dailyGoal.ts, pro.ts,
  motion.ts, haptics.ts, capacitor.ts, revenuecat.ts
db/
  migrations/         # 18 numbered SQL files, all applied to prod
  policies.sql        # Legacy RLS file — now consolidated into migration 0020
content/              # Seed data for subjects, units, lessons, questions, badges, outfits
  questions/<subject>.json
  units/<subject>.json
  lessons/<subject>/<unit>/*.mdx
i18n/
  request.ts          # next-intl server config
messages/             # pt-BR.json, en.json, es.json
supabase/functions/   # Edge Functions: apply-auth-config, send-push
ios/                  # Capacitor iOS native project
docs/                 # ← this folder
scripts/              # seed.ts, gen-icons.mjs, generate-types, etc
```

## Trust boundaries

```
┌──────────────┐    HTTPS    ┌──────────────┐   server    ┌──────────────┐
│   Browser    │ ──────────► │   Next.js    │ ──────────► │   Supabase   │
│  / iOS-WV /  │             │   on Vercel  │  RLS-guarded│   Postgres   │
│   Android    │ ◄────────── │  server comps│  via JWT    │              │
└──────────────┘             └──────────────┘             └──────────────┘
       │                            │                            │
       │ Capacitor plugins          │ Service role only in        │
       │ (PushNotifications,        │ admin paths + webhooks      │
       │  Biometric, SignInApple)   │ (checkout, exam pool fetch, │
       │                            │  webhook fulfillment)       │
       │                            │                            │
       │                     ┌──────────────┐                    │
       │                     │   Stripe     │ ◄── webhook ────── │
       │                     │  RevenueCat  │                    │
       │                     │   FCM/APNs   │                    │
       │                     └──────────────┘                    │
       │                                                         │
       └─── reads `NEXT_LOCALE` cookie + `lori.theme` localStorage
            (no PII; UX preferences only)
```

**Key principles:**
- Every mutation goes through a **server action** that checks `supabase.auth.getUser()` first.
- The **anon key** travels with the browser; **service role** stays server-side and is used only in: webhooks (Stripe, RevenueCat), exam pool selection (needs to read `correct` field), and admin checks (`deleteAccount`, `profiles.role`).
- Row Level Security is the **authoritative** access control — server-action checks are defense-in-depth, not the source of truth.
- Webhook routes verify signatures (`stripe.webhooks.constructEvent`) or shared secrets (RevenueCat `Authorization: Bearer`) before processing.

## Data flow: completing a lesson (golden path)

```
User answers MCQ → ExercisePlayer.handleSubmit
  → submitAnswer({ questionId, choice })           [server action]
    → supabase.auth.getUser()                      [auth]
    → service.from("questions").select("correct")  [service role to read 'correct']
    → calculate was_correct
    → insert into user_question_attempts           [SM-2 spaced repetition row]
    → if !was_correct: decrement hearts, insert another row with shorter interval
    → if kind === "theory_step": skip SRS insert
    → return { ok, correct, explanation }

… repeat for N exercises in the lesson …

ExercisePlayer.handleFinish
  → completeLesson({ lessonId, correctCount, theoryCount, totalCount })
    → supabase.auth.getUser()
    → calculate xp = correct*10 + theory*5 + (perfect ? 10 : 0)
    → update user_stats: total_xp += xp, current_streak (idempotent per day),
                         hearts (unchanged), gems (no change unless perfect bonus)
    → upsert user_progress (lesson_id, completed_at, best_score, attempts)
    → if first-time perfect: insert user_badges  + user_activities('badge_earned')
    → insert user_activities('lesson_completed', payload: { lesson_title, perfect, has_mixed_kinds })
    → upsert league_members (this week's xp += xp)
    → revalidatePath("/learn")
    → return { ok, xpAwarded, perfect, goalJustHit, newStreak }
```

## Auth flows

### Email + password
1. `/signup` POSTs to `supabase.auth.signUp({email, password})`.
2. If email confirmation is ON (default), Supabase sends confirmation email → user clicks → `/callback?next=/onboarding` exchanges the code for a session → redirects.
3. If confirmation is OFF, session is returned immediately → straight to `/onboarding`.

### OAuth (Google, Apple)
1. `OAuthButtons` calls `supabase.auth.signInWithOAuth({provider, redirectTo: '/callback?next=...'})`.
2. After provider redirect, `/callback/route.ts` exchanges the code, sets session cookies, redirects.

### Native Sign in with Apple (iOS)
1. Capacitor plugin `SignInWithApple` returns identity token natively.
2. Token sent to `supabase.auth.signInWithIdToken({provider: 'apple', token})`.
3. Same callback handling.

### Password reset
1. `/forgot-password` → `supabase.auth.resetPasswordForEmail(email, {redirectTo: '/callback?next=/reset-password'})`.
2. User clicks email link → callback exchanges recovery code → `/reset-password` form → `supabase.auth.updateUser({password})`.

### Biometric (Face ID / Touch ID)
- `BiometricGate` wraps the app shell. On launch, if `lori.biometric.enrolled === 'true'`, prompt the device biometric. If approved, render children; if denied, force logout.

## Spaced Repetition (SRS) — SM-2 algorithm

Stored per (user, question) in `user_question_attempts`:
- `sm2_easiness` (default 2.5) — how easy this question is for this user
- `sm2_interval` (days)
- `sm2_repetitions` (consecutive correct count)
- `due_at` (date) — next time this question should appear in `/review`

Recalculated on every attempt; questions with `due_at <= today` flow into the daily review pool. `kind === 'theory_step'` is excluded — mini-lessons don't repeat.

## Leagues / weekly competition

- 10 divisions: bronze → diamond_3.
- Each ISO week, every active user is placed in a `league_members` row (league_id chosen by previous week's division).
- XP earned during the week accumulates in `league_members.weekly_xp`.
- Monday 03:00 UTC cron (`/api/cron/leagues`, Bearer `CRON_SECRET`) runs `promoteWeek()`:
  - Top N promote to next division, bottom N relegate.
  - Outfit prizes awarded based on rank.
  - Next week's leagues seeded.

## Hearts / lives

- 5 hearts max. Lose 1 per wrong answer (except `theory_step`).
- Regen: 1 heart every 30 min from `hearts_regen_at`.
- Pro users: `hearts_unlimited_until` set → hearts query returns 5 always.
- Streak freezes (`streak_freezes`): can be redeemed to skip a missed day without losing streak.

## Gems / monetization

- Earn: lessons, perfect bonuses, league rewards, school lead first contact (+10 gems), gallery first approved post (+25 gems badge — placeholder).
- Spend: outfit purchases (paid tier), jackpot spins (50 gems each).
- Currency stays internal — Stripe/RevenueCat purchases credit gems via webhook fulfillment.

## Pro subscription

- Plans: monthly, annual, lifetime.
- Stripe (web checkout) or RevenueCat (iOS/Android IAP).
- `user_stats.pro_until` (timestamptz, nullable) + `pro_plan` (text, nullable).
- `lib/pro.ts::computeProStatus` returns `{ isPro, expiresAt, plan }`.
- Pro grants: hearts unlimited, ad-free (no ads currently), Pro badge in HUD, exclusive outfits.

## Notifications

- `notifications` table for in-app inbox (with `read_at`).
- `notification_prefs` per-user per-channel toggles (push_streak, push_friends, push_leagues, push_promotions, email_product_updates, email_security).
- Push delivery via FCM (Android) and APNs (iOS) called by the `send-push` Edge Function. Triggered by:
  - `notify_streak_risk()` Postgres function (cron 18:00 user-local).
  - Inline calls from `followUser`, `lessonCompleted` (friend activity), etc.

## Theming

`tailwind.config.ts` declares `darkMode: ['class']`. ThemeProvider toggles `<html class="dark">` based on `lori.theme` localStorage (`light` / `dark` / `auto`). No-flash script reads the value before React hydrates so the initial paint matches the user's choice.

Token map:
- Light: `bg-cloud`, `text-ink`, `border-cloud-deep`
- Dark: `bg-ink-deep`, `text-cloud`, `border-ink-light/60`
- Component classes (`card-pop`, `card-soft`) embed both variants so consumers don't repeat.

## Internationalization

- next-intl v4 with `cookie`-based locale (no URL rewriting — `/learn` stays `/learn` in EN).
- Server: `getTranslations("namespace")`.
- Client: `useTranslations("namespace")`.
- Messages split per locale in `messages/*.json`, lazy-loaded by the request config.
- **Content stays PT-BR** — lessons, questions, exam are not translated (Brazilian ANAC content).

## Native (Capacitor)

- iOS: Xcode project at `ios/App/`. Bundle ID `br.com.capitaolori.app`. `UIUserInterfaceStyle = Light` until dark mode rollout completes in native too.
- Android: Capacitor 7 standard scaffold (not deployed yet).
- The native shell loads `server.url` (Vercel deployment URL) — `webDir: "public"` is unused at runtime.
- Plugins active: `@capacitor/push-notifications`, `@aparajita/capacitor-biometric-auth`, `@capacitor/status-bar`, RevenueCat SDK.

## What's intentionally not on the path

- Service workers / offline mode (PWA shell exists; full offline not designed).
- Real-time collaboration (no presence on /leagues — refresh-only).
- WebRTC / voice (TTS happens client-side via browser API).
- Push for the first cold-start (token registers only after first foreground after granting permission).
