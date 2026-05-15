-- Pune Ecommerce - Initial Schema
-- Run this in Supabase Dashboard > SQL Editor

-- Profiles (extends Clerk auth)
create table if not exists profiles (
  id uuid primary key,
  email text not null,
  full_name text,
  phone text,
  role text not null default 'client' check (role in ('client', 'admin')),
  created_at timestamp with time zone default now()
);

-- Categories
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  parent_id uuid references categories(id),
  sort_order int default 0,
  created_at timestamp with time zone default now()
);

-- Products
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  base_price numeric(10,2) not null,
  category_id uuid references categories(id),
  featured boolean default false,
  active boolean default true,
  created_at timestamp with time zone default now()
);

-- Product Images
create table if not exists product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade not null,
  url text not null,
  alt text,
  sort_order int default 0
);

-- Product Variants (tamaños)
create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade not null,
  width numeric not null,
  length numeric not null,
  price_override numeric(10,2),
  stock int default 0,
  active boolean default true
);

-- Addresses
create table if not exists addresses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  street text not null,
  city text not null,
  state text not null,
  zip text,
  is_default boolean default false,
  created_at timestamp with time zone default now()
);

-- Orders
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id),
  status text not null default 'pending' check (status in ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
  total numeric(10,2) not null,
  shipping_cost numeric(10,2),
  shipping_method text,
  shipping_address jsonb,
  mercadopago_id text,
  mercadopago_status text,
  created_at timestamp with time zone default now()
);

-- Order Items
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade not null,
  product_id uuid references products(id),
  variant_id uuid references product_variants(id),
  quantity int not null,
  unit_price numeric(10,2) not null
);

-- Coupons
create table if not exists coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type text not null check (type in ('percentage', 'fixed')),
  value numeric not null,
  min_purchase numeric(10,2),
  max_uses int,
  used_count int default 0,
  expires_at timestamp with time zone,
  active boolean default true,
  created_at timestamp with time zone default now()
);

-- Cart Items (para usuarios logueados)
create table if not exists cart_items (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade not null,
  product_id uuid references products(id),
  variant_id uuid references product_variants(id),
  quantity int not null default 1,
  created_at timestamp with time zone default now(),
  unique(profile_id, product_id, variant_id)
);

-- RLS Policies
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

-- Public read policies
create policy "Public read products" on products for select using (active = true);
create policy "Public read categories" on categories for select using (true);
create policy "Public read product_images" on product_images for select using (true);
create policy "Public read product_variants" on product_variants for select using (active = true);

-- Client policies
create policy "Clients manage own cart" on cart_items for all using (auth.uid() = profile_id);
create policy "Clients manage own addresses" on addresses for all using (auth.uid() = profile_id);
create policy "Clients view own orders" on orders for select using (auth.uid() = profile_id);
create policy "Clients view own order_items" on order_items for select using (order_id in (select id from orders where profile_id = auth.uid()));

-- Admin policies (will be set up after first admin user)
-- create policy "Admins full access products" on products for all using (...);

-- Storage bucket para productos
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "Public read product images" on storage.objects for select using (bucket_id = 'product-images');
create policy "Admin upload product images" on storage.objects for insert with check (bucket_id = 'product-images');
create policy "Admin delete product images" on storage.objects for delete using (bucket_id = 'product-images');

-- Sample data: Categories
insert into categories (name, slug, description, sort_order) values
  ('Colchones', 'colchones', 'Colchones de alta calidad para tu descanso', 1),
  ('Sommiers', 'sommiers', 'Sommiers con base de resortes', 2),
  ('Accesorios', 'accesorios', 'Almohadas, protectoras y más', 3)
on conflict (slug) do nothing;

-- Sample data: Products (placeholder)
insert into products (name, slug, description, base_price, category_id, featured) 
select 
  'Colchón Pune Premium',
  'colchon-pune-premium',
  'Colchón de espuma de alta densidad con pillow top. Ideal para un descanso reparador.',
  189999.00,
  id,
  true
from categories where slug = 'colchones'
on conflict (slug) do nothing;

insert into products (name, slug, description, base_price, category_id, featured)
select 
  'Sommier Pune Supreme',
  'sommier-pune-supreme',
  'Sommier con base de resortes y colchón con pillow top. Máximo confort.',
  289999.00,
  id,
  true
from categories where slug = 'sommiers'
on conflict (slug) do nothing;

insert into products (name, slug, description, base_price, category_id)
select 
  'Almohada Cervical',
  'almohada-cervical',
  'Almohada ergonómica para un mejor soporte cervical.',
  24999.00,
  id
from categories where slug = 'accesorios'
on conflict (slug) do nothing;

-- Sample variants for products
insert into product_variants (product_id, width, length, price_override, stock)
select id, 140, 190, base_price, 5 from products where slug = 'colchon-pune-premium'
on conflict do nothing;

insert into product_variants (product_id, width, length, price_override, stock)
select id, 160, 190, base_price * 1.15, 3 from products where slug = 'colchon-pune-premium'
on conflict do nothing;

insert into product_variants (product_id, width, length, price_override, stock)
select id, 180, 200, base_price * 1.3, 4 from products where slug = 'colchon-pune-premium'
on conflict do nothing;

insert into product_variants (product_id, width, length, price_override, stock)
select id, 200, 200, base_price * 1.5, 2 from products where slug = 'colchon-pune-premium'
on conflict do nothing;

-- Sample images (using Unsplash)
insert into product_images (product_id, url, alt, sort_order)
select id, 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=800&fit=crop', 'Colchón Pune Premium vista frontal', 0
from products where slug = 'colchon-pune-premium'
on conflict do nothing;

insert into product_images (product_id, url, alt, sort_order)
select id, 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=800&fit=crop', 'Sommier Pune Supreme', 0
from products where slug = 'sommier-pune-supreme'
on conflict do nothing;

insert into product_images (product_id, url, alt, sort_order)
select id, 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&h=800&fit=crop', 'Almohada Cervical', 0
from products where slug = 'almohada-cervical'
on conflict do nothing;

select 'Schema created successfully!' as status;