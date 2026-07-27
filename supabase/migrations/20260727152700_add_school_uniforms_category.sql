insert into public.categories (
  name,
  slug,
  description,
  image_url,
  sort_order,
  active
)
values (
  'Uniformes escolares',
  'uniformes-escolares',
  'Uniformes organizados por escuela, prenda y talle.',
  'https://images.unsplash.com/photo-1759143101324-d375443f1955?auto=format&fit=crop&w=1200&q=84',
  30,
  true
)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  image_url = excluded.image_url,
  sort_order = excluded.sort_order,
  active = true;
