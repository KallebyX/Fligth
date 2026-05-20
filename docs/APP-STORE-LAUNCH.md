# App Store Launch — Checklist 100%

Tudo o que precisa estar 100% pra submeter pra revisão da Apple e do Google. Marque com ✅ ao concluir cada item.

> Caminho rápido: do build atual até "Submeter pra revisão" = ~6h, sendo 4h de configuração no App Store Connect / Apple Developer Portal e 2h de captura de screenshots.

---

## A. App Store Connect — informações do app

### A1. Identidade
- ✅ **App name**: `CMTE Lori: Escola de Pilotos` (já configurado)
- ⚠️ **Subtitle** (30 chars): `Treino ANAC pra piloto privado` ← cole na ASC
- ✅ **Bundle ID**: `br.com.capitaolori.app`
- ✅ **Primary language**: Português (Brasil)
- ✅ **Category Primary**: Education
- ⚠️ **Category Secondary**: Reference *(opcional, recomendado)*
- ✅ **Idade**: 12+ (campo de comunidade na galeria justifica)
- ⚠️ **Content rights**: marcar "No, it does not contain, show, or access third-party content"

### A2. URLs / contato
- ✅ Marketing URL: `https://capitaolori.com`
- ✅ Support URL: `https://capitaolori.com/support`
- ✅ Privacy URL: `https://capitaolori.com/privacy`
- ⚠️ **Copyright**: `© 2026 Oryum Tech` (ou sua razão social)
- ⚠️ **Trade Representative Contact Information**: nome legal + endereço (obrigatório p/ apps na Coreia/EU pré-DMA — Apple geralmente exige)

### A3. App Review Information
Aba "App Review Information" dentro do build submission:

| Campo | Valor |
|---|---|
| First name | Kalleby |
| Last name | (seu sobrenome) |
| Phone | +55 (DDD) (telefone com país) |
| Email | kalleby@oryumtech.com.br |
| Demo account username | `review@capitaolori.com` |
| Demo account password | `AppleReview!1` |
| Notes (limite ~4000) | (texto abaixo) |

**Notes pra colar:**
```
Comandante Lorí (CMTE Lorí) é um app gamificado pra estudar pra prova
teórica de Piloto Privado da ANAC (Brasil).

LOGIN PRA REVIEW
• Email: review@capitaolori.com
• Senha: AppleReview!1
(Esta conta tem perfil maduro com XP, ofensiva e gems pra você ver as
funcionalidades sem precisar fazer onboarding zero. Caso prefira, crie
nova conta — onboarding leva ~30s.)

LOCALIZAÇÃO
Conteúdo (lições, simulados) em português brasileiro. Interface também
disponível em English e Español via Configurações → Idioma.

ASSINATURA PRO
Tela acessível em "Pro" no menu OU /pro no deep link. Três SKUs:
• pro_monthly  — Pro mensal (renova auto, 7 dias de trial)
• pro_yearly   — Pro anual (renova auto, 7 dias de trial)
• pro_lifetime — Pro vitalício (compra única, não renova)

Cada assinatura desbloqueia: vidas ilimitadas, simulados extras,
estatísticas avançadas, sem anúncios e o outfit Pro Dourado.

Restaurar compras: botão visível em /pro, em /configuracoes e dentro
do /pro/manage. Cancelamento: instrução in-app + deep link pra App
Store Subscriptions.

ICONOGRAFIA / IDENTIDADE
"Comandante Lorí" é o mascote do app (uma marreca aviadora). Marca
não filiada à ANAC — copy do app deixa isso claro.

NOTAS ESPECIAIS
• Sign In with Apple está temporariamente desativado neste build.
  Será reativado antes da v1.1.
• Galeria comunitária tem moderação manual + Google Vision SafeSearch
  client-side antes do upload.

Qualquer dúvida: kalleby@oryumtech.com.br (resposta em < 12h).
```

### A4. Idiomas adicionais
- ⚠️ Adicionar metadata em **English (U.S.)** e **Spanish (Mexico)** se quiser indexação nesses mercados. Mínimo: copiar pt-BR e traduzir Subtitle + Promotional Text.

---

## B. In-App Purchases — configurar TODOS os SKUs em ASC

Em **App Store Connect → Apps → CMTE Lori → In-App Purchases**. Crie um por um. Todos precisam estar "Ready to Submit" antes do binário ser revisado, OU submetidos juntos com o binário.

### B1. Subscription Group
Crie um Subscription Group: **CMTE Lorí Pro**. Os dois subs auto-renováveis (mensal + anual) ficam no mesmo grupo — Apple exige isso pra permitir upgrade/downgrade entre eles.

### B2. Os 3 produtos Pro

