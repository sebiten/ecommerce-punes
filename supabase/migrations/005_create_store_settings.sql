create table if not exists store_settings (
  id int primary key default 1 check (id = 1),
  store_name text not null default 'Pune Colchones',
  contact_email text not null default 'info@pune.com.ar',
  contact_phone text not null default '+54 11 1234-5678',
  whatsapp_phone text,
  address_line text not null default 'Av. Industrial 1234',
  city text not null default 'Buenos Aires',
  state text not null default 'Argentina',
  business_hours text not null default 'Lunes a Viernes: 9:00 - 18:00 | Sabados: 9:00 - 13:00',
  instagram_url text,
  facebook_url text,
  footer_text text not null default 'Mas de 30 anos fabricando colchones y sommiers con los mejores materiales. El descanso que tu familia merece.',
  standard_shipping_cost numeric(10,2) not null default 5000,
  express_shipping_cost numeric(10,2) not null default 10000,
  free_shipping_threshold numeric(10,2) not null default 50000,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

insert into store_settings (id)
values (1)
on conflict (id) do nothing;

alter table store_settings enable row level security;

drop policy if exists "Public can read store settings" on store_settings;
create policy "Public can read store settings"
on store_settings for select
using (true);

drop policy if exists "Admins can manage store settings" on store_settings;
create policy "Admins can manage store settings"
on store_settings for all
using (
  exists (
    select 1 from profiles
    where clerk_user_id = auth.uid()::text
    and role = 'admin'
  )
)
with check (
  exists (
    select 1 from profiles
    where clerk_user_id = auth.uid()::text
    and role = 'admin'
  )
);

grant select on store_settings to anon, authenticated;
