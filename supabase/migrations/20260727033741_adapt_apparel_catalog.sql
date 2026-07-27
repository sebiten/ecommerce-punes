alter table public.categories
  add column if not exists active boolean not null default true;

alter table public.products
  add column if not exists brand text,
  add column if not exists compare_at_price numeric(10,2);

alter table public.product_variants
  add column if not exists size text,
  add column if not exists color text,
  add column if not exists sku text;

alter table public.product_variants
  alter column width drop not null,
  alter column length drop not null;

alter table public.store_settings
  add column if not exists local_delivery_cost numeric(10,2) not null default 0,
  add column if not exists pickup_instructions text not null default 'Retirá tu compra en el local cuando te confirmemos que está lista.';

update public.store_settings
set
  store_name = 'Pilchería Gloria',
  contact_email = 'completar@ejemplo.com',
  contact_phone = 'Completar',
  whatsapp_phone = null,
  address_line = 'Dirección a completar',
  city = 'Libertador General San Martín',
  state = 'Jujuy, Argentina',
  business_hours = 'Horarios a completar',
  footer_text = 'Ropa para mujer y hombre en Libertador General San Martín. Retiro en el local y entrega en la zona.',
  local_delivery_cost = 0,
  pickup_instructions = 'Retirá tu compra en el local cuando te confirmemos que está lista.',
  updated_at = now()
where id = 1;

update public.products
set active = false
where active = true;

update public.categories
set active = false
where slug in ('colchones', 'sommiers', 'almohadas', 'accesorios');

insert into public.categories (name, slug, description, sort_order, active)
values
  ('Hombre', 'hombre', 'Indumentaria para hombre', 10, true),
  ('Mujer', 'mujer', 'Indumentaria para mujer', 20, true)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  active = true;

insert into public.categories (name, slug, description, parent_id, sort_order, active)
select 'Remeras', 'hombre-remeras', 'Remeras para hombre', id, 11, true
from public.categories
where slug = 'hombre'
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  parent_id = excluded.parent_id,
  sort_order = excluded.sort_order,
  active = true;

insert into public.categories (name, slug, description, parent_id, sort_order, active)
select 'Jeans', 'hombre-jeans', 'Jeans para hombre', id, 12, true
from public.categories
where slug = 'hombre'
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  parent_id = excluded.parent_id,
  sort_order = excluded.sort_order,
  active = true;

insert into public.categories (name, slug, description, parent_id, sort_order, active)
select 'Remeras', 'mujer-remeras', 'Remeras para mujer', id, 21, true
from public.categories
where slug = 'mujer'
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  parent_id = excluded.parent_id,
  sort_order = excluded.sort_order,
  active = true;

insert into public.categories (name, slug, description, parent_id, sort_order, active)
select 'Jeans', 'mujer-jeans', 'Jeans para mujer', id, 22, true
from public.categories
where slug = 'mujer'
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  parent_id = excluded.parent_id,
  sort_order = excluded.sort_order,
  active = true;

insert into public.categories (name, slug, description, parent_id, sort_order, active)
select 'Otras prendas', 'mujer-otras-prendas', 'Otras prendas para mujer', id, 23, true
from public.categories
where slug = 'mujer'
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  parent_id = excluded.parent_id,
  sort_order = excluded.sort_order,
  active = true;

drop index if exists public.product_variants_product_size_unique;

create unique index if not exists product_variants_product_apparel_unique
  on public.product_variants (
    product_id,
    lower(coalesce(size, '')),
    lower(coalesce(color, ''))
  )
  where size is not null;

create unique index if not exists product_variants_sku_unique
  on public.product_variants (lower(sku))
  where sku is not null and btrim(sku) <> '';

create index if not exists products_brand_active_idx
  on public.products (lower(brand), active)
  where brand is not null;

create index if not exists categories_parent_active_idx
  on public.categories (parent_id, sort_order)
  where active = true;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_compare_at_price_nonnegative'
  ) then
    alter table public.products
      add constraint products_compare_at_price_nonnegative
      check (compare_at_price is null or compare_at_price >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'product_variants_apparel_identity'
  ) then
    alter table public.product_variants
      add constraint product_variants_apparel_identity
      check (
        (size is not null and btrim(size) <> '')
        or (width is not null and length is not null)
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'store_settings_local_delivery_cost_nonnegative'
  ) then
    alter table public.store_settings
      add constraint store_settings_local_delivery_cost_nonnegative
      check (local_delivery_cost >= 0);
  end if;
end $$;
