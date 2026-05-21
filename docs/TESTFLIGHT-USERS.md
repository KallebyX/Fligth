# TestFlight Test Accounts

6 users criados no Supabase auth com variedade de estados (XP, streak, gems, hearts) pra
beta testers terem material pra testar.

⚠️ **Estes são accounts de teste para TestFlight INTERNAL — não compartilhar publicamente.**
Recriar quando rotacionar senhas (ver script no fim).

## Accounts

Todos os emails são `*@capitaolori.com` (domínio fake — não recebem email real, só servem
pra login com senha). `email_confirmed_at` está setado, então **não precisam clicar em link
de confirmação** — login direto.

| Email | Senha | Username | XP | Streak | Hearts | Gems | Persona |
|---|---|---|---:|---:|---:|---:|---|
| `tester1@capitaolori.com`   | `TestPilot2026!` | `@tester_1`  |    0 |  0 | 5 |   0 | Onboarding 0 — tela em branco |
| `tester2@capitaolori.com`   | `TestPilot2026!` | `@tester_2`  |  150 |  3 | 5 |  25 | Iniciante, ofensiva curta |
| `tester3@capitaolori.com`   | `TestPilot2026!` | `@tester_3`  |  320 |  7 | 4 |  80 | Intermediário, 1 vida perdida |
| `demo@capitaolori.com`      | `DemoPilot2026!` | `@demo`      |  580 | 12 | 5 | 150 | Demo público — apresentações |
| `internal@capitaolori.com`  | `TestPilot2026!` | `@internal`  |  880 | 18 | 3 | 220 | Power user, hearts baixos pra testar HeartsOutCard |
| `review@capitaolori.com`    | `AppleReview!1`  | `@review`    | 1240 | 24 | 5 | 320 | Conta pra App Store Review form |

## Para que serve cada um

- **tester1** — testar onboarding zero, primeira lição, primeira gem.
- **tester2** — feed de amigos vazio, escolas listadas, primeiro simulado.
- **tester3** — heart regen timer (hearts < max), revisão SRS deve ter coisas.
- **demo** — para gravar vídeo de demo / screenshots. Conta visualmente "rica".
- **internal** — HeartsOutCard ativo (3/5), streak >18 dias = `streak_at_risk` se passar 18h sem treinar.
- **review** — credenciais que vão no formulário do App Store Review ("Demo account for Apple review"). Senha forte porque a Apple muitas vezes verifica.

## Como testers se autenticam

1. Instala build do TestFlight no iPhone.
2. Abre o app → tela de login.
3. Cola email + senha da tabela acima → "Entrar".
4. Cai direto em `/learn` (não precisa onboarding pq username já está setado).

OAuth (Google/Apple via web) **não funciona** com esses accounts — eles são "email only".
Para testar OAuth, criar nova conta via signup com Apple ID/Google real.

## Re-rodar / criar mais

Script idempotente (skip-on-exists). Roda via Supabase SQL editor ou MCP:

```sql
-- Ver: docs/testflight-users.sql
```

Pra rotacionar senhas, atualiza via:

```sql
update auth.users
set encrypted_password = crypt('NovaSenha2026!', gen_salt('bf', 10)),
    updated_at = now()
where email = 'tester1@capitaolori.com';
```

## Como deletar todos

Quando terminar o beta:

```sql
delete from auth.users where email like '%@capitaolori.com';
-- Cascade deleta profiles, user_stats, user_progress, user_outfits, etc.
```
