create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon, authenticated;

alter table public.orders
  add column if not exists reservation_expires_at timestamptz,
  add column if not exists stock_reserved boolean not null default false,
  add column if not exists coupon_counted boolean not null default false,
  add column if not exists cancel_reason text;

update public.orders
set stock_reserved = true
where status <> 'cancelled'
  and stock_restored = false;

create index if not exists orders_pending_reservation_expiry_idx
  on public.orders (reservation_expires_at)
  where status = 'pending';

alter table public.orders
  drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check
  check (
    status in (
      'pending',
      'paid',
      'payment_review',
      'ready_for_pickup',
      'shipped',
      'delivered',
      'cancelled'
    )
  );

alter table public.products
  add column if not exists size_guide text;

alter table public.store_settings
  add column if not exists legal_name text,
  add column if not exists tax_id text,
  add column if not exists legal_address text;

create table if not exists public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  request_code text not null unique,
  order_id uuid references public.orders(id) on delete set null,
  order_reference text not null,
  email text not null,
  phone text not null,
  reason text,
  status text not null default 'received'
    check (status in ('received', 'in_review', 'resolved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists withdrawal_requests_created_at_idx
  on public.withdrawal_requests (created_at desc);

alter table public.withdrawal_requests enable row level security;
revoke all on table public.withdrawal_requests from anon, authenticated;
grant select, insert, update, delete on table public.withdrawal_requests to service_role;

create table if not exists public.order_notifications (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  event_key text not null,
  recipient text not null,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'failed')),
  provider_id text,
  error_message text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  unique (order_id, event_key, recipient)
);

alter table public.order_notifications enable row level security;
revoke all on table public.order_notifications from anon, authenticated;
grant select, insert, update, delete on table public.order_notifications to service_role;

