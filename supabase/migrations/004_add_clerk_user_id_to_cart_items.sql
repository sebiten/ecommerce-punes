-- Add clerk_user_id to cart_items and align cart ownership with Clerk

alter table cart_items add column if not exists clerk_user_id text;
update cart_items set clerk_user_id = profile_id where clerk_user_id is null;
alter table cart_items alter column clerk_user_id set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'cart_items_clerk_user_id_fkey'
  ) then
    alter table cart_items
      add constraint cart_items_clerk_user_id_fkey
      foreign key (clerk_user_id)
      references profiles(clerk_user_id)
      on delete cascade;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'cart_items_clerk_user_id_product_id_variant_id_key'
  ) then
    alter table cart_items
      add constraint cart_items_clerk_user_id_product_id_variant_id_key
      unique (clerk_user_id, product_id, variant_id);
  end if;
end $$;

drop policy if exists "Clients manage own cart" on cart_items;
drop policy if exists "Users can read own cart" on cart_items;
drop policy if exists "Users can insert own cart" on cart_items;
drop policy if exists "Users can update own cart" on cart_items;
drop policy if exists "Users can delete own cart" on cart_items;

create policy "Users can read own cart"
on cart_items for select
using (clerk_user_id = auth.uid()::text);

create policy "Users can insert own cart"
on cart_items for insert
with check (clerk_user_id = auth.uid()::text);

create policy "Users can update own cart"
on cart_items for update
using (clerk_user_id = auth.uid()::text);

create policy "Users can delete own cart"
on cart_items for delete
using (clerk_user_id = auth.uid()::text);

grant select, insert, update, delete on cart_items to anon, authenticated;
