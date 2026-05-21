# API Reference — Server Actions & Route Handlers

The app has **21 server actions** (in `app/actions/*.ts`) for mutations and **4 API route handlers** (in `app/api/*` and `app/(auth)/callback/route.ts`).

All server actions follow this convention:
- Begin with `"use server";`
- Call `await supabase.auth.getUser()` first; return `{ ok: false, error: "unauthenticated" }` if no user (with exceptions noted)
- Return `{ ok: true, ...payload } | { ok: false, error: string }` (tagged union)
- Call `revalidatePath(...)` after writes
- Run on the Vercel server (not edge)

---

## Server actions

### `app/actions/locale.ts`

| Function | Signature | Auth? | Validates | Writes | Notes |
|---|---|---|---|---|---|
| `setLocale(next: string)` | `→ { ok: true } \| { ok: false, error }` | **NO** (intentional) | `isLocale(next)` against allowlist | Cookie `NEXT_LOCALE` (1yr, SameSite=Lax) | `revalidatePath("/", "layout")` |

### `app/actions/profile.ts`

| Function | Signature | Auth? | Validates | Writes | Notes |
|---|---|---|---|---|---|
| `updateProfile(input)` | `→ { ok, error? }` | Yes | display_name ≤ 40, bio ≤ 280, country 2-char, color in COLORS set | profiles | revalidatePath profile pages |
| `setUsername(raw)` | `→ { ok, error? }` | Yes | `/^[a-z0-9_]{3,20}$/`, RESERVED set | profiles.username | UNIQUE index enforces |

### `app/actions/avatar.ts`

| Function | Signature | Auth? | Validates | Writes | Notes |
|---|---|---|---|---|---|
| `updateAvatar(avatarUrl)` | `→ { ok, error? }` | Yes | `isSafeUrl()` (length, scheme) | profiles.avatar_url | |

### `app/actions/completeLesson.ts`

| Function | Signature | Auth? | Validates | Writes | Notes |
|---|---|---|---|---|---|
| `completeLesson(input)` | `{ lessonId, correctCount, theoryCount, totalCount, hasMixedKinds }` → `{ ok, xpAwarded, perfect, goalJustHit, newStreak }` | Yes | content via service client | user_progress, user_stats, user_badges, user_activities, league_members | XP = correct·10 + theory·5 + perfect·10. revalidatePath("/learn") |

### `app/actions/submitAnswer.ts`

| Function | Signature | Auth? | Validates | Writes | Notes |
|---|---|---|---|---|---|
| `submitAnswer(input)` | `{ questionId, context: 'lesson' \| 'review' \| 'exam', response }` → `{ ok, correct, explanation, hearts }` | Yes | validateExercise() per `kind` (server-side) | user_question_attempts (skip if theory_step), user_stats (hearts deduction) | Uses service client to fetch `correct` |

### `app/actions/exam.ts`

| Function | Signature | Auth? | Validates | Writes | Notes |
|---|---|---|---|---|---|
| `startExam()` | `→ { ok, attemptId, questions } \| { ok: false, error }` | Yes | Picks 20 random MCQ per subject (service client) | mock_exam_attempts | `.eq("kind", "multiple_choice")` filter applied |
| `submitExam(input)` | `{ attemptId, answers }` → `{ ok, totalCorrect, passed, scoresBySubject }` | Yes | Ownership check via service | mock_exam_attempts, user_stats, badges, user_activities | revalidatePath("/learn") |

### `app/actions/review.ts` (deduced from `/review` consumers — file not separately enumerated)

The review queue is computed in `app/review/page.tsx` directly via `select ... from user_question_attempts where due_at <= today` and rendered with `ExercisePlayer`. SRS update goes through `submitAnswer` with `context: "review"`.

### `app/actions/streakFreeze.ts`

| Function | Signature | Auth? | Validates | Writes | Notes |
|---|---|---|---|---|---|
| `redeemStreakFreeze()` | `→ { ok: true, freezesLeft, current_streak } \| { ok: false, error }` | Yes | `freezes > 0`, not already active today | user_stats | revalidatePath("/learn") |

