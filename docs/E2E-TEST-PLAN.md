# End-to-End Test Plan — Fligth

Every critical user journey, with concrete verification steps. Designed to be run manually on TestFlight + Vercel preview before each public release.

## Conventions

- 🟢 Happy path
- 🟡 Edge / boundary
- 🔴 Failure / rollback / abuse
- ✅ Pass = verified state in DB + UI
- ⚠️ Known gap (see AUDIT-REPORT.md)

---

## 0. Pre-flight infrastructure

- [ ] Supabase project `ggveduxfkljidzkrmmoo` healthy (Project URL responds 200).
- [ ] All 18 migrations applied (`supabase mcp list_migrations` returns 18+ entries).
- [ ] All 30 public tables have `rls_enabled = true` (`list_tables` shows no `false`).
- [ ] Build green: `npx next build` exits 0.
- [ ] Type check green: `npx tsc --noEmit` exits 0.
- [ ] Vercel deployment: latest commit on `main` is live.
- [ ] Env vars set: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `REVENUECAT_WEBHOOK_TOKEN`, `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `SENTRY_DSN`.

---

## 1. Auth flows

### 1.1 Email/password signup 🟢
1. Visit `/signup`.
2. Enter fresh email + password ≥ 6 chars → submit.
3. **If email confirmation ON**: confirmation screen appears with mascot in `celebrate` state.
4. **If email confirmation OFF**: redirects to `/onboarding`.
5. ✅ DB: `auth.users` row created, `profiles(id)` and `user_stats(user_id)` rows auto-inserted by `handle_new_user()`.

### 1.2 Email confirmation 🟢
1. Click confirmation link in inbox.
2. Lands on `/callback?...&type=email&next=/onboarding`.
3. Callback verifies OTP, sets cookie, redirects to `/onboarding`.

### 1.3 Login 🟢
1. Visit `/login`, enter credentials, submit.
2. Redirects to `/learn` (or `?next=...`).
3. ✅ Cookies: `sb-access-token` + `sb-refresh-token` set HttpOnly.

### 1.4 OAuth — Google 🟢
1. Click "Continuar com Google" on `/login`.
2. Provider consent screen.
3. Returns to `/callback?code=...&next=/learn`.
4. ✅ `profiles.avatar_url` populated from Google `picture` (via `handle_new_user_avatar()`).

### 1.5 OAuth — Apple (native iOS) 🟢
1. Tap "Continuar com Apple" inside TestFlight build.
2. Native sheet (Face ID + email confirm).
3. App returns to `/callback` (universal link or in-app handler).
4. ✅ Session active in WebView.

### 1.6 Forgot password 🟢
1. `/login` → "Esqueci minha senha" → `/forgot-password`.
2. Enter email → "Enviar link".
3. Mascot transitions `thinking` → `celebrate`. Success card shown.
4. Click link in email → `/callback?...&type=recovery&next=/reset-password`.
5. Set new password → redirects to `/learn`.

### 1.7 Logout 🟢
1. From `/profile` or `/configuracoes`, click "Sair".
2. Redirects to `/`. Cookies cleared.

### 1.8 Biometric gate 🟡
1. On native, enroll biometric in `/configuracoes` → SecuritySection → "Desbloqueio biométrico" ON.
2. Background app → reopen.
3. Face ID/Touch ID prompt blocks UI until success.
4. Deny prompt → forces logout.

### 1.9 Session expiry 🟡
1. Manually clear `sb-*` cookies in DevTools while on `/learn`.
2. Trigger a server action (e.g., follow user).
3. Action returns `{ ok: false, error: "unauthenticated" }`.
4. Page should redirect to `/login` on next nav.

### 1.10 Email change (double confirmation) 🟢
1. `/profile/edit` → SecuritySection → "Mudar email" → BottomSheet.
2. Enter new email → submit.
3. Two emails sent (current + new). Both must click their link.
4. Until both confirm, email stays at old address.

### 1.11 Delete account 🔴 (destructive!)
1. `/profile/edit` → SecuritySection → "Excluir conta" → BottomSheet.
2. Type exact phrase `EXCLUIR MINHA CONTA`.
3. "Excluir tudo" enabled → click.
4. `auth.users` row deleted → cascade nukes profiles/stats/progress/badges/outfits/follows/notifications.
5. Redirects to `/?deleted=1`. Biometric flag cleared.
6. ⚠️ KNOWN: no email confirmation, no 24h grace.

---

## 2. Onboarding 🟢

1. Fresh user lands on `/onboarding`.
2. Step 1: Welcome (mascot celebrate).
3. Step 2: Display name input.
4. Step 3: Country picker (BR / PT / US / ES / AR / MX).
5. Step 4: Daily goal (10–60 XP).
6. Step 5: Color + outfit picker.
7. "Bora começar!" → `/learn`.
8. ✅ `profiles` updated: display_name, country_code, daily_goal_xp, profile_color, equipped_outfit_slug.

### OnboardingCoach (first visit to /learn)
1. After first `/onboarding` finish → `/learn` loads.
2. Coach modal opens automatically (gated by `localStorage["lori.onboarding.coach_seen.v1"]`).
3. 5 steps walk through: welcome, streak, hearts, gems, ready.
4. "Bora começar!" or "Pular" → coach closes, localStorage flag set.
5. Reload `/learn` → coach does NOT reappear.

---

## 3. Lesson flow

### 3.1 Start a lesson 🟢
1. `/learn` shows 5 subject paths with serpentine nodes.
2. First node per subject is `available` (yellow ring); rest locked (gray).
3. Tap available node → `/learn/{subject}/{lesson}`.
4. LessonShell renders: theory (if any) → "Vamos voar!" CTA → "Começar lição".
5. Tap CTA → ExercisePlayer mounts.

### 3.2 Multiple choice 🟢
1. Question stem + 4 options.
2. Tap option → button highlights.
3. Tap "Verificar" → server validates → bottom drawer shows correct/incorrect + explanation.
4. Wrong: heart decrements; SFX `wrong` plays; mascot turns `sad`.
5. Right: gem-jingle SFX; mascot turns `happy`; explanation green.
6. "Continuar" advances.

### 3.3 Match pairs 🟢
1. Two columns: left fixed (e.g., "VFR"), right shuffled (e.g., "Visual Flight Rules").
2. Tap left, then tap matching right → line drawn.
3. All 4 connections → auto-submit.
4. Server validates (`validateMatchPairs`).

### 3.4 Fill blank 🟢
1. Template "A pressão padrão é {0} hPa" with empty slot.
2. Word bank below: ["1013.25","1000","850","30.00"].
3. Tap tile in bank → moves to slot.
4. Tap slot → removes back to bank.
5. "Verificar" enabled when slot filled → submit.

### 3.5 True / False 🟢
1. Statement card + ✓ Verdadeiro / ✕ Falso buttons.
2. Tap → server validates → drawer.

### 3.6 Tap tiles 🟢
1. Random-order tiles for a sentence.
2. Tap to add to ordered answer area; tap in answer to remove.
3. "Verificar" submits → server compares array.

### 3.7 Theory step 🟢
1. Markdown rendered.
2. "Entendi!" button always present, only outcome.
3. Awards +5 XP (vs +10 for question kinds).
4. ✅ DOES NOT create `user_question_attempts` row (skip SRS).
5. ✅ DOES NOT decrement hearts on any path.

### 3.8 Abandon lesson 🟡
1. Tap X in top-left of ExerciseShell → AbandonDialog (BottomSheet).
2. "Continuar lição" cancels.
3. "Sair mesmo assim" → router.push("/learn"). Progress lost. Hearts lost stay deducted.

### 3.9 Complete lesson 🟢
1. Last exercise → LessonCompleteScreen mounts.
2. Confetti runs 3.2s (gold if goalJustHit, standard otherwise).
3. Animated XP counter → `+N XP`.
4. Stats: XP, theory count, streak, hearts.
5. "Perfect" gold badge if `correctCount === (totalCount - theoryCount)`.
6. ✅ DB: `user_progress` upserted (completed_at, best_score). `user_stats.total_xp += N`, `current_streak` bumped (idempotent per day). `user_activities('lesson_completed', payload)`. `league_members.weekly_xp += N`.

### 3.10 Hearts depletion 🔴
1. Get 5 wrong answers in a row → hearts = 0.
2. Player redirects to `/learn?out=hearts`.
3. HeartsOutCard shows live countdown to next regen.
4. CTA: "Assinar Pro" + "Esperar 30min".

### 3.11 Streak risk 🟡
1. Backdated `last_activity_date = yesterday`, `current_streak > 0`, local time ≥ 18h, `streak_freezes > 0`.
2. `/learn` shows StreakAtRiskCard between WelcomeBanner and subjects.
3. "Usar escudo" calls `redeemStreakFreeze`.
4. ✅ `user_stats.streak_freezes -= 1`, `last_activity_date = today`, `current_streak` preserved.

---

## 4. Review (SRS) 🟢

1. `/review` queries `user_question_attempts WHERE due_at <= today` AND `kind != 'theory_step'`.
2. Dedupe per question_id (keep latest).
3. Cap at 20 per session.
4. Empty state if no due: mascot `happy` + "Tudo em dia!".
5. ReviewRunner uses ExercisePlayer (same as lesson) but `context: "review"`.
6. ✅ After answering, SM-2 reschedule: correct → easiness up + interval grows; wrong → reset to 1 day.

---

## 5. Mock exam (Simulado 100q)

### 5.1 Start exam 🟢
1. `/exam` → "Iniciar simulado" button.
2. `startExam()` returns 20 random per subject (`kind = 'multiple_choice'` only).
3. ExamRunner mounts with 3h timer.
4. ✅ `mock_exam_attempts` row inserted (`started_at` now).

### 5.2 Take exam 🟢
1. 100 questions, no hearts mechanic, no XP per question.
2. Navigate forward/back with `<` `>` buttons.
3. Tap option → button highlights but no immediate validation.
4. Timer counts down top-right.

### 5.3 Submit exam 🟢
1. "Finalizar" → confirmation.
2. `submitExam({attemptId, answers})` → server scores.
3. Redirects to `/exam/results/{attemptId}`.
4. ✅ DB: `mock_exam_attempts` updated with finished_at, total_correct, passed, scores_by_subject (JSONB).

### 5.4 Results screen 🟢
1. Score: X/100 + green/red pass/fail.
2. Confetti if passed (>= 70 + min 70% per subject).
3. Subject breakdown bars.
4. CTA: "Tentar de novo" → `/exam`.

### 5.5 Exam contains no non-MCQ 🟡 (regression test)
1. Add a `match_pairs` question to DB.
2. Run startExam 10 times.
3. None of the picks include the match_pairs (filtered by `.eq("kind", "multiple_choice")`).

---

## 6. Leagues

### 6.1 First placement 🟢
1. Earn XP via lesson.
2. `league_members` row auto-created in current week's bronze division (or last week's if there's history).

### 6.2 Leaderboard render 🟢
1. `/leagues` shows: division header, your rank (if > 3), Podium (top 3), LeaderboardRow list.
2. iPhone SE 320px: Podium pedestals (`h-16 sm:h-24`, `h-20 sm:h-32`, `h-12 sm:h-20`) don't crowd mascot.

### 6.3 Promotion cron 🟢
1. Manual trigger: `curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://app.vercel.app/api/cron/leagues`.
2. ✅ Top N promote, bottom N demote.
3. `user_activities('league_promoted')` inserted.
4. Next visit to `/leagues` triggers LevelUpDialog modal.

