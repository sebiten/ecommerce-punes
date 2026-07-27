alter table public.store_settings
  add column if not exists pickup_enabled boolean not null default true,
  add column if not exists local_delivery_enabled boolean not null default false;

update public.store_settings
set
  store_name = 'Pilchería Gloria',
  footer_text = 'Ropa para mujer y hombre en Libertador General San Martín. Retiro coordinado y atención por WhatsApp.',
  pickup_enabled = true,
  local_delivery_enabled = false,
  pickup_instructions = 'Esperá nuestra confirmación por WhatsApp. Cuando esté listo, retiralo mostrando el código del pedido.',
  updated_at = now()
where id = 1;

alter table public.store_settings
  drop constraint if exists store_settings_fulfillment_enabled;

alter table public.store_settings
  add constraint store_settings_fulfillment_enabled
  check (pickup_enabled or local_delivery_enabled);

alter table public.orders
  drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check
  check (
    status in (
      'pending',
      'paid',
      'ready_for_pickup',
      'shipped',
      'delivered',
      'cancelled'
    )
  );
