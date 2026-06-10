"use server";

import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ensureUserProfile, getProfile, requireAdmin } from "@/actions/auth";
import { createPreference } from "@/lib/mercadopago/client";
import { revalidatePath } from "next/cache";
import type { CartItem, OrderStatus } from "@/types";
import { getShippingCost } from "@/lib/commerce";
import { getStoreSettings } from "@/actions/store-settings";

const ORDER_STATUS_VALUES: OrderStatus[] = [
  "pending",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
];

function assertValidOrderStatus(status: string): asserts status is OrderStatus {
  if (!ORDER_STATUS_VALUES.includes(status as OrderStatus)) {
    throw new Error("Estado de orden invalido");
  }
}

type CheckoutItem = {
  product_id: string;
  variant_id: string | null;
  quantity: number;
};

type ResolvedCheckoutItem = CheckoutItem & {
  title: string;
  unitPrice: number;
  pictureUrl?: string;
};

type MercadoPagoCheckoutItem = {
  id: string;
  title: string;
  unit_price: number;
  quantity: number;
  picture_url?: string;
};

function createGuestAccessToken() {
  return crypto.randomUUID().replaceAll("-", "");
}

function normalizeCheckoutItems(items: CartItem[]) {
  const merged = new Map<string, CheckoutItem>();

  for (const item of items) {
    if (!item.product_id || !Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error("Carrito invalido");
    }

    const variantId = item.variant_id ?? null;
    const key = `${item.product_id}:${variantId ?? "default"}`;
    const existing = merged.get(key);

    if (existing) {
      existing.quantity += item.quantity;
      continue;
    }

    merged.set(key, {
      product_id: item.product_id,
      variant_id: variantId,
      quantity: item.quantity,
    });
  }

  const normalizedItems = Array.from(merged.values());
  if (normalizedItems.length === 0) {
    throw new Error("El carrito esta vacio");
  }

  return normalizedItems;
}

