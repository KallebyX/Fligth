# Fligth — Documentation Index

Comprehensive end-to-end documentation for the Comandante Lorí (Fligth) Brazilian Private Pilot training app.

## Documents

| File | Audience | Purpose |
|---|---|---|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Engineers, new contributors | System overview, stack, trust boundaries, data flow, key subsystems (auth, hearts, gems, leagues, SRS, push, theming, i18n) |
| [DB-SCHEMA.md](./DB-SCHEMA.md) | DBAs, backend engineers | Full table catalog (30 tables), column types, defaults, RLS policies (56), indexes (66), triggers, functions, storage buckets, migration history |
| [API.md](./API.md) | Backend engineers, integration partners | Every server action (21) and route handler (4) with signature, auth, validation, side effects, return shape, plus webhook secrets matrix |
| [ROUTES.md](./ROUTES.md) | Frontend engineers, QA | Every route (36 pages + 4 handlers) with auth/role gates, layouts, redirect graph, error/loading conventions |
| [E2E-TEST-PLAN.md](./E2E-TEST-PLAN.md) | QA, release managers | Concrete test plan per flow: auth, lesson, exam, review, leagues, shop, social, profile, settings, gallery, schools, push, native, a11y, performance, webhooks |
| [AUDIT-REPORT.md](./AUDIT-REPORT.md) | Tech leads, security | Findings catalog: 7 critical, 11 medium, 9 known gaps; security observations; performance notes; release recommendation |
| [AUTH-SETUP.md](./AUTH-SETUP.md) | Ops | Supabase Auth provider + email template config |
| [PUSH-SETUP.md](./PUSH-SETUP.md) | Ops | FCM + APNs credentials setup |

## Quick links by role

### Are you a new engineer?
Start with **ARCHITECTURE.md** (~10 min read) → then **ROUTES.md** to map the UI → then **API.md** for mutation surfaces.

### Are you a DBA / writing migrations?
**DB-SCHEMA.md** is your source of truth. Migration files live in `db/migrations/`. The `db/policies.sql` file is legacy — consolidated into `0020_rls_consolidation.sql`.

### Are you doing QA?
**E2E-TEST-PLAN.md** is the master checklist. Update statuses as you go through TestFlight / staging.

### Are you reviewing a PR?
Cross-check against **AUDIT-REPORT.md** known findings — make sure the PR isn't adding to the critical pile, and is ideally crossing one off.

### Are you doing a security review?
**AUDIT-REPORT.md** §"Security observations" + **DB-SCHEMA.md** §"RLS policies" + **API.md** §"Webhook signature & secrets matrix".

## Glossary

| Term | Meaning |
|---|---|
| ANAC | Brazilian Civil Aviation Authority — issues PPA license |
| PPA | Piloto Privado de Avião — Private Pilot License |
| SRS | Spaced Repetition System (SM-2 algorithm) |
| Streak | Consecutive days with at least 1 lesson completed |
| Streak freeze | Consumable item that "pauses" a streak for one missed day |
| Hearts | Lives system — 5 max, lose 1 per wrong answer, regen 30min |
| Gems | Soft currency — earned via lessons, spent on outfits / jackpot |
| Outfit | Cosmetic for the Comandante Lorí mascot |
| Roulette | Free daily spin — common / rare outfit |
| Jackpot | 50-gem spin — epic / legendary outfit |
| Theory step | Mini-lesson exercise (markdown content + "Entendi!" CTA, no scoring) |
| Lesson kinds | multiple_choice, match_pairs, fill_blank, true_false, tap_tiles, theory_step |
| HUD | Heads-up display — top bar with XP, streak, hearts, gems, notifications |
| RLS | Row Level Security — Postgres feature enforcing access via SQL predicates |
| Service role | Supabase admin key used in webhooks + exam pool + account-delete |
| Mascot | Comandante Lorí — the green parrot-mascot |

## Stats at a glance

| Metric | Value |
|---|---|
| TypeScript files | 215 (147 .tsx + 68 .ts) |
| Routes | 36 pages + 4 route handlers |
| Server actions | 21 |
| Edge Functions | 2 (`apply-auth-config`, `send-push`) |
| Migrations applied | 18 |
| Public tables | 30 (all RLS enabled) |
| RLS policies | 56 |
| DB indexes | 66 |
| DB triggers | 5 |
| DB functions | 8 custom + http extension |
| Content: subjects | 5 |
| Content: units | 20 |
| Content: lessons | 27 |
| Content: questions | 136 |
| Content: badges | 8 |
| Content: outfits | 8 |
| Locales | 3 (pt-BR, en, es) |
| Native shell | Capacitor 7 (iOS + Android) |

## Versioning

Each doc has an implicit version = commit hash that introduced it. The repo's `git log -- docs/` is the changelog. Major schema or API changes should bump both the migration number AND update the relevant doc in the same PR.
