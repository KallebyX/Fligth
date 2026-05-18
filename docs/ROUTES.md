# Routes Reference — Fligth

36 pages + 4 API handlers. All `app/...` routes follow Next.js 15 App Router conventions.

## Conventions

- Every protected route starts with `const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/login")`.
- Every dynamic protected route exports `export const dynamic = "force-dynamic"` (so Supabase auth cookie isn't cached).
- Admin routes additionally check `if (profile?.role !== 'admin') redirect("/admin")` (which itself renders an access-denied card).
- Server components do Promise.all parallel queries; client components handle interactions.

## Master route table

| Path | File | Type | Auth? | Role? | Dynamic | What it renders |
|---|---|---|---|---|---|---|
| `/` | `app/(marketing)/page.tsx` | client | No | — | static | Landing with animated CTAs to `/login`, `/signup`; DeletedBanner from query param |
| `/login` | `app/(auth)/login/page.tsx` | client | No | — | static | Email/password form + OAuthButtons + link to forgot/signup |
| `/signup` | `app/(auth)/signup/page.tsx` | client | No | — | static | Email/password + features list; shows email-confirmation screen if Supabase confirm is ON |
| `/forgot-password` | `app/(auth)/forgot-password/page.tsx` | client | No | — | static | Email input → `resetPasswordForEmail(email, {redirectTo: /callback?next=/reset-password})` |
| `/reset-password` | `app/(auth)/reset-password/page.tsx` | client | session-only (no redirect to /login) | — | static | New password input → `updateUser({password})`; redirects to /forgot-password if no session |
| `/callback` | `app/(auth)/callback/route.ts` | route handler | n/a | — | dynamic | Exchanges OAuth code / token_hash for session → redirects to `next` or `/onboarding` |
| `/privacy` | `app/(legal)/privacy/page.tsx` | static | No | — | static | LGPD policy text |
| `/terms` | `app/(legal)/terms/page.tsx` | static | No | — | static | ToS text |
| `/support` | `app/(legal)/support/page.tsx` | static | No | — | static | Contact / FAQ |
| `/learn` | `app/learn/page.tsx` | server | Yes | — | dynamic | HUD + OnboardingCoach + WelcomeBanner + StreakAtRiskCard (conditional) + 5 LessonPath trees |
| `/learn/[subject]/[lesson]` | `app/learn/[subject]/[lesson]/page.tsx` | server | Yes | — | dynamic | LessonShell → ExercisePlayer; redirects to `/learn?out=hearts` if hearts=0 |
| `/leagues` | `app/leagues/page.tsx` | server | Yes | — | dynamic | HUD + Podium + LeaderboardRow list + LevelUpDialog + ResetTimer |
| `/exam` | `app/exam/page.tsx` | server | Yes | — | dynamic | ExamRunner — 100 questions, 3h timer, kind=MCQ only |
| `/exam/results/[id]` | `app/exam/results/[id]/page.tsx` | server | Yes | — | dynamic | Score breakdown by subject, pass/fail, confetti if passed |
| `/review` | `app/review/page.tsx` | server | Yes | — | dynamic | ReviewRunner — SRS due queue (≤ 20 per session, dedupe, theory_step excluded) |
| `/shop` | `app/shop/page.tsx` | server | Yes | — | dynamic | Product grid (BuyButton → Stripe Checkout). Reads via service client (RLS bypass) |
| `/shop/outfits` | `app/shop/outfits/page.tsx` | server | Yes | — | dynamic | RoulettePanel + JackpotPanel + OutfitCard grid (owned/all/free/prize/paid tabs) |
| `/shop/success` | `app/shop/success/page.tsx` | server | Yes | — | dynamic | Reads `?session_id=...` → calls `fulfillPurchase()` (idempotent) → shows what was awarded |
| `/friends` | `app/friends/page.tsx` | server | Yes | — | dynamic | UserSearch + UserCard grid; tabs `?tab=following|followers|suggestions` |
| `/friends/feed` | `app/friends/feed/page.tsx` | server | Yes | — | dynamic | ActivityFeed with infinite scroll; tabs `?tab=amigos|descobrir` |
| `/profile` | `app/profile/page.tsx` | server | Yes | — | dynamic | Self profile (PublicProfile + badges + activity + exams + prefs + sign-out). Shows ClaimUsernameCard if username null |
| `/profile/[username]` | `app/profile/[username]/page.tsx` | server | Yes | — | dynamic | Other-user profile; respects `profile_public` (locked card if private and not self) |
| `/profile/edit` | `app/profile/edit/page.tsx` | server | Yes | — | dynamic | EditProfileForm + AvatarPicker + OutfitPicker + NotificationPrefsSection + SecuritySection |
| `/onboarding` | `app/onboarding/page.tsx` | server (client steps) | Yes | — | dynamic | Multi-step: display_name + country + daily_goal + mascot color/outfit. Finishes → `/learn` |
| `/configuracoes` | `app/configuracoes/page.tsx` | server | Yes | — | dynamic | Notifications + Sound + Privacy + Theme + Language + Account + Explore + About sections |
| `/galeria` | `app/galeria/page.tsx` | server | Yes | — | dynamic | PullToRefresh + GalleryFeed (status=approved) + EmptyGallery state |
| `/galeria/novo` | `app/galeria/novo/page.tsx` | server | Yes | — | dynamic | UploadForm — file picker → client resize → Supabase Storage → createGalleryPost |
| `/galeria/meus` | `app/galeria/meus/page.tsx` | server | Yes | — | dynamic | Own posts with status badges (pending/approved/rejected + reason) |
| `/escolas` | `app/escolas/page.tsx` | server | Yes | — | dynamic | PullToRefresh + SchoolFilters + School cards. Reads only `status='active'` (RLS) |
| `/escolas/[slug]` | `app/escolas/[slug]/page.tsx` | server | Yes | — | dynamic | School detail: cover + logo + cursos + contact + LeadForm |
| `/pro` | `app/pro/page.tsx` | server | Yes | — | dynamic | Pro plans + CTA → Stripe Checkout or RevenueCat (native) |
| `/pro/manage` | `app/pro/manage/page.tsx` | server | Yes (+ pro) | — | dynamic | Subscription status + CTA → `openStripePortal()` |
| `/admin` | `app/admin/page.tsx` | server | Yes | admin | Stats grid (subjects, questions, users, etc) + links to sub-admin |
| `/admin/escolas` | `app/admin/escolas/page.tsx` | server | Yes | admin | Schools list + "Nova escola" CTA |
| `/admin/escolas/novo` | `app/admin/escolas/novo/page.tsx` | server | Yes | admin | SchoolUpsertForm (create) |
| `/admin/escolas/[id]` | `app/admin/escolas/[id]/page.tsx` | server | Yes | admin | SchoolUpsertForm (edit) |
| `/admin/gallery/queue` | `app/admin/gallery/queue/page.tsx` | server | Yes | admin | Pending posts FIFO with ModerationRow (approve / reject with reason picker) |

## Layouts

| Layout file | Wraps | Renders |
|---|---|---|
| `app/layout.tsx` | everything | `<html lang>` + NO_FLASH_SCRIPT + NextIntlClientProvider + ThemeProvider + BiometricGate + NativeOAuthListener + PwaRegister |
| `app/learn/layout.tsx` | `/learn` only (NOT `/learn/[subject]/[lesson]`) | AppShell (intentionally NO HUD — HUD is in `/learn/page.tsx` directly) |
| `app/leagues/layout.tsx` | `/leagues` | AppShell + HUD |
| `app/profile/layout.tsx` | `/profile/*` | AppShell + HUD |
| `app/(marketing)/layout.tsx` | `/` | Minimal — no HUD, no AppShell |
| `app/(auth)/layout.tsx` | `/login`, `/signup`, `/forgot-password`, `/reset-password` | Centered card layout, no nav |
| `app/(legal)/layout.tsx` | `/privacy`, `/terms`, `/support` | Centered prose layout |

## Error / loading conventions

- `app/global-error.tsx` — root-level error boundary (last resort)
- `app/profile/error.tsx`, `app/profile/edit/error.tsx` — error boundary with `confused` mascot + "Tentar de novo" button
- `app/not-found.tsx` — global 404 page with `confused` mascot
- `loading.tsx` files in `/learn`, `/galeria`, `/escolas`, `/configuracoes` — skeleton placeholders matching final shape

## Redirect graph (key paths)

```
/                      ── if user logged in → /learn (via OAuthButtons / header)
                       └─ else → /signup or /login

/login                 ── if email confirmation OFF + signup → /onboarding
                       └─ else → /learn (?next=X if provided)

/signup                ── on success + session → /onboarding
                       └─ if email confirmation required → stays on confirmation screen

/callback (route handler) ── if user has no username → /onboarding
                          └─ else → query.next ?? /learn

/onboarding            ── on finish → /learn

/profile (no username) ── shows ClaimUsernameCard with CTA → /profile/edit

/learn/[s]/[l] (no hearts)  ── /learn?out=hearts
/exam (in-progress)         ── prevents start of new attempt

/admin (not admin)     ── /admin renders "Acesso restrito" inline (no redirect)
/admin/gallery/queue (not admin) ── redirect("/admin")
/admin/escolas/* (not admin)     ── redirect("/admin")

Sign out → /  (root)
Account delete → /?deleted=1
```

## Auth boundary checklist (every server-rendered route)

```ts
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) redirect("/login");

// optional admin guard:
const { data: profile } = await supabase
  .from("profiles")
  .select("role")
  .eq("id", user.id)
  .single();
if (profile?.role !== "admin") redirect("/admin");
```

**Routes WITHOUT auth check** (confirmed intentional):
- `/`, `/login`, `/signup`, `/forgot-password`, `/privacy`, `/terms`, `/support`
- `/callback/route.ts` (exchange phase — session not yet set)
- `/reset-password` (session-only check — bypasses login but isolated to password reset flow)

**Routes WITH auth check** but NO admin check despite admin-only intent: none found. All `/admin/*` paths verify role.