---

## 7. Shop

### 7.1 Daily roulette 🟢
1. `/shop/outfits` → "Girar grátis" available.
2. Spin animates 5 rotations easeOut.
3. OutfitRevealDialog with confetti (rarity-color if rare).
4. Outfit added to `user_outfits` (or +20 gems consolation if duplicate).
5. ✅ `user_stats.last_spin_at = now()`.

### 7.2 Jackpot 🟢
1. With ≥ 50 gems + cooldown passed: "Girar por 50 gems".
2. Spins 7 rotations easeOut + gold drop-shadow.
3. Reveals epic/legendary outfit with full confetti + Sparkles orbiting mascot.
4. ✅ `user_stats.gems -= 50`, `last_jackpot_at = now()`.

### 7.3 Equip outfit 🟢
1. `/profile/edit` → OutfitPicker tab "Próprios".
2. Tap owned outfit → equips.
3. ✅ `profiles.equipped_outfit_slug` updated.
4. Mascot in HUD + LessonShell uses new outfit.

### 7.4 Buy outfit with gems 🟢
1. `/shop/outfits` → tap locked outfit (paid tier).
2. Confirmation: "100 gems → desbloquear?"
3. ✅ gems debited, outfit unlocked.

### 7.5 Stripe checkout 🟢
1. `/pro` → "Assinar Pro Mensal" → `startCheckout("pro_monthly")`.
2. Redirect to Stripe Checkout.
3. Pay (test card 4242…).
4. Return to `/shop/success?session_id=...`.
5. `fulfillPurchase()` idempotent: `subscriptions.status='active'`, `user_stats.pro_until` set.

