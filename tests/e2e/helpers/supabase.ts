import { createClient } from "@supabase/supabase-js";

type SeededProduct = {
  categoryId: string;
  productId: string;
  productSlug: string;
  productName: string;
  variantId: string;
};

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function seedCheckoutSmokeProduct(): Promise<SeededProduct> {
  const supabase = getSupabaseAdmin();
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const productName = `Playwright Smoke ${suffix}`;
  const productSlug = `playwright-smoke-${suffix}`;
  const categorySlug = `playwright-smoke-category-${suffix}`;

  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .insert({
      name: `Playwright Smoke ${suffix}`,
      slug: categorySlug,
      sort_order: 999,
    })
    .select("id")
    .single();

  if (categoryError || !category) {
    throw categoryError ?? new Error("No se pudo crear la categoria e2e");
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      name: productName,
      slug: productSlug,
      description: "Producto seed para smoke e2e",
      base_price: 125000,
      category_id: category.id,
      active: true,
      featured: false,
    })
    .select("id")
    .single();

  if (productError || !product) {
    throw productError ?? new Error("No se pudo crear el producto e2e");
  }

  const { error: imageError } = await supabase.from("product_images").insert({
    product_id: product.id,
    url: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=800&fit=crop",
    alt: productName,
    sort_order: 0,
  });

  if (imageError) {
    throw imageError;
  }

  const { data: variant, error: variantError } = await supabase
    .from("product_variants")
    .insert({
      product_id: product.id,
      width: 140,
      length: 190,
      price_override: null,
      stock: 5,
      active: true,
    })
    .select("id")
    .single();

  if (variantError || !variant) {
    throw variantError ?? new Error("No se pudo crear la variante e2e");
  }

  return {
    categoryId: category.id,
    productId: product.id,
    productSlug,
    productName,
    variantId: variant.id,
  };
}

export async function cleanupCheckoutSmokeProduct(seed: SeededProduct) {
  const supabase = getSupabaseAdmin();

  await supabase.from("order_items").delete().eq("product_id", seed.productId);
  await supabase.from("cart_items").delete().eq("product_id", seed.productId);
  await supabase.from("product_images").delete().eq("product_id", seed.productId);
  await supabase.from("product_variants").delete().eq("product_id", seed.productId);
  await supabase.from("products").delete().eq("id", seed.productId);
  await supabase.from("categories").delete().eq("id", seed.categoryId);
}
