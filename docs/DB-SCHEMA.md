# Database Schema — Fligth

Postgres 17.6 (Supabase managed, project `ggveduxfkljidzkrmmoo`, region `sa-east-1`). **All 30 public tables have RLS enabled.**

## Table catalog (rows in prod / nullable summary)

| Table | Rows | Purpose |
|---|---:|---|
| `profiles` | 3 | 1-to-1 with `auth.users`; username, bio, country, color, role |
| `user_stats` | 3 | XP, streak, hearts, gems, pro_until — per user |
| `user_progress` | 3 | (user, lesson) — completed_at, best_score, attempts |
| `user_question_attempts` | 43 | SM-2 SRS state per (user, question) — easiness, interval, due_at |
| `user_outfits` | 5 | Cosmetics owned (user, outfit_slug, acquired_via) |
| `user_badges` | 1 | Unlocked badges (user, badge, earned_at) |
| `user_activities` | 7 | Append-only feed (lesson_completed, badge_earned, …) |
| `subjects` | 5 | meteorologia / navegacao / teoria-voo / regulamentos / conhecimentos-tecnicos |
| `units` | 20 | Children of subjects |
| `lessons` | 27 | Children of units; `xp_reward` default 10 |
| `questions` | 136 | Polymorphic (`kind`: multiple_choice / match_pairs / fill_blank / true_false / tap_tiles / theory_step) |
| `badges` | 8 | Catalog (slug, name, criterion JSON) |
| `mascot_outfits` | 8 | Cosmetic catalog (tier, rarity, price_gems / price_cents) |
| `products` | 8 | Stripe-backed SKUs (gem packs, Pro subscriptions, lifetime) |
| `purchases` | 1 | Stripe/RC purchases (status, fulfilled_payload) — RLS denies direct writes; only service-role |
| `subscriptions` | 1 | Pro plan state (provider, status, current_period_end) |
| `leagues` | 0 | (iso_week, division) — created weekly by cron |
| `league_members` | 0 | (league_id, user_id, weekly_xp) — top-N promoted by cron |
| `mock_exam_attempts` | 2 | Simulado 100q — finished_at, total_correct, passed, scores_by_subject |
| `follows` | 0 | (follower_id, followed_id) — asymmetric graph |
| `notifications` | 0 | In-app inbox per user (kind, payload JSON, read_at) |
| `notification_prefs` | 0 | Push + email channel toggles per user |
| `push_tokens` | 0 | FCM/APNs tokens (platform, revoked_at) |
| `gallery_posts` | 0 | Community photo posts (status: pending/approved/rejected) |
| `gallery_likes` | 0 | PK (user_id, post_id); trigger bumps counter |
| `gallery_comments` | 0 | Body 1–500 chars; trigger bumps counter |
| `gallery_reports` | 0 | UNIQUE (post_id, reporter_id) — anti-abuse |
| `schools` | 0 | Aviation schools directory (slug, city, state, cursos JSONB) |
| `school_leads` | 0 | Lead capture (UTM tracking, consent, ip_hash) |
| `school_lead_webhooks` | 0 | Per-school delivery prefs |

Plus 1 view:
- `public_activities_v` — filtered subset of `user_activities` for public discover feed (only profile_public users + interesting kinds).
- `questions_public` — view exposing `id, subject_id, lesson_id, stem, kind, payload, choice_a..d, difficulty` but NOT `correct` or `explanation_md`.

---

## Column reference (canonical tables)

### `profiles` — extends `auth.users`

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | uuid | NO | — | PK = `auth.users.id` |
| username | text | YES | — | UNIQUE, case-insensitive index `profiles_username_lower_idx` |
| mascot_outfit | text | NO | 'classic' | Legacy field; use `equipped_outfit_slug` |
| current_league | text | NO | 'bronze' | bronze / silver / gold / sapphire / ruby / emerald / amethyst / pearl / obsidian / diamond |
| role | text | NO | 'student' | `student` or `admin` |
| daily_goal_xp | int | NO | 30 | 10..200 (CHECK constraint) |
| display_name | text | YES | — | Up to 40 chars |
| bio | text | YES | — | Up to 280 chars (CHECK constraint) |
| country_code | char(2) | YES | — | ISO alpha-2 |
| profile_color | text | NO | 'sky' | sky / grass / sun / alert / gold / ink |
| profile_public | bool | NO | true | Privacy toggle |
| joined_at | timestamptz | NO | now() | |
| equipped_outfit_slug | text | YES | — | FK soft → `mascot_outfits.slug` |
| avatar_url | text | YES | — | OAuth-imported OR Supabase Storage path |
| created_at | timestamptz | NO | now() | |