### 7.6 RevenueCat IAP 🟢 (native only)
1. iOS app → `/pro` → "Assinar" → RevenueCat sheet.
2. Apple In-App Purchase confirmation.
3. RevenueCat webhook → `/api/revenuecat/webhook` → fulfill.
4. ✅ Same `subscriptions` + `user_stats.pro_until` state.

### 7.7 Restore purchases 🟢 (native only)
1. `/profile/edit` → SecuritySection → "Restaurar compras".
2. RevenueCat `getCustomerInfo()` lists active entitlements.
3. ✅ Re-fulfills if missing.

### 7.8 Manage Pro 🟢
1. Pro user visits `/pro/manage` → "Abrir portal".
2. `openStripePortal()` → Stripe Customer Portal.
3. Cancel / change plan / update card.
4. ⚠️ KNOWN: no check that user has Stripe sub before portal call.

---

## 8. Social (friends + activity)

### 8.1 Follow flow 🟢
1. `/friends?tab=suggestions` → tap "Seguir" on a card.
2. `followUser(targetId)` inserts `follows` row.
3. Optimistic UI: button → "Seguindo".
4. ✅ Target receives notification (in-app + push if push_friends ON).

### 8.2 Activity feed 🟢
1. `/friends/feed?tab=amigos`.
2. Cursor-paginated activities from followed users (lesson_completed, badge_earned, league_promoted).
3. `?tab=descobrir` shows `public_activities_v` for non-followed public users.

