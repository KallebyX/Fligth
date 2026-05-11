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

## 📱 Mobile (iOS + Android) com Capacitor

O app é **PWA-first** (instala direto pelo navegador no celular) e está **embrulhado em Capacitor** para distribuição na App Store e na Google Play.

### Pré-requisitos

- **Android Studio** (https://developer.android.com/studio) + JDK 17.
- **Xcode 15+** + Apple Developer account (somente macOS).
- Node 20+, npm.

### Comandos disponíveis

```bash
npm run icons              # regenera PNGs do mascote (public/icons/)
npm run mobile:assets      # gera todos os ícones + splash de iOS e Android a partir de /assets
npm run mobile:sync        # propaga código + plugins para android/ e ios/
npm run mobile:open:ios    # abre Xcode (apenas macOS)
npm run mobile:open:android # abre Android Studio
npm run mobile:run:ios     # build + run em simulador iOS
npm run mobile:run:android # build + run em emulador/device Android
```

### Como funciona

`capacitor.config.ts` aponta `server.url` para a deploy de produção da Vercel (`https://fligth.vercel.app`). Os apps nativos abrem **um WebView que carrega o app online** — então Server Actions, autenticação Supabase, middleware e RLS funcionam exatamente como na web. Quando você atualiza o deploy, o app no celular já reflete na próxima abertura, **sem precisar republicar binário**.

> **Modo dev:** para hot-reload contra `npm run dev`, faça `CAPACITOR_SERVER_URL=http://<IP-do-seu-Mac/PC>:3000 npm run mobile:sync && npm run mobile:run:ios`.

### Publicação na App Store (iOS)

1. `npm run mobile:assets` — gera ícones e splash em `ios/App/App/Assets.xcassets/`.
2. `npm run mobile:open:ios` — abre o Xcode no projeto.
3. Em **Signing & Capabilities**: defina `Team` (sua conta Apple Developer) e altere o `Bundle Identifier` (`br.com.capitaolori.app` ou o seu).
4. **Product → Archive** → janela do Organizer → **Distribute App → App Store Connect**.
5. Em https://appstoreconnect.apple.com, crie o app (mesmo bundle id), preencha metadata (screenshots, descrição, política de privacidade), envie para revisão.

### Publicação na Google Play (Android)

1. `npm run mobile:assets` — gera ícones em `android/app/src/main/res/`.
2. Crie uma **keystore** de release:
   ```bash
   keytool -genkey -v -keystore android/app/upload-keystore.jks \
     -alias upload -keyalg RSA -keysize 2048 -validity 10000
   ```
   *(o `.jks` já está no `.gitignore` — guarde a senha **fora** do repo.)*
3. Em `android/app/build.gradle`, configure a `signingConfigs.release` (instruções: https://capacitorjs.com/docs/android/deploying-to-google-play).
4. `npm run mobile:open:android` → **Build → Generate Signed Bundle / APK → Android App Bundle (.aab)**.
5. Em https://play.google.com/console, crie o app, faça upload do `.aab`, preencha listing, defina países, envie para revisão.

### Boas práticas pré-lançamento

- Configure **Apple App Site Association** + **assetlinks.json** para deep links da app abrirem em vez do navegador.
- Política de privacidade publicada (obrigatório nas duas lojas).
- Screenshots em vários tamanhos — gere com [App Store Screenshot Studio](https://www.appstorescreenshot.com/) ou Figma.
- Versione com `appVersion` em `android/app/build.gradle` e `MARKETING_VERSION` no Xcode antes de cada release.

## 🗺️ Roadmap pós-MVP

- [x] PWA (manifest + service worker + ícones)
- [x] Wrapper iOS/Android (Capacitor)
- [ ] Streak freezes compráveis com XP
- [ ] Cards de teoria entre questões na lição (intercalados)
- [ ] Modo dark
- [ ] Tradução EN/ES
- [ ] Push notifications (Web Push + APNs/FCM nativos) — lembrete de ofensiva
- [ ] Áudio narrado das explicações (TTS)
- [ ] Importador de CSV via /admin
- [ ] Compras in-app (vidas/freezes) via StoreKit e Google Play Billing

## ⚖️ Licença e conteúdo

Capitão Lorí é um projeto independente de estudo. **Não filiado, endossado ou patrocinado pela ANAC.** Conteúdo redigido a partir de fontes públicas (RBAC, ICA, MCA, AIP-Brasil). Não há cópia de bancos comerciais. Sempre consulte os manuais oficiais antes de operar. Use, edite e contribua.