async function resolveCheckoutItems(items: CartItem[]) {
  const normalizedItems = normalizeCheckoutItems(items);
  const supabase = getSupabaseAdmin();
  const { data: products, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      base_price,
      active,
      images:product_images(url, sort_order),
      variants:product_variants(id, product_id, price_override, stock, active)
    `)
    .in(
      "id",
      Array.from(new Set(normalizedItems.map((item) => item.product_id)))
    )
    .eq("active", true);

  if (error) {
    throw error;
  }

  const productsById = new Map((products || []).map((product: any) => [product.id, product]));
  const resolvedItems: ResolvedCheckoutItem[] = [];

  for (const item of normalizedItems) {
    const product = productsById.get(item.product_id);
    if (!product) {
      throw new Error("Uno de los productos ya no esta disponible");
    }

    const sortedImages = [...(product.images || [])].sort(
      (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
    );
    const variant = item.variant_id
      ? (product.variants || []).find((current: any) => current.id === item.variant_id)
      : null;

    if (item.variant_id && (!variant || variant.active === false)) {
      throw new Error(`La variante de ${product.name} ya no esta disponible`);
    }

    if (variant && Number(variant.stock ?? 0) < item.quantity) {
      throw new Error(`Stock insuficiente para ${product.name}`);
    }

    resolvedItems.push({
      ...item,
      title: product.name,
      unitPrice: Number(variant?.price_override ?? product.base_price),
      pictureUrl: sortedImages[0]?.url,
    });
  }

  return resolvedItems;
}

async function getCouponDiscount(couponCode: string | undefined, subtotal: number) {
  const normalizedCode = couponCode?.trim().toUpperCase();
  if (!normalizedCode) {
    return { code: null, discount: 0 };
  }

  const supabase = getSupabaseAdmin();
  const { data: coupon, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", normalizedCode)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!coupon) {
    throw new Error("Cupon invalido");
  }

  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    throw new Error("El cupon esta vencido");
  }

  if (coupon.max_uses && Number(coupon.used_count || 0) >= Number(coupon.max_uses)) {
    throw new Error("El cupon ya no tiene usos disponibles");
  }

  if (coupon.min_purchase && subtotal < Number(coupon.min_purchase)) {
    throw new Error("El subtotal no alcanza el minimo del cupon");
  }

  const rawDiscount =
    coupon.type === "percentage"
      ? subtotal * (Number(coupon.value) / 100)
      : Number(coupon.value);

  return {
    code: normalizedCode,
    discount: Math.min(subtotal, Math.max(0, rawDiscount)),
  };
}

async function decrementVariantStock(items: ResolvedCheckoutItem[]) {
  const supabase = getSupabaseAdmin();

  for (const item of items) {
    if (!item.variant_id) {
      continue;
    }

    const { data: variant, error: variantError } = await supabase
      .from("product_variants")
      .select("stock")
      .eq("id", item.variant_id)
      .single();

    if (variantError) {
      throw variantError;
    }

    const nextStock = Number(variant.stock ?? 0) - item.quantity;
    if (nextStock < 0) {
      throw new Error(`Stock insuficiente para ${item.title}`);
    }

    const { error: updateError } = await supabase
      .from("product_variants")
      .update({ stock: nextStock })
      .eq("id", item.variant_id);

    if (updateError) {
      throw updateError;
    }
  }
}

async function restoreVariantStock(items: ResolvedCheckoutItem[]) {
  const supabase = getSupabaseAdmin();

  for (const item of items) {
    if (!item.variant_id) {
      continue;
    }

    const { data: variant, error: variantError } = await supabase
      .from("product_variants")
      .select("stock")
      .eq("id", item.variant_id)
      .single();

    if (variantError) {
      console.error("Error leyendo stock para rollback:", variantError);
      continue;
    }

    const { error: updateError } = await supabase
      .from("product_variants")
      .update({ stock: Number(variant.stock ?? 0) + item.quantity })
      .eq("id", item.variant_id);

    if (updateError) {
      console.error("Error restaurando stock:", updateError);
    }
  }
}

async function restoreOrderStock(orderId: string) {
  const supabase = getSupabaseAdmin();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(`
      id,
      stock_restored,
      items:order_items(variant_id, quantity)
    `)
    .eq("id", orderId)
    .single();

  if (orderError) {
    throw orderError;
  }

  if (order.stock_restored) {
    return;
  }

  for (const item of order.items || []) {
    if (!item.variant_id) {
      continue;
    }

    const { data: variant, error: variantError } = await supabase
      .from("product_variants")
      .select("stock")
      .eq("id", item.variant_id)
      .single();

    if (variantError) {
      throw variantError;
    }

    const { error: updateError } = await supabase
      .from("product_variants")
      .update({ stock: Number(variant.stock ?? 0) + Number(item.quantity) })
      .eq("id", item.variant_id);

    if (updateError) {
      throw updateError;
    }
  }

  const { error: restoreError } = await supabase
    .from("orders")
    .update({ stock_restored: true })
    .eq("id", orderId);

  if (restoreError) {
    throw restoreError;
  }
}

async function clearUserCart(userId: string | null) {
  if (!userId) {
    return;
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("clerk_user_id", userId);

  if (error) {
    throw error;
  }
}

function buildMercadoPagoItems(
  items: ResolvedCheckoutItem[],
  subtotal: number,
  discountTotal: number,
  shippingCost: number
): MercadoPagoCheckoutItem[] {
  const preferenceItems: MercadoPagoCheckoutItem[] = items.map((item) => {
    const proportionalDiscount =
      discountTotal > 0 && subtotal > 0
        ? (item.unitPrice * item.quantity * discountTotal) / subtotal
        : 0;
    const discountedLineTotal = item.unitPrice * item.quantity - proportionalDiscount;

    return {
      id: item.product_id,
      title: item.title,
      unit_price: Math.max(0.01, Number((discountedLineTotal / item.quantity).toFixed(2))),
      quantity: item.quantity,
      picture_url: item.pictureUrl,
    };
  });

  if (shippingCost > 0) {
    preferenceItems.push({
      id: "shipping",
      title: "Envio",
      unit_price: Number(shippingCost.toFixed(2)),
      quantity: 1,
    });
  }

  return preferenceItems;
}

export async function createOrder({
  items,
  shippingMethod,
  shippingAddress,
  couponCode,
}: {
  items: CartItem[];
  total?: number;
  shippingCost?: number;
  shippingMethod: string;
  shippingAddress: {
    name: string;
    email: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    zip?: string;
  };
  couponCode?: string;
}) {
  const { userId } = await auth();

  if (userId) {
    await ensureUserProfile(userId);
  }

  const supabase = getSupabaseAdmin();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const resolvedItems = await resolveCheckoutItems(items);
  const subtotal = resolvedItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const settings = await getStoreSettings();
  const discount = await getCouponDiscount(couponCode, subtotal);
  const safeShippingMethod = shippingMethod === "express" ? "express" : "standard";
  const shippingCost = getShippingCost(subtotal - discount.discount, safeShippingMethod, {
    standardShippingCost: settings.standard_shipping_cost,
    expressShippingCost: settings.express_shipping_cost,
    freeShippingThreshold: settings.free_shipping_threshold,
  });
  const total = subtotal - discount.discount + shippingCost;
  const guestAccessToken = userId ? null : createGuestAccessToken();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      clerk_user_id: userId ?? null,
      total,
      shipping_cost: shippingCost,
      shipping_method: safeShippingMethod,
      shipping_address: shippingAddress,
      guest_access_token: guestAccessToken,
      coupon_code: discount.code,
      discount_total: discount.discount,
      status: "pending",
    })
    .select()
    .single();

  if (orderError) throw orderError;

  const { error: orderItemsError } = await supabase.from("order_items").insert(
    resolvedItems.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      quantity: item.quantity,
      unit_price: item.unitPrice,
    }))
  );

  if (orderItemsError) {
    throw orderItemsError;
  }

  await decrementVariantStock(resolvedItems);

  let preference;
  try {
    preference = await createPreference({
      items: buildMercadoPagoItems(
        resolvedItems,
        subtotal,
        discount.discount,
        shippingCost
      ),
      payer: {
        name: shippingAddress.name.split(" ")[0] || shippingAddress.name,
        surname: shippingAddress.name.split(" ").slice(1).join(" "),
        email: shippingAddress.email,
      },
      external_reference: order.id,
      notification_url: `${appUrl}/api/webhooks/mercadopago?source_news=webhooks`,
      back_urls: {
        success: `${appUrl}/order-confirmation/${order.id}${
          guestAccessToken ? `?token=${guestAccessToken}` : ""
        }`,
        failure: `${appUrl}/checkout`,
        pending: `${appUrl}/checkout`,
      },
    });
  } catch (error) {
    await restoreVariantStock(resolvedItems);
    await supabase.from("orders").update({ status: "cancelled" }).eq("id", order.id);
    throw error;
  }

  if (discount.code) {
    const { data: coupon } = await supabase
      .from("coupons")
      .select("used_count")
      .eq("code", discount.code)
      .single();

    await supabase
      .from("coupons")
      .update({ used_count: Number(coupon?.used_count || 0) + 1 })
      .eq("code", discount.code);
  }

  await clearUserCart(userId);

  return { order, preference };
}

export async function getOrders() {
  const { userId } = await auth();
  if (!userId) throw new Error("User not authenticated");

  await ensureUserProfile(userId);
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      items:order_items(
        *,
        product:products(*)
      )
    `)
    .eq("clerk_user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getOrderById(id: string) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const profile = await getProfile();
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      items:order_items(
        *,
        product:products(*),
        variant:product_variants(*)
      )
    `)
    .eq("id", id)
    .single();

  if (error) throw error;

  const orderOwnerId = data.clerk_user_id || data.profile_id;
  if (profile?.role !== "admin" && orderOwnerId !== userId) {
    throw new Error("Forbidden");
  }

  return data;
}

export async function getOrderForConfirmation(id: string, accessToken?: string) {
  const { userId } = await auth();
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      items:order_items(
        *,
        product:products(*),
        variant:product_variants(*)
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  if (userId) {
    const profile = await getProfile();
    const orderOwnerId = data.clerk_user_id || data.profile_id;
    if (profile?.role === "admin" || orderOwnerId === userId) {
      return data;
    }
  }

  if (accessToken && data.guest_access_token === accessToken) {
    return data;
  }

  throw new Error("Forbidden");
}

export async function updateOrderStatus(id: string, status: string) {
  await requireAdmin();
  assertValidOrderStatus(status);
  const supabase = getSupabaseAdmin();
  const { data: existingOrder, error: existingOrderError } = await supabase
    .from("orders")
    .select("stock_restored")
    .eq("id", id)
    .single();

  if (existingOrderError) {
    throw existingOrderError;
  }

  if (existingOrder.stock_restored && status !== "cancelled") {
    throw new Error("No se puede reabrir una orden con stock restaurado");
  }

  if (status === "cancelled") {
    await restoreOrderStock(id);
  }

  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/dashboard/orders");
  revalidatePath(`/dashboard/orders/${id}`);
  revalidatePath("/account/orders");
}