### 8.3 Self-follow blocked 🔴
1. Manually POST `followUser` with own id.
2. Server returns `{ ok: false, error: "self_follow" }`.

### 8.4 Follow private user 🔴
1. User B is private (`profile_public=false`).
2. A POSTs `followUser(B.id)`.
3. RLS rejects (INSERT policy requires target.profile_public).

---

## 9. Profile

### 9.1 Edit profile 🟢
1. `/profile/edit` → CompletionMeter shows 60% (e.g., missing bio + photo).
2. Fill bio (≤ 280), upload avatar → preview updates.
3. Submit → `updateProfile` + `updateAvatar`.
4. ✅ profiles fields updated, avatar uploaded to `avatars/<user_id>/avatar.jpg`.
5. Hit 100% → `claimCompleteProfileReward` → +50 gems toast.

### 9.2 Username claim 🟢
1. Fresh OAuth user → `/profile` shows ClaimUsernameCard.
2. "Escolher username" → `/profile/edit`.
3. Set username via `setUsername("pilot_eduardo")`.
4. ✅ Validates `/^[a-z0-9_]{3,20}$/` + reserved set check.
5. UNIQUE index ensures no duplicates.

### 9.3 View other profile 🟢
1. From `/friends`, tap card → `/profile/@friend`.
2. Renders PublicProfile + badges + activity (read-only).
3. "Seguir" button if not already following.

### 9.4 Private profile blocked 🔴
1. User B has `profile_public=false`.
2. A visits `/profile/{B.username}`.
3. Page shows "Perfil privado" lock state.
4. ✅ DB query returns empty due to RLS `profile_public = true OR auth.uid() = id`.

---

## 10. Settings

### 10.1 Toggle notifications 🟢
1. `/configuracoes` → Notifications section.
2. Toggle "Ofensiva em risco" OFF.
3. ✅ `notification_prefs.push_streak = false`.
4. Next cron `notify_streak_risk` skips this user.

### 10.2 Change theme 🟢
1. Aparência → tap "Escuro".
2. `html` gains `class="dark"`, transition 180ms.
3. Reload page → no flash (NO_FLASH_SCRIPT applies before hydrate).
4. ✅ `localStorage["lori.theme"] = "dark"`.

### 10.3 Change language 🟢
1. Idioma → tap "English".
2. `setLocale("en")` writes cookie + revalidates.
3. UI re-renders in EN within ~500ms (transition spinner during).
4. ✅ `document.cookie` contains `NEXT_LOCALE=en`.

### 10.4 Mute sound mixer 🟢
1. Som & vibração → Master mute toggle.
2. ✅ Localstorage `lori.mixer.v1.master.muted = true`.
3. Subsequent SFX silenced.

### 10.5 Privacy toggle 🟢
1. Privacidade → "Perfil público" OFF.
2. ✅ `profiles.profile_public = false`.
3. Logged-out users / other users see "Perfil privado" instead.

