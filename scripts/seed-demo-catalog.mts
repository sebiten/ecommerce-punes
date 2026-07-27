import { createClient } from "@supabase/supabase-js";

type DemoVariant = {
  size: string;
  color: string;
  stock: number;
};

type DemoProduct = {
  name: string;
  slug: string;
  description: string;
  categorySlug: string;
  price: number;
  compareAtPrice?: number;
  featured?: boolean;
  image: string;
  variants: DemoVariant[];
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local"
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const image = (photo: string) =>
  `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=1200&h=1500&q=82`;

const sizes = (
  values: string[],
  color: string,
  startingStock = 6
): DemoVariant[] =>
  values.map((size, index) => ({
    size,
    color,
    stock: Math.max(3, startingStock - index),
  }));

const products: DemoProduct[] = [
  {
    name: "Camisa Oxford Urbana",
    slug: "gloria-demo-camisa-oxford-urbana",
    description:
      "Camisa de corte cómodo con terminación limpia, ideal para combinar con jean o pantalón de vestir.",
    categorySlug: "hombre-remeras",
    price: 490,
    compareAtPrice: 500,
    featured: true,
    image: image("photo-1602810318383-e386cc2a3ccf"),
    variants: sizes(["S", "M", "L"], "Azul"),
  },
  {
    name: "Sobrecamisa Cuadros Norte",
    slug: "gloria-demo-sobrecamisa-cuadros-norte",
    description:
      "Sobrecamisa abrigada de cuadros, pensada para usar abierta o como capa liviana.",
    categorySlug: "hombre",
    price: 480,
    featured: true,
    image: image("photo-1611312449412-6cefac5dc3e4"),
    variants: sizes(["S", "M", "L"], "Gris"),
  },
  {
    name: "Pantalón Chino Arena",
    slug: "gloria-demo-pantalon-chino-arena",
    description:
      "Pantalón versátil de calce recto y tono neutro para looks diarios o más arreglados.",
    categorySlug: "hombre-jeans",
    price: 450,
    image: image("photo-1479064555552-3ef4979f8908"),
    variants: sizes(["38", "40", "42"], "Arena", 7),
  },
  {
    name: "Jogger Urbano Gris",
    slug: "gloria-demo-jogger-urbano-gris",
    description:
      "Jogger cómodo con estética minimalista, fácil de combinar con zapatillas y remeras básicas.",
    categorySlug: "hombre-jeans",
    price: 400,
    image: image("photo-1544441893-675973e31985"),
    variants: sizes(["S", "M", "L"], "Gris", 8),
  },
  {
    name: "Blazer Camel Clásico",
    slug: "gloria-demo-blazer-camel-clasico",
    description:
      "Blazer liviano de línea moderna para elevar un conjunto informal sin perder comodidad.",
    categorySlug: "hombre",
    price: 500,
    featured: true,
    image: image("photo-1559582798-678dfc71ccd8"),
    variants: sizes(["46", "48", "50"], "Camel", 5),
  },
  {
    name: "Chaqueta Negra Urbana",
    slug: "gloria-demo-chaqueta-negra-urbana",
    description:
      "Chaqueta sobria con cierre frontal y calce regular para usar durante toda la temporada.",
    categorySlug: "hombre",
    price: 500,
    image: image("photo-1507680434567-5739c80be1ac"),
    variants: sizes(["S", "M", "L"], "Negro"),
  },
  {
    name: "Conjunto Casual Weekend",
    slug: "gloria-demo-conjunto-casual-weekend",
    description:
      "Selección casual coordinada en tonos profundos para resolver un look completo con facilidad.",
    categorySlug: "hombre",
    price: 450,
    image: image("photo-1490114538077-0a7f8cb49891"),
    variants: sizes(["M", "L", "XL"], "Negro y bordo"),
  },
  {
    name: "Sweater Terracota",
    slug: "gloria-demo-sweater-terracota",
    description:
      "Sweater suave de punto medio y tono cálido, pensado para combinar con denim y prendas neutras.",
    categorySlug: "mujer-otras-prendas",
    price: 420,
    featured: true,
    image: image("photo-1556905055-8f358a7a47b2"),
    variants: sizes(["S", "M", "L"], "Terracota", 7),
  },
  {
    name: "Cardigan Tejido Natural",
    slug: "gloria-demo-cardigan-tejido-natural",
    description:
      "Cardigan liviano de textura artesanal para sumar abrigo y movimiento a cualquier conjunto.",
    categorySlug: "mujer-otras-prendas",
    price: 430,
    image: image("photo-1558769132-cb1aea458c5e"),
    variants: sizes(["S", "M", "L"], "Natural"),
  },
  {
    name: "Poncho Crudo Esencial",
    slug: "gloria-demo-poncho-crudo-esencial",
    description:
      "Poncho tejido de caída amplia, cómodo y fácil de superponer durante los días frescos.",
    categorySlug: "mujer-otras-prendas",
    price: 390,
    image: image("photo-1434389677669-e08b4cac3105"),
    variants: sizes(["Único"], "Crudo", 9),
  },
  {
    name: "Conjunto Deportivo Mostaza",
    slug: "gloria-demo-conjunto-deportivo-mostaza",
    description:
      "Conjunto relajado de dos piezas con color protagonista para un estilo cómodo y actual.",
    categorySlug: "mujer-otras-prendas",
    price: 480,
    featured: true,
    image: image("photo-1515886657613-9f3515b0c78f"),
    variants: sizes(["S", "M", "L"], "Mostaza", 6),
  },
  {
    name: "Blusa Básica Marfil",
    slug: "gloria-demo-blusa-basica-marfil",
    description:
      "Blusa liviana en tono marfil, un básico versátil para usar solo o debajo de un abrigo.",
    categorySlug: "mujer-remeras",
    price: 350,
    image: image("photo-1490481651871-ab68de25d43d"),
    variants: sizes(["S", "M", "L"], "Marfil", 8),
  },
  {
    name: "Pantalón Sastrero Oliva",
    slug: "gloria-demo-pantalon-sastrero-oliva",
    description:
      "Pantalón de cintura media y pierna recta para acompañar prendas tejidas o camisas.",
    categorySlug: "mujer-jeans",
    price: 450,
    image: image("photo-1540221652346-e5dd6b50f3e7"),
    variants: sizes(["36", "38", "40"], "Oliva"),
  },
  {
    name: "Vestido Estampado Midi",
    slug: "gloria-demo-vestido-estampado-midi",
    description:
      "Vestido midi de caída fluida y estampa combinable, listo para usar de día o de noche.",
    categorySlug: "mujer-otras-prendas",
    price: 490,
    compareAtPrice: 500,
    featured: true,
    image: image("photo-1567401893414-76b7b1e5a7a5"),
    variants: sizes(["S", "M", "L"], "Estampado"),
  },
  {
    name: "Jean Tiro Alto Azul",
    slug: "gloria-demo-jean-tiro-alto-azul",
    description:
      "Jean de tiro alto y lavado azul clásico, diseñado para acompañar prendas claras y tejidos.",
    categorySlug: "mujer-jeans",
    price: 500,
    image: image("photo-1516762689617-e1cffcef479d"),
    variants: sizes(["36", "38", "40"], "Azul", 7),
  },
  {
    name: "Chomba Escolar Blanca",
    slug: "gloria-demo-chomba-escolar-blanca",
    description:
      "Chomba escolar blanca de uso diario, con tejido resistente y calce cómodo para todo el año.",
    categorySlug: "uniformes-escolares",
    price: 350,
    featured: true,
    image: image("photo-1612229693210-30e16029c415"),
    variants: sizes(["6", "8", "10", "12"], "Blanco", 10),
  },
  {
    name: "Camisa Escolar Celeste",
    slug: "gloria-demo-camisa-escolar-celeste",
    description:
      "Camisa escolar celeste de manga larga con terminación prolija y tela fácil de cuidar.",
    categorySlug: "uniformes-escolares",
    price: 380,
    image: image("photo-1642140027867-e5983a32119c"),
    variants: sizes(["8", "10", "12", "14"], "Celeste", 9),
  },
  {
    name: "Sweater Escolar Bordó",
    slug: "gloria-demo-sweater-escolar-bordo",
    description:
      "Sweater escolar de punto firme en color bordó, ideal para los meses más frescos.",
    categorySlug: "uniformes-escolares",
    price: 450,
    featured: true,
    image: image("photo-1664990594725-552201db8079"),
    variants: sizes(["6", "8", "10", "12"], "Bordó", 8),
  },
  {
    name: "Guardapolvo Escolar Blanco",
    slug: "gloria-demo-guardapolvo-escolar-blanco",
    description:
      "Guardapolvo blanco de corte clásico, cómodo para el aula y preparado para uso frecuente.",
    categorySlug: "uniformes-escolares",
    price: 480,
    image: image("photo-1615466178532-b6d2f9c304de"),
    variants: sizes(["8", "10", "12", "14"], "Blanco"),
  },
  {
    name: "Pollera Escolar Gris",
    slug: "gloria-demo-pollera-escolar-gris",
    description:
      "Pollera escolar gris con cintura cómoda y largo práctico para acompañar el uniforme diario.",
    categorySlug: "uniformes-escolares",
    price: 420,
    image: image("photo-1619431654092-48a2d3a17f2f"),
    variants: sizes(["8", "10", "12", "14"], "Gris", 7),
  },
];

function skuFor(product: DemoProduct, variant: DemoVariant) {
  const productCode = product.slug
    .replace("gloria-demo-", "")
    .split("-")
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const sizeCode = variant.size
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\W/g, "")
    .toUpperCase();

  return `PGD-${productCode}-${sizeCode}`;
}