### `user_stats`

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| user_id | uuid | NO | — | PK |
| total_xp | int | NO | 0 | Lifetime XP |
| current_streak | int | NO | 0 | Days |
| longest_streak | int | NO | 0 | Highwater mark |
| last_activity_date | date | YES | — | UTC date |
| hearts | smallint | NO | 5 | 0..5 |
| hearts_regen_at | timestamptz | YES | — | When current depletion finishes regenerating |
| streak_freezes | smallint | NO | 0 | Inventory |
| hearts_unlimited_until | timestamptz | YES | — | Pro hearts grant |
| pro_until | timestamptz | YES | — | Subscription expiry |
| pro_plan | text | YES | — | 'monthly' / 'annual' / 'lifetime' |
| gems | int | NO | 0 | Soft currency |
| last_spin_at | timestamptz | YES | — | Roulette cooldown anchor |
| last_jackpot_at | timestamptz | YES | — | Jackpot cooldown anchor |
| profile_completed_at | timestamptz | YES | — | One-time 50-gem reward stamp |

### `questions`

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | bigint | NO | seq | |
| subject_id | smallint | NO | — | FK → subjects |
| lesson_id | int | YES | — | FK → lessons (nullable for orphan bank) |
| stem | text | NO | — | Question text |
| choice_a..d | text | NO | — | MCQ choices (legacy — also used for other kinds) |
| correct | char(1) | NO | — | 'A' / 'B' / 'C' / 'D' for MCQ; legacy 'A' for non-MCQ |
| explanation_md | text | YES | — | Shown after answer |
| difficulty | smallint | NO | 2 | 1–5 |
| source_ref | text | YES | — | Origin tag (manual_input / ANAC PDF page X) |
| kind | text | NO | 'multiple_choice' | CHECK `('multiple_choice', 'match_pairs', 'fill_blank', 'true_false', 'tap_tiles', 'theory_step')` |
| payload | jsonb | YES | — | Kind-specific schema (see ARCHITECTURE.md) |

### `user_question_attempts` (SM-2 SRS)

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | bigint | NO | seq | |
| user_id | uuid | NO | — | |
| question_id | bigint | NO | — | |
| attempted_at | timestamptz | NO | now() | |
| was_correct | bool | NO | — | |
| sm2_easiness | real | NO | 2.5 | E-factor (0–∞) |
| sm2_interval | int | NO | 0 | Days to next review |
| sm2_repetitions | int | NO | 0 | Consecutive correct |
| due_at | date | YES | — | Next eligible review date |

### `gallery_posts`

| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| id | uuid | NO | gen_random_uuid() | |
| user_id | uuid | NO | — | FK → auth.users |
| image_url | text | NO | — | Full-size (1600px max) |
| thumbnail_url | text | NO | — | 400px |
| caption | text | YES | — | ≤ 280 chars (CHECK) |
| aircraft_model | text | YES | — | "Cessna 152", etc |
| location | text | YES | — | "Aeroporto de Congonhas, SP" |
| taken_at | timestamptz | YES | — | EXIF if available |
| status | text | NO | 'pending' | CHECK `(pending, approved, rejected)` |
| rejection_reason | text | YES | — | |
| moderator_id | uuid | YES | — | Admin who actioned |
| moderated_at | timestamptz | YES | — | |
| likes_count | int | NO | 0 | Bumped by trigger |
| comments_count | int | NO | 0 | Bumped by trigger |
| created_at | timestamptz | NO | now() | |

(See migration files for the remaining 26 tables — same level of detail.)

---

## RLS policies (56 total)

### Per-user data (read/write self only)

Pattern: `auth.uid() = user_id` for ALL operations.