---

## 11. Community Gallery

### 11.1 Upload photo 🟢
1. `/galeria/novo` → tap dashed area → file picker.
2. Select 5MB JPG → preview renders.
3. Add caption + aircraft model + location → "Enviar para moderação".
4. Client resizes to 1600px (main) + 400px (thumb), 0.85 JPEG.
5. Uploads to `gallery/<user_id>/<uuid>.jpg` + `_thumb.jpg`.
6. `createGalleryPost` writes row `status='pending'`.
7. Success screen → redirect to `/galeria/meus`.

### 11.2 Upload rate-limit 🔴
1. Upload 3 photos in same day → 4th attempt.
2. Server returns `{ ok: false, error: "rate_limited" }`.
3. UI: "Limite diário (3) atingido. Tente amanhã."

### 11.3 Approve in moderation 🟢
1. Login as admin user.
2. `/admin/gallery/queue` → see pending post.
3. Tap "Aprovar" → `moderateGalleryPost({decision:'approve'})`.
4. ✅ `gallery_posts.status='approved'`, moderator_id set.
5. Post appears in `/galeria` feed within seconds (revalidatePath).

### 11.4 Reject with reason 🟢
1. Admin queue → tap "Rejeitar" → menu with 5 reasons.
2. Pick "Conteúdo impróprio".
3. ✅ status='rejected', rejection_reason saved.
4. Original poster sees rejection on `/galeria/meus`.

### 11.5 Like post 🟢
1. `/galeria` → tap heart on a post.
2. Optimistic toggle.
3. `toggleGalleryLike` upserts `gallery_likes` row.
4. Trigger updates `gallery_posts.likes_count`.
5. Refresh → count persists.

### 11.6 Comment 🟢
1. (Future — endpoint exists at `createGalleryComment`).

### 11.7 Pull-to-refresh on /galeria 🟢
1. On mobile, drag down from top of feed.
2. ArrowDown rotates 180° as pull reaches threshold.
3. Haptic medium fires at threshold cross.
4. Release → spinner shows → router.refresh().

### 11.8 NSFW upload 🔴 (KNOWN GAP)
1. Upload an NSFW image → currently goes through.
2. ⚠️ No NSFW.JS filter wired. Falls back to admin moderation.

---

## 12. Schools

### 12.1 Browse listing 🟢
1. `/escolas` (empty state for now — no schools seeded).
2. After admin creates: see cards with logo, city, courses chips.

### 12.2 Filter by state 🟢
1. Tap "SP" chip → URL becomes `/escolas?uf=SP`.
2. Only SP schools rendered.

### 12.3 Submit lead 🟢
1. `/escolas/{slug}` → fill LeadForm (name, email, phone, course).
2. Check "Autorizo compartilhar" → "Enviar".
3. ✅ `school_leads` row inserted with utm_* + ip_hash.
4. If first lead per (user, school): +10 gems awarded.
5. Success screen with `+10 gems` chip.

### 12.4 Lead validation 🔴
1. Submit with phone `"abc"`.
2. Server returns `{ ok: false, error: "phone_invalid" }`.

### 12.5 Lead without consent 🔴
1. Don't check consent → submit.
2. Client blocks ("Marque a caixa de consentimento").
3. Server also rejects (`consent_required`).

### 12.6 Admin school create 🟢
1. `/admin/escolas/novo` → fill SchoolUpsertForm.
2. Slug auto-generates from name (NFD-stripped).
3. Add 2 cursos (PP-A R$ 25000, 6 meses; PC-A R$ 50000, 12 meses).
4. Save → redirect to `/admin/escolas`.
5. ✅ schools row created, slug unique enforced.

### 12.7 Admin school edit 🟢
1. `/admin/escolas/{id}` → form pre-filled.
2. Mark "Destaque" → save.
3. ✅ `schools.featured = true`. Card bubbles to top of public listing.

---

## 13. Push notifications (KNOWN: needs end-to-end test)

### 13.1 Register token 🟢
1. iOS app first launch → permission prompt accepted.
2. Capacitor `PushNotifications.register()` triggers `registration` event.
3. Token captured → `registerPushToken({token, platform: 'ios'})`.
4. ✅ `push_tokens` row with `revoked_at = null`.

### 13.2 Streak risk reminder 🟢
1. User has streak > 0, last_activity_date < today.
2. Cron `notify_streak_risk()` runs at 18:00 user local.
3. ✅ Push notification arrives on device.
4. Tap notification → app opens to `/learn`.

