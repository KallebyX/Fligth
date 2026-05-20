# IAP Sandbox Testing — quick guide

Como testar as compras Pro **sem gastar dinheiro real** antes de submeter pra revisão.

## 1. Criar Sandbox Tester no App Store Connect

1. App Store Connect → **Users and Access** → **Sandbox** tab
2. **+ Test Account**
3. Email: use um email **que NÃO está vinculado a nenhum Apple ID** (ex: `kalleby+sandbox1@oryumtech.com.br`)
4. Senha: qualquer uma forte
5. Region: **Brazil**
6. App Store Country: **Brazil**
7. Salvar

Repita pra criar 2-3 testers (uma p/ trial, outra p/ assinatura ativa, outra p/ cancelamento).

## 2. Logar o sandbox tester no iPhone de teste

> **Importante**: NÃO faça logout do seu Apple ID real! Apenas adicione o sandbox account na seção específica de sandbox.

iPhone com iOS 17+:

1. **Ajustes** → **App Store** (não Apple ID!)
2. Scroll até o fim → **Sandbox Account**
3. **Sign In** → cole o email + senha do tester criado acima
4. O sandbox tester ficará ativo só dentro de apps que invocam StoreKit em modo dev/TestFlight.

## 3. Testar uma compra

1. Instale o build TestFlight do CMTE Lorí.
2. Faça login com email/senha (review@capitaolori.com ou cria conta nova).
3. Vá em `/pro`.
4. Toque em **Pro Anual → Comprar**.
5. Apple mostra a folha de pagamento com `[Environment: Sandbox]` visível no topo.
6. Confirme com Face ID.
7. Resultado:
   - O webhook do RevenueCat recebe o evento `INITIAL_PURCHASE`.
   - `user_stats.pro_until` é setado pra ~1 ano à frente.
   - `subscriptions` row criada com `provider='apple_iap'`.
   - O ícone Pro aparece no HUD.
   - O outfit "Pro Dourado" é desbloqueado e notificado.

## 4. Cenários adicionais

### Testar renovação (sub se renova rápido em sandbox)
Sandbox encurta os períodos pra velocidades aceleradas:
- 1 mês real = 5 minutos sandbox
- 1 ano real = 1 hora sandbox

Espera 5 minutos depois de comprar `pro_monthly`. O webhook receberá `RENEWAL` automaticamente. `pro_until` é estendido.

### Testar cancelamento
1. **Ajustes** → seu nome (sandbox) → **Subscriptions** → **CMTE Lorí Pro Mensal** → **Cancel Subscription**
2. Apple agenda `EXPIRATION` para o fim do período.
3. Webhook recebe `CANCELLATION` agora (status="canceled") e `EXPIRATION` quando o período acaba.
4. `pro_until` é cortado pra now ao expirar.

### Testar restore
1. Faça logout do sandbox tester no iPhone.
2. Login de novo (mesmo tester).
3. Abra o app → vá em `/pro` → **Restaurar compras**.
4. As compras anteriores reaparecem.

### Testar refund
Sandbox não simula refund. Pra testar refund:
1. App Store Connect → **Sales and Trends** → busca a transação sandbox.
2. Marca como refunded (apenas em sandbox dashboard).
3. Webhook recebe `REFUND` event.
4. `purchases.status = 'refunded'`, `subscriptions.status = 'expired'`, `pro_until` cortado pra now.

## 5. Verificar logs

### RevenueCat dashboard
- **Events** → você vê todos os webhook deliveries com payload completo.
- Filter por `app_user_id` (seu user_id Supabase) pra debug por user.

### Supabase
```sql
-- Last 10 purchases for a user
select * from public.purchases
where user_id = '<uid>'
order by created_at desc
limit 10;

-- Subscription status
select * from public.subscriptions
where user_id = '<uid>';

-- Pro status as seen by the app
select user_id, pro_until, pro_plan from public.user_stats
where user_id = '<uid>';
```

### Vercel logs do webhook
- Functions tab → `/api/revenuecat/webhook` → últimas execuções.

## 6. Comum no debug

**Erro: "Cannot connect to iTunes Store"** durante a compra sandbox.
- Resolve fazendo logout/login do sandbox account em Ajustes.
- Se persistir, force quit o app e tente de novo.

**Webhook não chega**: 
- Conferir `REVENUECAT_WEBHOOK_TOKEN` em Vercel env vars.
- Conferir webhook URL em RevenueCat dashboard → Integrations → Webhooks → URL deve ser `https://capitaolori.com/api/revenuecat/webhook`.

**Pro não ativa instantâneamente**:
- A página `/pro` faz hard reload após `purchaseSku` retornar OK.
- Se o reload chegar antes do webhook lander, `pro_until` ainda mostra antigo.
- Esperar 5 segundos e recarregar.
- Alternativa client-side: `hasProEntitlementLocal()` lê o cache local do RevenueCat e mostra Pro instantâneo (não precisa esperar webhook).

## 7. Pre-flight antes de submeter pra revisão

- [ ] Comprar `pro_monthly` em sandbox e ver Pro ativar
- [ ] Comprar `pro_yearly` em sandbox e ver trial de 7 dias setado
- [ ] Comprar `pro_lifetime` e ver pro_plan = "lifetime"
- [ ] Comprar `hearts_refill` e ver hearts = 5
- [ ] Comprar `streak_freeze_3` e ver streak_freezes +3
- [ ] Cancelar assinatura → ver banner "Acesso até X" no /pro/manage
- [ ] Esperar expiration sandbox → ver Pro virar inativo
- [ ] Logout e login → ver Restore Purchases trazer Pro de volta
- [ ] Trocar de pro_monthly → pro_yearly (upgrade) → ver PRODUCT_CHANGE event no webhook
- [ ] Trocar plano em iOS Settings → ver subscriptions.product_sku atualizar
