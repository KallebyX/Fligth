-- Normalize Pro product names + descriptions to the new "CMTE Lorí" /
-- "Comandante Lorí" branding used in the App Store. Prices are kept as
-- they are in prod (R$ 19,90 / R$ 119,00 / R$ 299,00) since they were
-- already announced.
--
-- The SKUs (pro_monthly, pro_yearly, pro_lifetime) are the single
-- vocabulary used by:
--   • Stripe Price.metadata.product_sku (web)
--   • RevenueCat product_id → SKU map in lib/revenuecat.ts
--
-- Idempotent — only updates rows that already exist.

update public.products set
  name        = 'CMTE Lorí Pro — mensal',
  description = 'Vidas ilimitadas, simulados extras, estatísticas avançadas e sem anúncios. 7 dias grátis.',
  payload     = jsonb_build_object('interval','month','trial_days',7)
where sku = 'pro_monthly';

update public.products set
  name        = 'CMTE Lorí Pro — anual',
  description = 'Tudo do mensal por menos de R$ 10/mês. 7 dias grátis. Renova automático.',
  payload     = jsonb_build_object('interval','year','trial_days',7)
where sku = 'pro_yearly';

update public.products set
  name        = 'CMTE Lorí Pro — vitalício',
  description = 'Pague uma vez, use pra sempre. Oferta de lançamento, sem renovação.',
  payload     = jsonb_build_object()
where sku = 'pro_lifetime';

-- Mark the old `heart_pack_5`, `heart_unlimited_24h`, `streak_freeze_pack_3`
-- SKUs inactive — they were the v0 names before we normalized to the
-- IAP-friendly underscore convention. The hearts_refill / hearts_unlimited_*
-- / streak_freeze_3 SKUs in lib/revenuecat.ts replace them.
update public.products set active = false
where sku in ('heart_pack_5','heart_unlimited_24h','streak_freeze_pack_3');