### 13.3 Daily reminder Edge Function ⚠️ (DEFERRED)
- Not yet implemented. Plan: `supabase/functions/send-daily-reminder/`.

### 13.4 Friend activity push 🟢
1. User A follows user B (push_friends=true).
2. B completes a lesson with perfect score.
3. `user_activities` insert triggers a friend notification fan-out.
4. ✅ A receives push (within 30s).

---

## 14. Native iOS-specific

### 14.1 Splash screen 🟢
1. Cold launch app.
2. Splash shows Mascot on sky background until BiometricGate resolves.

### 14.2 Status bar style 🟢
1. App opens.
2. Status bar text dark (because `UIUserInterfaceStyle = Light` in Info.plist).

### 14.3 Universal links 🟢
1. Open `https://capitaolori.com/learn` in iMessage on iPhone with app installed.
2. App opens directly to `/learn` (not Safari).
3. Requires `apple-app-site-association` JSON served at `/.well-known/`.

### 14.4 Restore purchases 🟢 (see 7.7)

### 14.5 Sign in with Apple native 🟢 (see 1.5)

### 14.6 Biometric enroll prompt 🟡
1. After 1st login, user sees biometric enroll prompt overlay.
2. "Ativar" → enrolls. "Agora não" → dismisses (re-prompted later).

---

## 15. A11y / Reduced motion

### 15.1 Tab keyboard nav 🟢
1. Open `/configuracoes` on desktop.
2. Tab through toggles.
3. Each focused toggle shows sky ring (focus-visible ring-2).

### 15.2 Screen reader (VoiceOver iOS) 🟢
1. Enable VoiceOver.
2. Navigate `/learn` → each lesson node announces title.
3. HUD chips announce "12 XP", "5 vidas restantes".
4. ExerciseShell progress announces "Progresso 50%".

### 15.3 Prefers-reduced-motion ON 🟢
1. iOS Settings → Accessibility → Reduce Motion ON.
2. Mascot stops blinking/flapping.
3. Confetti suppressed on LessonComplete, LevelUp, OutfitReveal.
4. LessonPath nodes don't bounce in.
5. MCQ options don't stagger entrance.
6. JackpotPanel spinning wheel renders static (via SpinningWheel internal check).

---

## 16. Performance / Lighthouse targets

Run Lighthouse Mobile (Slow 4G, 4x CPU throttle) on:
- `/learn` — LCP < 2.5s, TBT < 200ms, CLS < 0.1
- `/galeria` (with 60 posts) — same targets
- `/escolas/{slug}` — same targets

Verify:
- [ ] `next/image` is in use for school logos, gallery thumbs (not raw `<img>`).
- [ ] First Load JS shared ≤ 230KB.
- [ ] No console errors / warnings.

---

## 17. Webhooks

### 17.1 Stripe checkout.session.completed 🟢
1. Trigger test event via Stripe Dashboard.
2. `/api/stripe/webhook` returns 200.
3. ✅ `purchases.status = 'fulfilled'`, `subscriptions.current_period_end` set.

### 17.2 Stripe customer.subscription.deleted 🟢
1. Cancel sub in Stripe.
2. Webhook fires.
3. ✅ `subscriptions.status = 'canceled'`, `user_stats.pro_until` cleared.

### 17.3 RevenueCat INITIAL_PURCHASE 🟢
1. Trigger test event in RC.
2. `/api/revenuecat/webhook` 200.
3. ✅ Same fulfillment as Stripe path.

### 17.4 Cron weekly 🟢 (see 6.3)

---

## 18. Regression — release gate

Before tagging release:

- [ ] Build green
- [ ] TypeScript clean (`tsc --noEmit`)
- [ ] Lint warnings only — no errors
- [ ] All 18 sections above pass on staging (Vercel preview)
- [ ] iPhone SE 320px width: no horizontal overflow on any of `/learn`, `/leagues`, `/profile/[username]`, `/galeria`, `/escolas`
- [ ] iPhone 14 Pro: HUD respects safe-area-inset-top (not under notch)
- [ ] Sentry receiving events (test: throw in `/api/health`)
- [ ] Vercel deployment URL responds 200 for `/api/cron/leagues` with bearer token
- [ ] Capacitor `npx cap sync ios` runs clean before TestFlight build
- [ ] App icon set complete (20 / 29 / 40 / 60 / 76 / 83.5 / 1024 in all idioms)
