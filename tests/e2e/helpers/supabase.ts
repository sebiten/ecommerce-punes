import { createClient } from "@supabase/supabase-js";

export type SeededProduct = {
  categoryId: string;
  productId: string;
  productSlug: string;
  productName: string;
  variantId: string;
};

type OrderWithItems = {
  id: string;
  status: string;
  mercadopago_id: string | null;
  mercadopago_status: string | null;
  stock_restored: boolean;
  stock_reserved: boolean;
  reservation_expires_at: string | null;
  guest_access_token: string | null;
  items: Array<{
    product_id: string;
    variant_id: string | null;
    quantity: number;
  }>;
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
  const productName = `Playwright Remera ${suffix}`;
  const productSlug = `playwright-smoke-${suffix}`;
  const categorySlug = `playwright-smoke-category-${suffix}`;

  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .insert({
      name: `Playwright Smoke ${suffix}`,
      slug: categorySlug,
      sort_order: 999,
      active: true,
    })
    .select("id")
    .single();

  if (categoryError || !category) {
    throw categoryError ?? new Error("No se pudo crear la categoría e2e");
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      name: productName,
      slug: productSlug,
      description: "Producto seed para smoke e2e",
      base_price: 125000,
      compare_at_price: 139000,
      brand: "Marca E2E",
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
    url: "https://images.unsplash.com/photo-1766934587214-86e21b3ae093?auto=format&fit=crop&w=800&q=80",
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
      size: "M",
      color: "Negro",
      sku: `E2E-${suffix}`,
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
  const { data: orderItems } = await supabase
    .from("order_items")
    .select("order_id")
    .eq("product_id", seed.productId);
  const orderIds = Array.from(
    new Set((orderItems || []).map((item) => item.order_id).filter(Boolean))
  );

  await supabase.from("order_items").delete().eq("product_id", seed.productId);
  if (orderIds.length > 0) {
    await supabase.from("orders").delete().in("id", orderIds);
  }
  await supabase.from("cart_items").delete().eq("product_id", seed.productId);
  await supabase.from("product_images").delete().eq("product_id", seed.productId);
  await supabase.from("product_variants").delete().eq("product_id", seed.productId);
  await supabase.from("products").delete().eq("id", seed.productId);
  await supabase.from("categories").delete().eq("id", seed.categoryId);
}

export async function getLatestOrderForProduct(productId: string) {
  const supabase = getSupabaseAdmin();
  const { data: orderItems, error: orderItemsError } = await supabase
    .from("order_items")
    .select("order_id")
    .eq("product_id", productId);

  if (orderItemsError) {
    throw orderItemsError;
  }

  const orderIds = Array.from(
    new Set((orderItems || []).map((item) => item.order_id).filter(Boolean))
  );
  if (orderIds.length === 0) {
    throw new Error("No se encontro la orden e2e");
  }

  const { data, error } = await supabase
    .from("orders")
    .select(`
      id,
      status,
      mercadopago_id,
      mercadopago_status,
      stock_restored,
      stock_reserved,
      reservation_expires_at,
      guest_access_token,
      items:order_items(product_id, variant_id, quantity)
    `)
    .in("id", orderIds)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    throw error ?? new Error("No se encontro la orden e2e");
  }

  return data as OrderWithItems;
}

export async function createExpiredOrderForProduct(seed: SeededProduct) {
  const supabase = getSupabaseAdmin();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      total: 125000,
      shipping_cost: 0,
      shipping_method: "pickup",
      shipping_address: {
        name: "QA Gloria",
        email: "qa+expired@example.com",
        phone: "3884000000",
      },
      status: "pending",
      reservation_expires_at: new Date(Date.now() - 60_000).toISOString(),
    })
    .select("id")
    .single();

  if (orderError || !order) {
    throw orderError ?? new Error("No se pudo crear la orden vencida e2e");
  }

  const { error: itemError } = await supabase.from("order_items").insert({
    order_id: order.id,
    product_id: seed.productId,
    variant_id: seed.variantId,
    quantity: 1,
    unit_price: 125000,
  });

  if (itemError) {
    throw itemError;
  }

  const { error: reserveError } = await supabase.rpc("reserve_order_stock", {
    p_order_id: order.id,
  });

  if (reserveError) {
    throw reserveError;
  }

  return order.id;
}

export async function getOrderState(orderId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select("status, stock_reserved, stock_restored, cancel_reason")
    .eq("id", orderId)
    .single();

  if (error || !data) {
    throw error ?? new Error("No se encontró la orden e2e");
  }

  return data;
}

export async function getVariantStock(variantId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("product_variants")
    .select("stock")
    .eq("id", variantId)
    .single();

  if (error || !data) {
    throw error ?? new Error("No se encontro la variante e2e");
  }

  return Number(data.stock ?? 0);
}