- `user_progress` — `"uprogress: own all"` (FOR ALL)
- `user_question_attempts` — `"uqa: own all"` (FOR ALL)
- `user_stats` — `"ustats: own all"` (FOR ALL)
- `user_outfits` — `"uoutfits: own all"` (FOR ALL)
- `user_badges` — `"ubadges: read own"` (SELECT) + `"ubadges: insert own"` (INSERT)
- `mock_exam_attempts` — `"exam: own all"` (FOR ALL)
- `notifications` — `"notif: read own"` (SELECT) + `"notif: update own"` (UPDATE — for read_at)
- `notification_prefs` — read/insert/update own
- `push_tokens` — read/insert/update/delete own
- `subscriptions` — `"subs: read own"` (SELECT) — writes only via service role
- `purchases` — `"purchases: read own"` (SELECT) + `"purchases: deny direct write"` (INSERT WITH CHECK false) + `"purchases: deny direct update"` (UPDATE USING false)

### Public read (authenticated)

Pattern: `auth.role() = 'authenticated'` for SELECT.

- `subjects`, `units`, `lessons`, `badges`, `leagues`, `mascot_outfits`
- `products` (with `WHERE active = true`)

### Mixed (own or public)

- `profiles` — `"profiles: select public or own"` USING `(auth.uid() = id OR profile_public = true)`; update own; insert self.
- `gallery_posts` — `"posts: read approved or own"` USING `((status = 'approved') OR (auth.uid() = user_id))`; insert/delete own; admin update.
- `gallery_comments` — `"comments: read all"` joined to post status check.
- `school_leads` — `"leads: read own or admin"` USING `(auth.uid() = user_id OR admin)`; insert authenticated; update admin.

### Admin gate

Pattern: `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')`.

- `gallery_posts` UPDATE (moderation)
- `gallery_reports` SELECT (read own or admin)
- `schools` ALL (admin write)
- `school_leads` UPDATE (admin only)
- `school_lead_webhooks` ALL

### Deny (force-through-view or service-role)

- `questions` SELECT — `USING (false)`. Reads MUST go through `questions_public` view (no `correct` column).
- `purchases` INSERT/UPDATE — denied; service role bypass for webhooks.

### League graph

- `league_members` — read all authenticated, insert/update own.
- `leagues` — read all authenticated.

### Social graph

- `follows` — `"follows: read"` all authenticated, insert own (requires target is `profile_public`), delete own.
- `user_activities` — `"uacts: read own"` (SELECT) + `"uacts: read followed"` (SELECT via follow relationship). Inserts via service role only.

---

## Indexes (66 total)

Highlights:

| Index | Table | Purpose |
|---|---|---|
| `profiles_username_lower_idx` | profiles | Unique case-insensitive lookup |
| `profiles_username_avatar_idx` | profiles | Covering index for leaderboard rows (INCLUDE display_name, avatar_url, profile_color) |
| `questions_kind_idx` | questions | Fast filter by kind (exam uses `kind='multiple_choice'`) |
| `questions_subject_idx`, `questions_lesson_idx` | questions | Lesson/subject scoping |
| `uqa_user_due_idx` | user_question_attempts | SRS due queue per user |
| `uqa_user_question_idx` | user_question_attempts | Latest attempt for question |
| `league_members_xp_idx` | league_members | Ranking by weekly_xp DESC |
| `ix_gallery_status_created` | gallery_posts | Feed query (status='approved' ORDER BY created_at DESC) |
| `ix_gallery_user` | gallery_posts | "Meus posts" by user |
| `ix_schools_state_city` | schools | Listing filter (state, city) WHERE status='active' |
| `ix_schools_featured` | schools | Featured promotions (featured_until DESC WHERE featured=true) |
| `ix_school_leads_school_created` | school_leads | Admin "leads per school" view |
| `notifications_user_unread_idx` | notifications | Bell badge: read_at NULLS FIRST, created_at DESC |
| `purchases_user_idx`, `purchases_status_idx` | purchases | Pro entitlement queries |
| `push_tokens_user_idx` | push_tokens | Active tokens per user WHERE revoked_at IS NULL |

All foreign keys have indexes via PK or explicit secondary indexes.

---

## Triggers