create or replace function public.reserve_order_stock(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  order_record record;
  item_record record;
  current_stock integer;
begin
  select id, status, stock_reserved
    into order_record
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Orden no encontrada';
  end if;

  if order_record.status <> 'pending' then
    raise exception 'La orden no esta pendiente';
  end if;

  if order_record.stock_reserved then
    return true;
  end if;

  for item_record in
    select variant_id, sum(quantity)::integer as quantity
    from public.order_items
    where order_id = p_order_id
      and variant_id is not null
    group by variant_id
    order by variant_id
  loop
    select stock
      into current_stock
    from public.product_variants
    where id = item_record.variant_id
      and active = true
    for update;

    if not found or current_stock < item_record.quantity then
      raise exception 'Stock insuficiente para una variante del pedido';
    end if;

    update public.product_variants
    set stock = stock - item_record.quantity
    where id = item_record.variant_id;
  end loop;

  update public.orders
  set
    stock_reserved = true,
    stock_restored = false
  where id = p_order_id;

  return true;
end;
$$;

create or replace function public.claim_order_coupon(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  order_record record;
  coupon_record record;
begin
  select coupon_code, coupon_counted
    into order_record
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Orden no encontrada';
  end if;

  if order_record.coupon_code is null or btrim(order_record.coupon_code) = '' then
    return true;
  end if;

  if order_record.coupon_counted then
    return true;
  end if;

  select id, active, expires_at, max_uses, used_count
    into coupon_record
  from public.coupons
  where upper(code) = upper(order_record.coupon_code)
  for update;

  if not found
    or coupon_record.active = false
    or (coupon_record.expires_at is not null and coupon_record.expires_at < now())
    or (
      coupon_record.max_uses is not null
      and coupon_record.used_count >= coupon_record.max_uses
    )
  then
    raise exception 'El cupon ya no esta disponible';
  end if;

  update public.coupons
  set used_count = used_count + 1
  where id = coupon_record.id;

  update public.orders
  set coupon_counted = true
  where id = p_order_id;

  return true;
end;
$$;

create or replace function public.release_order_stock(
  p_order_id uuid,
  p_reason text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  order_record record;
  item_record record;
begin
  select stock_reserved, stock_restored, coupon_code, coupon_counted
    into order_record
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Orden no encontrada';
  end if;

  if order_record.stock_reserved and not order_record.stock_restored then
    for item_record in
      select variant_id, sum(quantity)::integer as quantity
      from public.order_items
      where order_id = p_order_id
        and variant_id is not null
      group by variant_id
      order by variant_id
    loop
      update public.product_variants
      set stock = stock + item_record.quantity
      where id = item_record.variant_id;
    end loop;
  end if;

  if order_record.coupon_counted and order_record.coupon_code is not null then
    update public.coupons
    set used_count = greatest(used_count - 1, 0)
    where upper(code) = upper(order_record.coupon_code);
  end if;

  update public.orders
  set
    stock_reserved = false,
    stock_restored = true,
    coupon_counted = false,
    cancel_reason = coalesce(p_reason, cancel_reason)
  where id = p_order_id;

  return true;
end;
$$;

create or replace function public.cancel_order_and_release(
  p_order_id uuid,
  p_reason text default null,
  p_only_if_pending boolean default false
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_status text;
begin
  select status
    into current_status
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Orden no encontrada';
  end if;

  if p_only_if_pending and current_status <> 'pending' then
    return false;
  end if;

  if current_status = 'cancelled' then
    return false;
  end if;

  perform public.release_order_stock(p_order_id, p_reason);

  update public.orders
  set
    status = 'cancelled',
    cancel_reason = p_reason
  where id = p_order_id;

  return true;
end;
$$;

create or replace function public.apply_order_payment(
  p_order_id uuid,
  p_payment_id text,
  p_payment_status text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  order_record record;
  next_status text;
begin
  select status, stock_reserved, stock_restored
    into order_record
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Orden no encontrada';
  end if;

  next_status := order_record.status;

  if p_payment_status = 'approved' then
    if order_record.status in ('pending', 'payment_review') and order_record.stock_reserved then
      next_status := 'paid';
    elsif order_record.status in ('pending', 'payment_review') and not order_record.stock_reserved then
      next_status := 'payment_review';
    elsif order_record.status = 'cancelled' and not order_record.stock_reserved then
      begin
        update public.orders
        set
          status = 'pending',
          stock_restored = false,
          cancel_reason = null
        where id = p_order_id;

        perform public.reserve_order_stock(p_order_id);
        next_status := 'paid';
      exception
        when others then
          next_status := 'payment_review';
      end;
    elsif order_record.status = 'cancelled' then
      next_status := 'payment_review';
    end if;
  elsif p_payment_status in ('rejected', 'cancelled') then
    if order_record.status in ('pending', 'payment_review') then
      perform public.cancel_order_and_release(
        p_order_id,
        'Pago rechazado o cancelado',
        false
      );
      next_status := 'cancelled';
    end if;
  elsif p_payment_status in ('refunded', 'charged_back') then
    if order_record.status in ('pending', 'paid', 'payment_review') then
      perform public.cancel_order_and_release(
        p_order_id,
        'Pago devuelto o desconocido',
        false
      );
      next_status := 'cancelled';
    end if;
  end if;

  update public.orders
  set
    mercadopago_id = p_payment_id,
    mercadopago_status = p_payment_status,
    status = next_status
  where id = p_order_id;

  return next_status;
end;
$$;

revoke execute on function public.reserve_order_stock(uuid) from public, anon, authenticated;
revoke execute on function public.claim_order_coupon(uuid) from public, anon, authenticated;
revoke execute on function public.release_order_stock(uuid, text) from public, anon, authenticated;
revoke execute on function public.cancel_order_and_release(uuid, text, boolean) from public, anon, authenticated;
revoke execute on function public.apply_order_payment(uuid, text, text) from public, anon, authenticated;

grant execute on function public.reserve_order_stock(uuid) to service_role;
grant execute on function public.claim_order_coupon(uuid) to service_role;
grant execute on function public.release_order_stock(uuid, text) to service_role;
grant execute on function public.cancel_order_and_release(uuid, text, boolean) to service_role;
grant execute on function public.apply_order_payment(uuid, text, text) to service_role;
