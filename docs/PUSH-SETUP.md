# Push notifications — configuração

Implementação client-side e infra básica já está pronta. O envio efetivo
depende de credenciais Apple/Firebase + uma Edge Function.

## Visão geral

```
┌────────────────────┐    ┌─────────────────────────┐
│ User on iPhone     │    │ Backend / cron jobs     │
│                    │    │                         │
│ 1. /profile/edit:  │    │ A. Daily streak-risk    │
│    "Ativar push"   │    │    cron at 20h          │
│ 2. iOS prompts     │    │ B. League weekly reset  │
│    permission      │    │ C. New follower         │
│ 3. APNs registers, │    │                         │
│    returns token   │    │ Each triggers           │
│ 4. registerPushToken│    │ supabase.functions.    │
│    persists in DB  │    │ invoke('send-push',{}) │
└────────────────────┘    └────────────┬────────────┘
                                       │
                                       v
                          ┌────────────────────────┐
                          │ Edge Function           │
                          │ supabase/functions/    │
                          │   send-push/index.ts   │
                          │                         │
                          │ - Look up push_tokens   │
                          │ - APNs (iOS) / FCM (And)│
                          │ - Auto-revoke 410       │
                          └────────────────────────┘
```

## 1. Apple Developer — APNs Auth Key

1. Em [https://developer.apple.com/account/resources/authkeys/list](https://developer.apple.com/account/resources/authkeys/list), crie uma nova key:
   - Nome: `Capitao Lori APNs`
   - Capability: **Apple Push Notifications service (APNs)**
2. Baixe o `.p8` (só baixa uma vez). Anote o **Key ID** (10 chars).
3. Anote o **Team ID** do canto superior direito.

## 2. Xcode — Push Notifications capability

Abra `ios/App/App.xcworkspace` → seleciona o target `App` → tab **Signing &
Capabilities** → `+ Capability` → **Push Notifications**. Isso adiciona a
entitlement `aps-environment` (que já criamos em `App.entitlements`).

> Dev usa `aps-environment=development` (sandbox APNs). Produção usa
> `aps-environment=production`. Capacitor não troca automaticamente — vai
> manual via Xcode build configuration ou via uma fastlane lane.

## 3. Supabase — Edge Function secrets

```bash
supabase secrets set --project-ref ggveduxfkljidzkrmmoo \
  APNS_TEAM_ID=ABCDEF1234 \
  APNS_KEY_ID=XYZ987 \
  APNS_PRIVATE_KEY="$(cat ~/Downloads/AuthKey_XYZ987.p8)" \
  APNS_BUNDLE_ID=br.com.capitaolori.app \
  APNS_HOST=api.sandbox.push.apple.com
```

Para produção, troque `APNS_HOST=api.push.apple.com`.

## 4. Deploy da Edge Function

```bash
supabase functions deploy send-push --project-ref ggveduxfkljidzkrmmoo
```

## 5. Triggers (próximo passo)

Crie cron jobs / database triggers que chamam `send-push`:

**Cron diário (streak risk)** — `supabase/functions/streak-risk-cron/index.ts`
(scaffold futuro):
```ts
// Roda às 20h local. Para cada usuário com streak > 0 e sem atividade
// hoje, invoca send-push com mensagem "Você ainda não treinou hoje!".
```

**League weekly reset** — Tuesday 00:00 UTC:
```ts
// Para cada usuário promovido/rebaixado, invoca send-push com a nova liga.
```

**Friend events** — DB trigger em `user_activities`:
```sql
-- AFTER INSERT trigger that pg_net.http_post('.../functions/v1/send-push').
```

## 6. Smoke test

Depois de deployar + colar secrets:

```bash
curl -X POST 'https://ggveduxfkljidzkrmmoo.supabase.co/functions/v1/send-push' \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "<seu-uuid>",
    "title": "Capitão Lorí",
    "body": "Funcionou!"
  }'
```

Se o usuário tem um device iOS com permission concedida e token persistido
em `push_tokens`, deve receber o push em ~2 segundos.

## Web push (futuro)

A implementação atual de `PushNotifications.tsx` no client só registra
device tokens em iOS/Android via Capacitor. Para web push (PWA), seria
necessário um service worker subscription separado + chave VAPID +
endpoint `webpush` no envio. Fora do escopo desta iteração.