### `app/actions/follow.ts`

| Function | Signature | Auth? | Validates | Writes | Notes |
|---|---|---|---|---|---|
| `followUser(targetId)` | `→ { ok, error? }` | Yes | self-follow blocked; target must be profile_public (RLS-enforced) | follows | notifyUser() to target |
| `unfollowUser(targetId)` | `→ { ok, error? }` | Yes | — | follows | |

### `app/actions/discover.ts`

| Function | Signature | Auth? | Validates | Writes | Notes |
|---|---|---|---|---|---|
| `searchUsers(query)` | `→ Array<UserCardData>` | Yes | `query.length >= 2` only | (read) profiles WHERE profile_public | ⚠️ No max length on query |
| `suggestedUsers()` | `→ Array<UserCardData>` | Yes | — | (read) profiles + follows | Random sample of public users not yet followed |

### `app/actions/feed.ts`

| Function | Signature | Auth? | Validates | Writes | Notes |
|---|---|---|---|---|---|
| `getFollowingFeed(cursor?)` | `→ { items, nextCursor }` | Yes | — | (read) user_activities + follows | Activities from followed users |
| `getDiscoverFeed(cursor?)` | `→ { items, nextCursor }` | Yes | — | (read) public_activities_v | Filtered public activities |
| `getActivityById(id)` | `→ Activity \| null` | Yes | — | (read) user_activities | |

### `app/actions/notifications.ts`

| Function | Signature | Auth? | Validates | Writes | Notes |
|---|---|---|---|---|---|
| `listRecent()` | `→ { items, unreadCount }` | Yes | — | (read) notifications | |
| `markAllRead()` | `→ { ok: boolean }` | Yes | — | notifications.read_at | ⚠️ Inconsistent return shape — should be `{ ok, error? }` |

### `app/actions/notificationPrefs.ts`

| Function | Signature | Auth? | Validates | Writes | Notes |
|---|---|---|---|---|---|
| `getNotificationPrefs()` | `→ NotificationPrefs` | Yes (else DEFAULTS) | — | (read) notification_prefs | Returns defaults if no row |
| `updateNotificationPrefs(patch)` | `→ { ok, error? }` | Yes | — | notification_prefs (upsert on user_id) | |

### `app/actions/pushToken.ts`

| Function | Signature | Auth? | Validates | Writes | Notes |
|---|---|---|---|---|---|
| `registerPushToken(input)` | `{ token, platform, deviceLabel? }` → `{ ok, error? }` | Yes | `token.length >= 16` | push_tokens (upsert on token) | |
| `revokePushToken(token)` | `→ { ok, error? }` | Yes | — | push_tokens (revoked_at = now()) | |

### `app/actions/outfits.ts`

All delegate to `lib/outfits/*.ts` after `requireUser()`.

| Function | Signature | Auth? | Notes |
|---|---|---|---|
| `equipOutfit(slug)` | `→ { ok, error? }` | Yes | profiles.equipped_outfit_slug update |
| `spinRouletteAction()` | `→ { ok, outfit, isDuplicate, gemsAwarded, nextSpinAt }` | Yes | Daily roulette, common/rare only. 24h cooldown. Duplicate refunds 20 gems |
| `spinJackpotAction()` | `→ { ok, outfit, isDuplicate, gemsRefunded, gemsBalance, nextSpinAt }` | Yes | Costs 50 gems. 1h cooldown. Epic/legendary pool. Duplicate refunds 30 gems |
| `purchaseOutfitWithGems(slug)` | `→ { ok, gemsRemaining }` | Yes | Direct outfit purchase by gems |

### `app/actions/checkout.ts`

| Function | Signature | Auth? | Validates | Writes | Notes |
|---|---|---|---|---|---|
| `startCheckout(sku)` | `→ { ok, url } \| { ok, error }` | Yes | sku lookup via service client | purchases (status='pending') | Returns Stripe Checkout Session URL |

