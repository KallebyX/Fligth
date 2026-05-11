# In-App Purchases — passo a passo

Este app usa **RevenueCat** como camada unificada para StoreKit (iOS) + Play Billing (Android). Você só precisa apontar e clicar — os SKUs já estão definidos no código (`lib/revenuecat.ts`).

Todos os SKUs:

| SKU interno | Product ID (App Store + Play) | Preço alvo |
|---|---|---|
| `hearts_refill` | `br.com.capitaolori.hearts_refill` | R$ 4,90 |
| `hearts_unlimited_24h` | `br.com.capitaolori.hearts_unlimited_24h` | R$ 14,90 |
| `hearts_unlimited_7d` | `br.com.capitaolori.hearts_unlimited_7d` | R$ 49,90 |
| `streak_freeze_3` | `br.com.capitaolori.streak_freeze_3` | R$ 9,90 |

Todos são **consumíveis** (uso único, podem ser recomprados).

---

## 1. RevenueCat dashboard

1. Crie conta em https://app.revenuecat.com (free até $10k/mês de receita).
2. **Project → New project** → "Capitão Lorí".
3. **Apps** → adicione **iOS App**: Bundle ID `br.com.capitaolori.app`.
4. **Apps** → adicione **Android App**: Package name `br.com.capitaolori.app`.
5. Copie as **Public API Keys** (uma por plataforma — começam com `appl_` e `goog_`).
6. **Integrations → Webhooks** → New webhook:
   - URL: `https://fligth.vercel.app/api/revenuecat/webhook`
   - Authorization header value: gere com `openssl rand -hex 32` e cole.
7. Envie um **TEST event** pra validar que a Vercel responde `200`.

## 2. App Store Connect (iOS)

1. Em https://appstoreconnect.apple.com, abra o app.
2. **Features → In-App Purchases → +**:
   - Type: **Consumable**.
   - Reference Name: `Refill de vidas`.
   - Product ID: `br.com.capitaolori.hearts_refill` (**exato!**).
   - Price tier que dê R$ 4,90 (Tier 1 BRL — verifique no Pricing Matrix).
   - Localizations PT-BR: Display name = "Refill de vidas", Description = "Recupera todos os 5 corações."
   - Review screenshot: o screenshot do botão "Comprar" no app.
3. Repita pros outros 3 produtos com os IDs da tabela.
4. **Atenção:** todos os produtos precisam ficar com status **"Ready to Submit"** antes do binário ser submetido.
5. **App Information → Banking & Tax**: preencha senão a Apple não libera vendas.
6. **App Information → Subscriptions & In-App Purchases** → connect com RevenueCat seguindo: https://www.revenuecat.com/docs/getting-started/installation/ios#configuring-the-app-store-server-notifications

## 3. Google Play Console (Android)

1. https://play.google.com/console → seu app → **Monetize → Products → In-app products**.
2. **Create product** para cada um dos 4 SKUs:
   - Product ID: `br.com.capitaolori.hearts_refill` (idem).
   - Name: "Refill de vidas".
   - Description: idem App Store.
   - Default price: R$ 4,90 (Play converte automaticamente para outras moedas).
3. Habilite cada produto (Activate).
4. **Setup → API access**: gere a Service Account JSON e suba no RevenueCat (Project Settings → Apps → Android → Service Account credentials). Sem isso o RevenueCat não valida receipts do Play Billing.

## 4. Variáveis de ambiente

Na Vercel (Production + Preview) e no `.env.local`:

```bash
NEXT_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxxxxx
NEXT_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxxxxxxx
REVENUECAT_WEBHOOK_TOKEN=<a mesma string longa que você colou no dashboard>
NEXT_PUBLIC_NATIVE_IAP_ENABLED=false  # mude pra "true" só quando tudo abaixo estiver pronto
```

Reimplante o app na Vercel depois de configurar.

## 5. Capacitor sync

No seu Mac:

```bash
git pull
npm install
npm run mobile:sync
```

Isso baixa o plugin nativo `@revenuecat/purchases-capacitor` para `ios/App/Pods/` (pod install roda automático) e `android/`.

## 6. Build de teste

### iOS (TestFlight Sandbox)

1. `npm run mobile:open:ios` (abre Xcode).
2. **Signing & Capabilities** → Team = sua conta Apple Developer.
3. **Capabilities** → add **In-App Purchase**.
4. **Product → Archive** → Distribute → App Store Connect → **TestFlight**.
5. Em https://appstoreconnect.apple.com → seu app → TestFlight → adicione você mesmo como **Internal Tester**.
6. No iPhone, instale o **TestFlight** + seu app via convite.
7. **Configure um Sandbox tester** em Users and Access → Sandbox testers. Faça logout do Apple ID real e login com o sandbox em **Settings → App Store**.
8. Compre dentro do app — o IAP aparece com "Environment: Sandbox" e cobra R$ 0,00.

### Android (Internal Testing)

1. Gere upload keystore (uma única vez):
   ```bash
   keytool -genkey -v -keystore android/app/upload-keystore.jks \
     -alias upload -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Adicione signingConfig.release no `android/app/build.gradle` apontando para o `.jks` (a senha NÃO commita — use `~/.gradle/gradle.properties`).
3. `npm run mobile:open:android` → **Build → Generate Signed Bundle → AAB**.
4. https://play.google.com/console → **Testing → Internal testing → Create release** → upload `.aab`.
5. Adicione o e-mail do seu testador no **List of testers**.
6. O testador entra pelo link de "Opt-in" e instala via Play Store. As compras de teste cobram R$ 0,00 (Play reconhece testers internos automaticamente).

## 7. Ligar a chave

Quando os dois builds estiverem **comprando OK no sandbox**, na Vercel:

```bash
NEXT_PUBLIC_NATIVE_IAP_ENABLED=true
```

Redeploy. A próxima abertura do app nos dispositivos vai trocar o botão "Comprar" para fluxo nativo (StoreKit no iOS, Play Billing no Android). O webhook RevenueCat já estará creditando vidas/freezes via `lib/fulfillment.ts`.

## 8. Submissão para revisão

- **Apple:** App Review costuma **comprar 1 IAP de cada tipo** com cartão sandbox. Se algum produto não estiver "Ready to Submit", a app é rejeitada com "Missing IAP". Anexe instruções do reviewer informando que pode testar com qualquer e-mail.
- **Google:** sem revisão manual de IAPs, só revisa o app. Mas se o Data Safety form não declarar "In-app purchases", o app não pode publicar — marque corretamente.

## 9. Refunds e disputas

- **Apple:** RevenueCat dispara `REFUND` no webhook quando o usuário pede reembolso. Já tratado: marca `purchases.status='refunded'`.
- **Play:** idem `REFUND` event.
- **Stripe (web):** `charge.refunded` no webhook — também já tratado.

Sem ação manual sua na maioria dos casos.

## 10. Boas práticas pré-store

- Sempre teste **as 4 compras de novo** depois de mudar qualquer texto/preço.
- Verifique que o app **reflete a vida creditada** em menos de 5 segundos após a compra (RevenueCat costuma chegar no webhook em 2-3 s).
- Política de Reembolso: declare em `/privacy` (já está, mas revise) — 7 dias após compra é o padrão consumerista BR.

---

Dúvidas? Os logs do webhook ficam em **Vercel → Functions → `/api/revenuecat/webhook`**. Os logs do RevenueCat ficam em **Dashboard → Customers → busque pelo `app_user_id` (= ID do usuário no Supabase)**.
