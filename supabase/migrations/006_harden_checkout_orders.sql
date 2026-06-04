alter table orders
  add column if not exists guest_access_token text,
  add column if not exists coupon_code text,
  add column if not exists discount_total numeric(10,2) not null default 0,
  add column if not exists stock_restored boolean not null default false;

create index if not exists orders_guest_access_token_idx
  on orders (guest_access_token)
  where guest_access_token is not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_discount_total_nonnegative'
  ) then
    alter table orders
      add constraint orders_discount_total_nonnegative
      check (discount_total >= 0);
  end if;
end $$;
