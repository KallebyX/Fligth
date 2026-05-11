# Quick-launch — pôr o app no ar em ~30 minutos (você tem Mac)

Este guia assume que **as variáveis Vercel já estão setadas** (Supabase + Stripe + RevenueCat) e que você tem Mac, conta Apple Developer e Google Play Console.

## Decisão estratégica

Lance **na web primeiro** — pode começar a vender pelo navegador HOJE, enquanto a revisão da Apple/Google leva 24-72h. Você não precisa esperar IAP nativo pra começar a ganhar dinheiro.

## Phase 1 — Web venda hoje (5 min)

1. Adicione no Vercel: `STRIPE_SECRET_KEY` (live) + `STRIPE_WEBHOOK_SECRET` (depois de criar o endpoint).
2. Dashboard Stripe → **Developers → Webhooks → Add endpoint**:
   - URL: `https://fligth.vercel.app/api/stripe/webhook`
   - Eventos: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`, `charge.refunded`.
   - Copie o **Signing secret** → cole em `STRIPE_WEBHOOK_SECRET` no Vercel.
3. Habilite **PIX** no Stripe (Payments → Settings → Payment methods).
4. Promova o deploy mais recente a Production.
5. **Pronto** — `/pro` já funciona. Apple Pay + Google Pay aparecem automaticamente no Stripe Checkout.

## Phase 2 — iOS na TestFlight (15 min de teclado + 1-2 dias de revisão)

No Mac:

```bash
cd ~/Fligth
git pull
npm install
npm run mobile:sync
npm run mobile:open:ios
```

No Xcode:

1. Selecione o target **App**.
2. **Signing & Capabilities**:
   - Team: sua conta Apple Developer.
   - Bundle Identifier: `br.com.capitaolori.app` (ou o seu).
   - Clique **+ Capability** → **In-App Purchase**.
   - Clique **+ Capability** → **Associated Domains** → adicione `applinks:fligth.vercel.app` e `webcredentials:fligth.vercel.app`.
3. **General → Identity**:
   - Display Name: `Capitão Lorí`
   - Version: `1.0.0`
   - Build: `1`
4. **Product → Scheme → Edit Scheme → Run** → mude para **Release** (testa o build real).
5. **Product → Destination → Any iOS Device (arm64)**.
6. **Product → Archive** (5-10 min). Quando terminar, abre o Organizer.
7. No Organizer → **Distribute App → App Store Connect → Upload**. Sign e upload (~3 min).
8. Em https://appstoreconnect.apple.com → o build aparece em 5-10 min.
9. **TestFlight → Internal Testing → adicione você mesmo**. Você recebe e-mail.
10. Instale o **TestFlight** no iPhone, abra o e-mail, instale o app.
11. **Teste o fluxo completo de compra usando sandbox**:
    - Configure um **Sandbox Tester** (Users and Access → Sandbox Testers).
    - No iPhone, **Settings → App Store → Sandbox Account** → login com o sandbox.
    - Crie os 4 IAPs e os 3 Pro products em **Features → In-App Purchases** (siga `mobile/IAP-SETUP.md`).
12. Quando estiver tudo funcionando, **submeta pra App Review** (TestFlight → Submit for Review).

## Phase 3 — Android na Internal Testing (15 min + 1-3 dias se for nova conta)

No Mac:

```bash
keytool -genkey -v -keystore android/app/upload-keystore.jks \
  -alias upload -keyalg RSA -keysize 2048 -validity 10000
# Anote password + key alias num gerenciador de senhas. NUNCA commite.
```

Edite `~/.gradle/gradle.properties`:

```
ANDROID_UPLOAD_STORE_FILE=/Users/SEU_USUARIO/Fligth/android/app/upload-keystore.jks
ANDROID_UPLOAD_KEY_ALIAS=upload
ANDROID_UPLOAD_STORE_PASSWORD=...
ANDROID_UPLOAD_KEY_PASSWORD=...
```

Edite `android/app/build.gradle` adicionando antes de `buildTypes`:

```gradle
signingConfigs {
    release {
        storeFile file(System.getProperty("user.home") + "/Fligth/android/app/upload-keystore.jks")
        storePassword ANDROID_UPLOAD_STORE_PASSWORD
        keyAlias ANDROID_UPLOAD_KEY_ALIAS
        keyPassword ANDROID_UPLOAD_KEY_PASSWORD
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        ...
    }
}
```

Depois:

```bash
npm run mobile:open:android
```

No Android Studio:

1. **Build → Generate Signed Bundle / APK → Android App Bundle (.aab)** → use a keystore que você criou.
2. https://play.google.com/console → Crie o app (categoria Educação, R$ — gratuito, faixa Livre).
3. **Setup → App content**: Privacy Policy URL = `https://fligth.vercel.app/privacy`.
4. **Setup → App access**: marque "All functionality is available without restrictions".
5. **Testing → Internal testing → Create release** → upload `.aab` → preencha "What's new" → Save → Review release → Roll out.
6. Em **Testers** adicione seu email → você pega o link de opt-in → instala via Play Store.
7. **Atenção** se sua conta é pessoal recém-criada: o Google exige **20 testadores ativos por 14 dias** antes de produção. Comece por Internal já pra começar a contar.

## Phase 4 — Ligar IAP nativo (após builds funcionarem em sandbox)

No Vercel:

```bash
NEXT_PUBLIC_NATIVE_IAP_ENABLED=true
```

Redeploy. Próxima abertura do app no celular passa a usar StoreKit/Play Billing em vez de Stripe.

## Phase 5 — Submissão final

| Loja | Tempo médio | Pega o quê |
|---|---|---|
| Apple App Review | 24-72h | Bundle + screenshots + IAPs configurados |
| Google Play Review | 1-7 dias (mais rigoroso em contas novas) | AAB + listing + Data Safety + Content Rating |

## Suporte durante revisão

Apple frequentemente quer:
- **Credenciais de teste** (use uma conta sandbox criada por você, NÃO sua conta real).
- **Confirmação que o app não é apenas um WebView** — temos: lições nativas, sistema de vidas, gamificação, IAP. Suficiente. Se a Apple reclamar, responda apontando para as features além do WebView (vidas, ofensiva, SRS).
- **Privacy Policy URL** — já temos em `/privacy`.
- **Support URL** — já temos em `/support`.

Google frequentemente quer:
- **Política de privacidade no listing**.
- **Data Safety form** preenchido.
- **Banking information** preenchido **antes** do primeiro Roll-out.

## Pronto pra ganhar

Quando ambos aprovarem:

1. Marque `Roll out to production` em ambas as lojas (Apple: TestFlight → App Store, Google: Internal → Production).
2. Compartilhe o link `https://fligth.vercel.app` + as URLs das lojas.
3. Acompanhe o painel **Stripe → Customers** e **RevenueCat → Charts → MRR** para ver a receita chegando.
