-- Add clerk_user_id to profiles table and update related tables
-- This migration changes the profile linking from Supabase auth user id to Clerk user id

-- Add clerk_user_id column to profiles
alter table profiles add column if not exists clerk_user_id text;
alter table profiles add column if not exists phone text;

-- Set clerk_user_id = id for existing records
update profiles set clerk_user_id = id where clerk_user_id is null;

-- Make clerk_user_id unique and not null
alter table profiles alter column clerk_user_id set not null;
alter table profiles add constraint profiles_clerk_user_id_key unique (clerk_user_id);

-- Add clerk_user_id to addresses
alter table addresses add column if not exists clerk_user_id text;
update addresses set clerk_user_id = profile_id where clerk_user_id is null;
alter table addresses alter column clerk_user_id set not null;
alter table addresses add constraint addresses_clerk_user_id_fkey foreign key (clerk_user_id) references profiles(clerk_user_id);

-- Add clerk_user_id to orders (instead of profile_id)
alter table orders add column if not exists clerk_user_id text;
update orders set clerk_user_id = profile_id where clerk_user_id is null and profile_id is not null;
alter table orders add constraint orders_clerk_user_id_fkey foreign key (clerk_user_id) references profiles(clerk_user_id);

-- Update RLS policies for new column structure
drop policy if exists "Authenticated users can manage own addresses" on addresses;
create policy "Authenticated users can manage own addresses" on addresses for all using (clerk_user_id = auth.uid()::text);

drop policy if exists "Authenticated users can view own orders" on orders;
create policy "Authenticated users can view own orders" on orders for select using (clerk_user_id = auth.uid()::text);

drop policy if exists "Authenticated users can create orders" on orders;
create policy "Authenticated users can create orders" on orders for insert with check (clerk_user_id = auth.uid()::text);

-- Grant permissions
grant select, insert, update, delete on addresses to anon, authenticated;
grant select, insert, update on orders to anon, authenticated;
grant select on order_items to anon, authenticated;

select 'Migration to clerk_user_id completed' as status;