# Capitão Lorí — Duolingo da ANAC para Piloto Privado

Web app gamificado, mobile-first, para estudar a prova teórica da ANAC de Piloto Privado de Avião (PPA). Inspirado no Duolingo: lições curtas, ofensiva diária, vidas, repetição espaçada (SRS), simulado oficial e ligas semanais.

> **Não é filiado à ANAC.** Conteúdo educacional baseado em fontes públicas (RBAC 91, ICA 100-12, MCA 100-1, AIP-Brasil).

---

## ✈️ Stack

- **Next.js 15** (App Router, RSC, Server Actions) + TypeScript
- **Supabase** (Postgres + Auth + RLS)
- **Tailwind CSS** + tailwindcss-animate
- **Framer Motion** (animações de feedback)
- **Zustand** (estado client da sessão de lição)
- **Vitest** (testes unitários da lógica de negócio)
- Deploy **Vercel** com Cron semanal de promoção de ligas

## 📐 Estrutura do projeto

```
app/                        # Next.js App Router
  (marketing)/page.tsx      # landing pública
  (auth)/login,signup,...
  onboarding/               # username + meta diária
  learn/                    # mapa de trilhas (5 matérias)
  learn/[subject]/[lesson]/ # player de lição
  review/                   # SRS — questões vencidas hoje
  exam/                     # simulado oficial 100q/3h
  leagues/                  # ranking semanal
  profile/                  # XP, streak, badges, histórico
  admin/                    # painel (gated por role=admin)
  api/cron/leagues/         # promoção semanal (Vercel Cron)
  actions/                  # Server Actions (submitAnswer, completeLesson, exam)

components/
  ui/                       # Button, Card, Input, Progress
  hud/                      # HeartsBar, XPBar, StreakBadge, HUD
  learn/                    # LessonPath, QuestionPlayer, LessonRunner, ReviewRunner
  exam/                     # ExamRunner, MockExamTimer
  mascot/                   # Capitão Lorí (papagaio aviador)

lib/
  supabase/                 # server, client, middleware, types
  srs/sm2.ts                # algoritmo SuperMemo 2 simplificado
  hearts.ts                 # regen de vidas (compute on read)
  streak.ts                 # ofensiva + freezes
  xp.ts                     # awardXP transacional
  badges.ts                 # avaliador de conquistas
  exam/scoring.ts           # 70%/disciplina, ANAC-style
  leagues/promote.ts        # cron semanal

db/
  migrations/0001_init.sql  # schema completo
  policies.sql              # RLS (seguro)

content/                    # seed versionado em git
  subjects.json             # 5 matérias
  units/<subject>.json      # ~4 unidades por matéria
  lessons/<subject>/<unit>/*.mdx
  questions/<subject>.json  # 20 questões por matéria (= 100 totais)
  badges.json

scripts/seed.ts             # importa content/ → Supabase
```

## 🚀 Como rodar

### 1. Provisionar o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No SQL editor, execute na ordem:
   - `db/migrations/0001_init.sql`
   - `db/policies.sql`
3. Em **Authentication → Providers**, deixe Email habilitado.
4. Em **Settings → API**, copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `publishable` (ou legado `anon`) → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
# preencha com as chaves do Supabase
# CRON_SECRET pode ser qualquer string aleatória longa
```

### 3. Instalar e rodar

```bash
npm install
npm run seed            # popula 5 matérias, 25 lições MDX, 100 questões e badges
npm run dev             # http://localhost:3000
```

### 4. (Opcional) regenerar tipos do banco

```bash
npx supabase gen types typescript --project-id <seu-project-id> > lib/supabase/types.ts
```

### 5. Tornar-se admin

```sql
update public.profiles set role = 'admin' where id = '<seu-user-id>';
```

## 🧪 Rodar testes

```bash
npm test                # vitest run
npm run typecheck       # tsc --noEmit
npm run lint            # next lint
```

Testes cobrem a lógica crítica isolada da UI/banco:
- `lib/srs/sm2.test.ts` — comportamento do SuperMemo 2
- `lib/streak.test.ts` — regras de ofensiva e freezes
- `lib/hearts.test.ts` — regeneração e perda de vidas
- `lib/exam/scoring.test.ts` — aprovação por disciplina (70%)

## 🎮 Loop de gamificação

| Mecânica       | Detalhe                                                                 |
| -------------- | ----------------------------------------------------------------------- |
| **XP**         | +10 por questão correta na lição, +10 bônus de conclusão, +5 em revisão |
| **Streak**     | Conta dias consecutivos com pelo menos uma atividade                    |
| **Freezes**    | Absorvem dias perdidos (ainda não distribuídos automaticamente)         |
| **Vidas**      | 5 corações; cada erro em **lição** custa 1 (revisão é segura)            |
| **Regen**      | 1 coração a cada 30 min, computado no read                              |
| **SRS**        | SM-2 simplificado: 1d / 6d / ×EF; quality<3 reseta                      |
| **Ligas**      | 4 divisões (bronze, prata, ouro, diamante); top 10 sobem, bottom 5 caem |
| **Badges**     | first_lesson, streak (3/7/30), total_xp (500/2000), exam_passed, perfect_lesson |
| **Simulado**   | 100 questões (20/matéria), 3h, ≥70 % por matéria                         |

## 🦜 Mascote

**Capitão Lorí** é um papagaio aviador SVG inline (`components/mascot/Mascot.tsx`) com 5 estados animados via Framer Motion: `idle`, `happy`, `sad`, `celebrate`, `sleeping`.

## 🎵 Sons

Coloque os arquivos em `public/sounds/` (ver `public/sounds/README.md`). O hook `useSfx()` engole erros silenciosamente — o app funciona sem eles.

## ⏰ Cron semanal de ligas

Configurado em `vercel.json` para rodar **toda segunda-feira às 03:00 UTC**. Em ambientes não-Vercel, dispare manualmente:

```bash
curl -X POST https://seu-app.vercel.app/api/cron/leagues \
     -H "Authorization: Bearer $CRON_SECRET"
```

## 🔒 Segurança

- RLS ativada em todas as tabelas. Ver `db/policies.sql`.
- Tabela `questions` **bloqueia leitura direta** (RLS deny). Clientes leem a view `questions_public` que omite `correct` e `explanation_md`. A validação acontece sempre no servidor via Server Action `submitAnswer`.
- Chave `service_role` **nunca** vai para o client; usada só pelo seed e pelo handler de cron.

## 🗺️ Roadmap pós-MVP

- [ ] Streak freezes compráveis com XP
- [ ] Cards de teoria entre questões na lição (intercalados)
- [ ] Modo dark
- [ ] Tradução EN/ES
- [ ] Push notifications (Web Push) — lembrete de ofensiva
- [ ] Áudio narrado das explicações (TTS)
- [ ] Importador de CSV via /admin

## ⚖️ Licença e conteúdo

Conteúdo redigido a partir de fontes públicas. Não há cópia de bancos comerciais. Use, edite e contribua.