| Reference Name | Product ID | Type | Group | Pricing | Trial |
|---|---|---|---|---|---|
| CMTE Lorí Pro Mensal | `br.com.capitaolori.app.pro.monthly` | Auto-Renewable Subscription | CMTE Lorí Pro | R$ 19,90 / mês (tier 19) | 7 dias grátis (Apple Introductory Offer → Free Trial) |
| CMTE Lorí Pro Anual | `br.com.capitaolori.app.pro.yearly` | Auto-Renewable Subscription | CMTE Lorí Pro | R$ 119,00 / ano (tier ~119) | 7 dias grátis |
| CMTE Lorí Pro Vitalício | `br.com.capitaolori.app.pro.lifetime` | Non-Consumable | — | R$ 299,00 (tier 299) | — |

### B3. Os 4 consumíveis

| Reference Name | Product ID | Type | Price |
|---|---|---|---|
| Refil de vidas | `br.com.capitaolori.app.hearts_refill` | Consumable | R$ 4,90 (tier 5) |
| Vidas 24h | `br.com.capitaolori.app.hearts_unlimited_24h` | Consumable | R$ 14,90 (tier 15) |
| Vidas 7 dias | `br.com.capitaolori.app.hearts_unlimited_7d` | Consumable | R$ 49,90 (tier 50) |
| 3 escudos de gelo | `br.com.capitaolori.app.streak_freeze_3` | Consumable | R$ 9,90 (tier 10) |

### B4. Para cada IAP, preencher:
- **Localizations** — Display Name + Description em pt-BR (obrigatório), en + es opcional.
- **Review Information** — print da tela onde o produto aparece (use `/pro` ou `/shop`) + notas: "Cosmetic / gameplay aid; no real-world value."
- **Promotional text** (opcional) — campanha de lançamento.

### B5. Subscription Group Localizations
No nível do GRUPO, adicione localized App Name (pt-BR) = "CMTE Lorí Pro". Apple usa isso na tela de Subscriptions do iOS.

---

## C. App Privacy (Data Collection)

Em ASC → App Privacy → preencha o questionário.

### Dados que coletamos e como usamos:

| Categoria | Dados | Linked to user? | Used for tracking? | Purpose |
|---|---|---|---|---|
| Identifiers | Email, User ID (Supabase) | ✅ Yes | ❌ No | App Functionality, Account Management |
| Identifiers | Device ID (anônimo) | ❌ No | ❌ No | Analytics |
| Usage Data | Product Interaction | ✅ Yes | ❌ No | Analytics, Personalization (recomendar próxima lição) |
| Diagnostics | Crash Data, Performance Data | ❌ No | ❌ No | App Functionality (Sentry) |
| User Content | Photos uploaded to gallery | ✅ Yes | ❌ No | App Functionality |
| Contact Info | (Opcional, se preencheu perfil) Display name | ✅ Yes | ❌ No | App Functionality |
| Purchases | Purchase History | ✅ Yes | ❌ No | App Functionality (entitlements + manage page) |

**Sensitive Info**: nenhum.
**Health**: nenhum.
**Location**: nenhum (não pedimos GPS).
**Financial**: nenhum (Apple processa pagamentos).
**Tracking** (ATT prompt): NÃO precisamos. Não fazemos cross-app tracking nem usamos IDFA. Marcar **"Data Not Used to Track You"**.

---

## D. Accessibility Nutrition Label

Em ASC → App Information → Accessibility, marque:

- ✅ **Interface escura** — dark mode completo (`ThemeProvider` + 15 superfícies migradas)
- ✅ **Movimento reduzido** — `useReducedMotion` em LessonComplete, OutfitReveal, JackpotPanel etc + override em /configuracoes
- ⚠️ **VoiceOver** — *teste 30 min antes de marcar*. ARIA labels foram aplicadas, mas validar com VoiceOver ligado é mandatório.
- ⚠️ **Contraste suficiente** — Lighthouse no preview vercel deve dar score ≥ 90 antes de marcar.
- ❌ **Texto maior** — não marcar; Capacitor WebView não responde ao Dynamic Type do iOS por padrão. Temos toggle interno em Configurações → Acessibilidade mas não é mesma coisa.
- ❌ **Diferenciação sem usar apenas cor** — auditar feedback de exercícios (✓/✗ usa ícone+cor; checar status de gallery/escolas).
- ❌ **Legendas / Descrições de áudio** — não aplicável (sem vídeo narrado).

---

## E. Screenshots (obrigatórias por device class)

### E1. Sizes obrigatórios — Apple

| Device class | Resolução | Quantidade mín. | Aspecto |
|---|---|---:|---|
| iPhone 6.7" (15 Pro Max) | 1290 × 2796 | 3 | Mandatório |
| iPhone 6.5" (11 Pro Max) | 1242 × 2688 | 3 | Mandatório se 6.7" não cobrir |
| iPhone 5.5" (8 Plus) | 1242 × 2208 | 3 | Mandatório (legacy) |
| iPad Pro 13" (M4) | 2064 × 2752 | 3 | Mandatório se App suporta iPad |
| iPad Pro 12.9" (Gen 2) | 2048 × 2732 | 3 | Mandatório (legacy iPad) |