### `app/actions/openStripePortal.ts`

| Function | Signature | Auth? | Validates | Writes | Notes |
|---|---|---|---|---|---|
| `openStripePortal()` | `→ { ok, url } \| { ok, error }` | Yes | ⚠️ No subscription existence check | (none) | ⚠️ Creates portal session even if user has no Stripe sub |

### `app/actions/claimCompleteProfileReward.ts`

| Function | Signature | Auth? | Validates | Writes | Notes |
|---|---|---|---|---|---|
| `claimCompleteProfileReward()` | `→ { ok, gemsAwarded }` | Yes | Profile completion ≥ 100% | profiles, user_stats (gems += 50, profile_completed_at = now()) | Idempotent via profile_completed_at NOT NULL check |

### `app/actions/gallery.ts`

| Function | Signature | Auth? | Validates | Writes | Notes |
|---|---|---|---|---|---|
| `createGalleryPost(input)` | `{ imagePath, thumbnailPath, caption?, aircraftModel?, location?, takenAt? }` → `{ ok, postId }` | Yes | Rate limit 3 / 24h, caption ≤ 280 | gallery_posts (status='pending') | revalidatePath × 2 |
| `toggleGalleryLike(postId)` | `→ { ok, liked, likesCount }` | Yes | — | gallery_likes (insert or delete) | Trigger updates counter |
| `createGalleryComment(input)` | `{ postId, body }` → `{ ok, commentId }` | Yes | body 1–500 chars | gallery_comments | |
| `reportGalleryPost(input)` | `{ postId, reason, details? }` → `{ ok, error? }` | Yes | reason enum | gallery_reports | Treats UNIQUE violation as success |
| `moderateGalleryPost(input)` | `{ postId, decision, rejectionReason? }` → `{ ok, error? }` | Yes + admin | decision enum | gallery_posts.status, moderator_id, moderated_at | Double-checks admin role |

### `app/actions/schools.ts`

| Function | Signature | Auth? | Validates | Writes | Notes |
|---|---|---|---|---|---|
| `submitSchoolLead(input)` | `{ schoolId, name, email, phone, courseInterest?, message?, consent, source?, utm? }` → `{ ok, leadId, reward }` | Yes | name 2–100, email regex, phone regex, consent=true | school_leads + IP hash + (best-effort) user_stats.gems += 10 | revalidatePath("/escolas") |

### `app/actions/adminSchools.ts`

| Function | Signature | Auth? | Authorization | Writes | Notes |
|---|---|---|---|---|---|
| `upsertSchool(input)` | `SchoolUpsertInput` → `{ ok, schoolId }` | Yes | admin only (`requireAdmin()`) | schools (insert or update) | slug regex, UF regex, email regex |
| `setSchoolStatus(id, status)` | `→ { ok, error? }` | Yes | admin only | schools.status | enum 'active'/'suspended'/'inactive' |

### `app/actions/deleteAccount.ts`

| Function | Signature | Auth? | Validates | Writes | Notes |
|---|---|---|---|---|---|
| `deleteAccount(input)` | `{ confirmText }` → `{ ok } \| { ok: false, error }` | Yes | `confirmText === "EXCLUIR MINHA CONTA"` exactly | auth.users (via service-role `admin.deleteUser`) — cascades to profiles, user_stats, etc | Sentry capture; signs user out after deletion |

---

## API route handlers

### `GET app/(auth)/callback/route.ts`

OAuth + magic link + recovery code exchange.

- Query params: `code` XOR `token_hash` + `type` + `next?`
- Validates: code XOR token_hash required
- Calls: `supabase.auth.exchangeCodeForSession()` OR `supabase.auth.verifyOtp()` based on type
- After session: queries `profiles.username` to detect new-user state → redirect to `/onboarding` if null, else `next` param

### `GET/POST app/api/cron/leagues/route.ts`

Weekly league promotion job. Triggered by Vercel Cron at Monday 03:00 UTC.