| Trigger | Table | Event | Function |
|---|---|---|---|
| `trg_gallery_likes_bump` | gallery_likes | INSERT, DELETE | `gallery_likes_bump()` — keeps `gallery_posts.likes_count` in sync |
| `trg_gallery_comments_bump` | gallery_comments | INSERT, DELETE | `gallery_comments_bump()` — keeps `gallery_posts.comments_count` in sync |
| `trg_schools_touch` | schools | UPDATE | `schools_touch_updated_at()` — sets `updated_at = now()` |

Plus `auth.users` triggers (in `auth` schema, defined via migrations):
- `on_auth_user_created` → `handle_new_user()` — inserts `profiles(id)` + `user_stats(user_id)` rows.
- `on_auth_user_created_avatar` → `handle_new_user_avatar()` — pulls OAuth `picture` into `profiles.avatar_url`.

---

## Functions / RPCs

| Function | Returns | Purpose |
|---|---|---|
| `find_user_id_by_email(p_email text)` | uuid | Server-side lookup for email change confirm flow |
| `gallery_can_upload(uid uuid)` | bool | Rate limit (< 3 uploads in last 24h). Currently NOT called from server action (inlined check) |
| `gallery_likes_bump()` | trigger | Counter maintenance |
| `gallery_comments_bump()` | trigger | Counter maintenance |
| `handle_new_user()` | trigger | Profile/stats bootstrap on signup |
| `handle_new_user_avatar()` | trigger | OAuth avatar import |
| `notify_streak_risk()` | int | Cron-callable: finds users with streak > 0 who haven't trained today; calls Edge function `send-push`. Reads vault secret `fligth_anon_key` |
| `schools_touch_updated_at()` | trigger | updated_at maintenance |

Plus the `http` extension (`http_get`, `http_post`, `http_patch` etc) — used by `notify_streak_risk` to call back into Supabase Management API + Edge functions.

---

## Storage buckets

| Bucket | Public? | RLS |
|---|---|---|
| `avatars` | Yes (read) | Owner-only insert/update/delete; path prefix `{user_id}/...` enforced by `(storage.foldername(name))[1] = auth.uid()::text` |
| `gallery` | Yes (read) | Owner-only insert/delete; same path-prefix RLS |

---

## Migrations applied (in order)

```
20260511124115  init_core_schema             # 0001 — profiles, subjects, units, lessons, questions, badges, user_stats, user_progress, user_question_attempts, user_badges, leagues, league_members, mock_exam_attempts
20260511124138  rls_policies                  # legacy `db/policies.sql` (now superseded by 0020)
20260511134729  purchases_and_products        # products, purchases tables
20260511140839  pro_subscription_and_lifetime # subscriptions table + pro_until/pro_plan cols
20260512120346  social_profiles_follows       # profile fields, follows, user_activities, public_activities_v
20260512121555  leagues_ten_tier              # 0007 — 10-tier league system
20260512121817  outfits_and_gems              # 0008 — mascot_outfits, user_outfits, gems
20260512123709  outfit_products_with_kind     # 0009 — products.kind polymorphism
20260512123720  notifications                 # 0010 — notifications + notify_user()
20260512124250  realtime_user_activities      # 0011 — realtime channel for friend feed
20260514173630  exercise_types                # 0012 — questions.kind + payload polymorphism + view rewrite
20260515153152  find_user_by_email_rpc        # 0013
20260515153347  push_tokens                   # 0014
20260515161915  pg_cron_streak_risk           # 0016 — pg_cron schedule for notify_streak_risk
20260515162258  streak_risk_use_vault         # 0017 — vault secret lookup
20260515163045  notification_preferences      # 0018 — notification_prefs table
20260515171242  profile_completion_avatars    # 0019 — profile_completed_at, avatar_url, avatars bucket
20260516154827  rls_consolidation             # 0020 — in-band rewrite of db/policies.sql
20260516154901  gallery                       # 0021 — gallery_* tables + bucket
20260516154928  schools                       # 0022 — schools + school_leads + school_lead_webhooks
```

`0015_http_extension_for_auth_setup.sql` exists in repo but was applied manually (not via migration runner). It enables the `http` extension and was used for one-time auth config bootstrap.