> Tip: o 6.7" pode cobrir o 6.5" desde que você marque "Use these screenshots for 6.5" too". Mesmo pro iPad.

### E2. O que mostrar nos 3-5 prints
1. **Hero** — tela `/learn` com mascote + trilha de lições + HUD (XP/Streak/Hearts visíveis).
2. **Lição** — exercício de múltipla escolha em andamento (mostra a UI da aula).
3. **Ligas** — `/leagues` com leaderboard + podio + medalha de promoção.
4. **Loja / Outfits** — `/shop/outfits` com roleta diária e outfits variados.
5. **Pro / Paywall** — `/pro` com os 3 cards de plano + features.

### E3. Como capturar
**Via simulador Xcode (recomendado)**: rodar `npm run mobile:run:ios` → escolher device → Cmd+S em cada tela.

**Via fastlane snapshot (automatizado)**: ver arquivo `fastlane/screenshots/Snapfile` (criado neste commit). Roda em ~10 min e gera os 5 tamanhos.

**Via Chrome DevTools** (atalho pra MVP): abrir `https://capitaolori.com/learn` → DevTools → Toggle Device Toolbar → escolher dimensions 1290×2796 → fullpage screenshot. Esse caminho dá uma screenshot do WEB, não nativa — Apple aceita pra v1.0 com aviso, mas eventualmente troque pra simulator.

---

## F. App Preview Video (OPCIONAL — recomendado pra conversão)

Vídeo de 15-30s mostrando o fluxo do app. Apple aceita 1 por device size.

Pra MVP: pular. Quando tiver tempo, gravar pelo simulador (Cmd+R no Simulator + QuickTime ou `xcrun simctl io booted recordVideo demo.mov`).

---

## G. EULA / Termos

- ✅ Página `/terms` existe em capitaolori.com
- ✅ Página `/privacy` existe
- ✅ Em ASC → License Agreement, mantive "Apple Standard EULA" (já marcado no print do usuário)
- ✅ Link pro EULA padrão da Apple inserido no `SubscriptionDisclosures` component

Se quiser EULA próprio depois: ASC → License Agreement → "Custom EULA" → cole o conteúdo de `docs/EULA.md` (a criar quando relevante).

---

## H. Build Submission Order

Recomendado nessa ordem:
1. ✅ Subir build via fastlane / Xcode → TestFlight processa em ~10min.
2. ⚠️ Em ASC → Add Build → escolher o build processado.
3. ⚠️ Submeter os 7 IAPs **junto** com o build.
4. ⚠️ Marcar "Sign-In Required" se for o caso (com a conta `review@capitaolori.com`).
5. ⚠️ Export Compliance → "No, my app uses standard encryption only (HTTPS)" — `Info.plist` precisa ter `ITSAppUsesNonExemptEncryption = false` (ver fix abaixo).
6. ⚠️ Submeter pra revisão.

### Info.plist fix (Export Compliance)
Adicionar em `ios/App/App/Info.plist`:

```xml
<key>ITSAppUsesNonExemptEncryption</key>
<false/>
```

Isso evita o questionário de exportação a cada build.

---

## I. Google Play (paralelo)

Não é foco desse launch, mas pra ter mapeado:

- Bundle ID Android: `br.com.capitaolori.app`
- Os mesmos product IDs do Apple Store funcionam no Google Play (RC abstrai).
- Internal Testing track pode receber builds enquanto a v1.0 do iOS é revisada.

---

## J. Pós-lançamento — primeira semana

- ⚠️ Configurar uptime monitor (BetterStack / UptimeRobot) no `/api/health`.
- ⚠️ Sentry alerts: `error.level >= error` rate > 5/min → Slack #incidents.
- ⚠️ App Store Connect → Sales and Trends → conferir downloads diariamente.
- ⚠️ App Store Connect → Reviews → responder cada review (Apple recomenda < 24h).
- ⚠️ Crash-free rate mínimo aceitável: 99,5%. Monitorar Sentry → Performance → Crashes.

---

## TL;DR — o que está pronto vs. pendente

### Pronto no código ✅
- IAP via RevenueCat (3 subs + 4 consumables, SKU mapping completo)
- Webhook RC: INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION, REFUND, BILLING_ISSUE, PRODUCT_CHANGE, UNCANCELLATION
- Restore Purchases button em /pro, /pro/manage e /configuracoes
- Manage subscriptions deep link (App Store / Play Store)
- StoreKit-localized prices via `getNativePrices()`
- Subscription disclosures (Apple Guideline 3.1.2) em /pro
- Sign In with Apple deferred (will re-enable v1.1)
- Accessibility settings UI

### Pendente no ASC ⚠️
Tudo da seção A, B, C, D, E acima — não dá pra fazer via código, é tudo manual no dashboard da Apple.