- Auth: `Authorization: Bearer ${process.env.CRON_SECRET}`
- 401 if header missing/wrong
- Calls `promoteWeek()` from `lib/leagues/`
- Returns `{ ok, promotedCount, demotedCount, weekIso }`

### `POST app/api/stripe/webhook/route.ts`

Stripe events.

- Auth: `stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)`
- 9 event types handled (checkout.session.completed, customer.subscription.created/updated/deleted, invoice.paid, invoice.payment_failed, …)
- Updates `purchases` (fulfillment) and `subscriptions` (current_period_end, status)
- Sentry captures errors; returns 200 even on logic errors (Stripe expects 2xx for delivered)

### `POST app/api/revenuecat/webhook/route.ts`

RevenueCat events (iOS/Android IAP).

- Auth: `Authorization: Bearer ${process.env.REVENUECAT_WEBHOOK_TOKEN}` (custom secret)
- 6 event types handled (INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION, BILLING_ISSUE, PRODUCT_CHANGE)
- Maps RevenueCat product ID → SKU → fulfill via same path as Stripe
- Unknown product IDs logged but acked 200

---

## Edge functions

### `supabase/functions/apply-auth-config/`

One-time bootstrap: patches Supabase Auth config via Management API (OAuth providers, email templates). Run manually.

### `supabase/functions/send-push/`

HTTP-triggered Edge Function. Reads target user IDs from body, fetches `push_tokens`, fans out to FCM/APNs based on platform. Called by `notify_streak_risk()` and by `notifyUser()` helper in `lib/notifications.ts`.

---

## Critical findings & inconsistencies

| # | Severity | Where | Issue |
|---|---|---|---|
| 1 | **CRITICAL** | `deleteAccount.ts` | Only protection on permanent account deletion is the string `"EXCLUIR MINHA CONTA"`. No email-confirm step, no 24h delay. |
| 2 | **HIGH** | `openStripePortal.ts` | No validation that the user has an active Stripe subscription before creating portal session. Burns API calls and confuses users. |
| 3 | **HIGH** | `notifications.markAllRead` | Returns `{ ok: boolean }` instead of standard `{ ok: true } \| { ok: false, error }` tagged union. |
| 4 | **MEDIUM** | `discover.searchUsers` | Only validates `query.length >= 2`; no max length. SQL injection-safe via parameterization, but Postgres full-text scan on a 10MB query string would DOS. |
| 5 | **LOW** | `locale.setLocale` | No auth required — intentional for landing page, but document as such. |
| 6 | **CRITICAL** | `gallery.createGalleryPost` | No server-side content scan (NSFW filter). Rate-limit-only protects against volume, not category. |
| 7 | **MEDIUM** | `submitAnswer` | Service-client read of `correct` is necessary, but failures (network blip) silently mark answer wrong. Better: throw 503 so client retries. |

---

## Webhook signature & secrets matrix

| Secret env var | Used by | Source |
|---|---|---|
| `STRIPE_WEBHOOK_SECRET` | `/api/stripe/webhook` | Stripe Dashboard → Webhooks |
| `STRIPE_SECRET_KEY` | server-side Stripe SDK | Stripe Dashboard → API Keys |
| `REVENUECAT_WEBHOOK_TOKEN` | `/api/revenuecat/webhook` | Custom string in RC config |
| `CRON_SECRET` | `/api/cron/leagues` (and Vercel Cron header) | Random string in Vercel + cron config |
| `SUPABASE_SERVICE_ROLE_KEY` | server actions (exam, checkout, webhook fulfillment) | Supabase Project Settings |
| `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server (RLS path) | Public |
| `FCM_PROJECT_ID` + `FCM_PRIVATE_KEY` | `send-push` Edge Function | Firebase Console |
| `APNS_KEY_ID` + `APNS_TEAM_ID` + `APNS_AUTH_KEY` | `send-push` Edge Function | Apple Developer |
| `SENTRY_DSN` (+ `_AUTH_TOKEN` for source maps) | `instrumentation.ts` | Sentry Project |
