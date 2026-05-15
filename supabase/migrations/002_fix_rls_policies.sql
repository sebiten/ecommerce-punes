-- Fix RLS Policies for Pune Ecommerce
-- Run this in Supabase Dashboard > SQL Editor

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table product_variants enable row level security;
alter table addresses enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table coupons enable row level security;
alter table cart_items enable row level security;

-- Drop existing policies that might be blocking
drop policy if exists "Public read products" on products;
drop policy if exists "Public read categories" on categories;
drop policy if exists "Public read product_images" on product_images;
drop policy if exists "Public read product_variants" on product_variants;
drop policy if exists "Clients manage own cart" on cart_items;
drop policy if exists "Clients manage own addresses" on addresses;
drop policy if exists "Clients view own orders" on orders;
drop policy if exists "Clients view own order_items" on order_items;

-- Create PUBLIC read policies (for storefront)
create policy "Public can read products" on products for select using (active = true);
create policy "Public can read categories" on categories for select using (true);
create policy "Public can read product_images" on product_images for select using (true);
create policy "Public can read product_variants" on product_variants for select using (active = true);

-- Grant permissions to anon role (for public reads)
grant select on categories to anon;
grant select on products to anon;
grant select on product_images to anon;
grant select on product_variants to anon;
grant select on storage.objects to anon;

-- Also grant insert/update for cart (needed for unauthenticated initially)
grant insert, update on cart_items to anon;
grant select on cart_items to anon;

-- Grant for orders and order_items (needed for checkout)
grant select, insert on orders to anon;
grant select, insert on order_items to anon;

-- Storage policies
drop policy if exists "Public read product images" on storage.objects;
drop policy if exists "Admin upload product images" on storage.objects;
drop policy if exists "Admin delete product images" on storage.objects;

create policy "Public can read product images" on storage.objects for select using (bucket_id = 'product-images');
create policy "Authenticated users can upload product images" on storage.objects for insert with check (bucket_id = 'product-images' and auth.role() = 'authenticated');
create policy "Authenticated users can delete product images" on storage.objects for delete using (bucket_id = 'product-images' and auth.role() = 'authenticated');

select 'RLS policies fixed successfully!' as status;