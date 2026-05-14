-- =========================================================================
-- 0009_outfit_products.sql — Cash purchases for paid mascot outfits
-- =========================================================================
--
-- Reuses the existing products/purchases/fulfillment pipeline. Each paid
-- outfit gets a sibling row in `products` (kind='mascot_outfit',
-- payload={outfit_slug}). mascot_outfits remains the canonical metadata.

alter table public.products drop constraint if exists products_kind_check;
alter table public.products
  add constraint products_kind_check
  check (kind = any (array[
    'hearts_refill','hearts_unlimited','streak_freezes','remove_ads',
    'donation','pro_subscription','pro_lifetime','mascot_outfit'
  ]));

insert into public.products (sku, name, description, kind, payload, price_cents, currency, active, order_index)
values
  ('outfit-red-baron', 'Outfit Barão Vermelho',
   'O lenço vermelho-sangue do clássico das clássicas, com helmet emparelhado.',
   'mascot_outfit',
   jsonb_build_object('outfit_slug','red-baron'),
   990, 'brl', true, 100)
on conflict (sku) do update set
  name = excluded.name,
  description = excluded.description,
  payload = excluded.payload,
  price_cents = excluded.price_cents,
  currency = excluded.currency,
  active = excluded.active,
  order_index = excluded.order_index;