async function getCategoryIds() {
  const requiredSlugs = Array.from(
    new Set(products.map((product) => product.categorySlug))
  );
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug")
    .in("slug", requiredSlugs)
    .eq("active", true);

  if (error) throw error;

  const categoryIds = new Map((data ?? []).map((row) => [row.slug, row.id]));
  const missing = requiredSlugs.filter((slug) => !categoryIds.has(slug));

  if (missing.length > 0) {
    throw new Error(
      `Faltan categorías requeridas. Aplicá las migraciones antes del seed: ${missing.join(", ")}`
    );
  }

  return categoryIds;
}

async function seedProducts() {
  const categoryIds = await getCategoryIds();
  const productRows = products.map((product) => ({
    name: product.name,
    slug: product.slug,
    description: product.description,
    base_price: product.price,
    compare_at_price: product.compareAtPrice ?? null,
    brand: "Pilchería Gloria",
    category_id: categoryIds.get(product.categorySlug),
    featured: product.featured ?? false,
    active: true,
  }));

  const { data: seededProducts, error: productError } = await supabase
    .from("products")
    .upsert(productRows, { onConflict: "slug" })
    .select("id, slug");

  if (productError || !seededProducts) {
    throw productError ?? new Error("No se pudieron guardar los productos");
  }

  const productIds = new Map(
    seededProducts.map((product) => [product.slug, product.id])
  );
  const ids = seededProducts.map((product) => product.id);

  const { error: deleteImagesError } = await supabase
    .from("product_images")
    .delete()
    .in("product_id", ids);

  if (deleteImagesError) throw deleteImagesError;

  const { error: imageError } = await supabase.from("product_images").insert(
    products.map((product) => ({
      product_id: productIds.get(product.slug),
      url: product.image,
      alt: product.name,
      sort_order: 0,
    }))
  );

  if (imageError) throw imageError;

  const { data: existingVariants, error: variantsQueryError } = await supabase
    .from("product_variants")
    .select("id, sku")
    .in("product_id", ids);

  if (variantsQueryError) throw variantsQueryError;

  const variantsBySku = new Map(
    (existingVariants ?? [])
      .filter((variant) => variant.sku)
      .map((variant) => [variant.sku as string, variant.id])
  );
  const variants = products.flatMap((product) =>
    product.variants.map((variant) => ({
      product_id: productIds.get(product.slug),
      size: variant.size,
      color: variant.color,
      sku: skuFor(product, variant),
      price_override: null,
      stock: variant.stock,
      active: true,
    }))
  );

  const newVariants = variants.filter(
    (variant) => !variantsBySku.has(variant.sku)
  );
  if (newVariants.length > 0) {
    const { error } = await supabase
      .from("product_variants")
      .insert(newVariants);
    if (error) throw error;
  }

  for (const variant of variants) {
    const id = variantsBySku.get(variant.sku);
    if (!id) continue;

    const { error } = await supabase
      .from("product_variants")
      .update(variant)
      .eq("id", id);
    if (error) throw error;
  }
}

async function verifySeed() {
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, slug, base_price, active, images:product_images(id), variants:product_variants(id, active, stock)"
    )
    .like("slug", "gloria-demo-%")
    .eq("active", true);

  if (error) throw error;

  const seeded = data ?? [];
  const imageCount = seeded.reduce(
    (total, product) => total + product.images.length,
    0
  );
  const variantCount = seeded.reduce(
    (total, product) => total + product.variants.length,
    0
  );
  const invalidPrices = seeded.filter(
    (product) => Number(product.base_price) > 500
  );

  if (
    seeded.length !== products.length ||
    imageCount < products.length ||
    variantCount < 60 ||
    invalidPrices.length > 0
  ) {
    throw new Error(
      `Seed incompleto: ${seeded.length} productos, ${imageCount} imágenes, ${variantCount} variantes`
    );
  }

  return {
    products: seeded.length,
    images: imageCount,
    variants: variantCount,
    maxPrice: Math.max(
      ...seeded.map((product) => Number(product.base_price))
    ),
  };
}

await seedProducts();
const summary = await verifySeed();

console.log(
  `Catálogo demo listo: ${summary.products} productos, ${summary.images} imágenes, ${summary.variants} variantes. Precio máximo: $${summary.maxPrice}.`
);
