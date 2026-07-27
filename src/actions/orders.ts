"use server";

import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ensureUserProfile, getProfile, requireAdmin } from "@/actions/auth";
import { createPreference, searchPaymentsByExternalReference } from "@/lib/mercadopago/client";
import { revalidatePath } from "next/cache";
import type { CartItem, OrderStatus, ShippingAddress } from "@/types";
import { getShippingCost } from "@/lib/commerce";
import { getStoreSettings } from "@/actions/store-settings";
import { revalidateProductCacheFromRouteHandler } from "@/lib/cache/products";
import {
  applyMercadoPagoPayment,
  cancelOrderAndRelease,
  claimOrderCoupon,
  getOrderReservationExpiration,
  reserveOrderStock,
} from "@/lib/orders/payment-state";
import { sendOrderEmail } from "@/lib/notifications/email";

const ORDER_STATUS_VALUES: OrderStatus[] = [
  "pending",
  "paid",
  "payment_review",
  "ready_for_pickup",
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

function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");
}

function revalidateProductCacheAfterStockChange() {
  try {
    revalidateProductCacheFromRouteHandler();
  } catch (error) {
    console.error("Error revalidando cache de productos:", error);
  }
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
      variants:product_variants(id, product_id, size, color, price_override, stock, active)
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

    const variantLabel = variant
      ? [variant.size ? `Talle ${variant.size}` : null, variant.color]
          .filter(Boolean)
          .join(" - ")
      : "";

    resolvedItems.push({
      ...item,
      title: variantLabel ? `${product.name} - ${variantLabel}` : product.name,
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

async function restoreOrderStock(orderId: string) {
  await cancelOrderAndRelease(orderId, "Cancelada desde el panel");
  revalidateProductCacheAfterStockChange();
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

async function reconcilePendingOrderPayment(order: any) {
  if (order.status !== "pending" || order.mercadopago_id) {
    return order;
  }

  try {
    const paymentSearch = await searchPaymentsByExternalReference(order.id);
    const payments = Array.isArray(paymentSearch?.results)
      ? paymentSearch.results
      : [];
    const payment =
      payments.find((item: any) => item.status === "approved") ??
      payments.find((item: any) => item.status);

    if (!payment?.status) {
      return order;
    }

    if (
      !["approved", "rejected", "cancelled", "refunded", "charged_back"].includes(
        payment.status
      )
    ) {
      return order;
    }

    const nextStatus = await applyMercadoPagoPayment(order.id, payment);
    const emailEvent =
      nextStatus === "paid"
        ? "payment-approved"
        : nextStatus === "payment_review"
          ? "payment-review"
          : nextStatus === "cancelled"
            ? "cancelled"
            : null;
    if (emailEvent) {
      await sendOrderEmail(order.id, emailEvent).catch((notificationError) => {
        console.error("No se pudo notificar la conciliación del pedido:", notificationError);
      });
    }
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order.id)
      .single();

    if (error || !data) {
      console.error("Error reconciliando orden con MercadoPago:", error);
      return order;
    }

    revalidatePath("/account/orders");
    revalidatePath(`/account/orders/${order.id}`);
    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${order.id}`);

    return {
      ...order,
      ...data,
      status: nextStatus,
    };
  } catch (error) {
    console.error("Error buscando pagos de MercadoPago para orden pendiente:", error);
    return order;
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
      title: "Entrega local",
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
  shippingAddress: ShippingAddress;
  couponCode?: string;
}) {
  const { userId } = await auth();

  if (userId) {
    await ensureUserProfile(userId);
  }

  const supabase = getSupabaseAdmin();
  const appUrl = getAppUrl();
  const resolvedItems = await resolveCheckoutItems(items);
  const subtotal = resolvedItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const settings = await getStoreSettings();
  const discount = await getCouponDiscount(couponCode, subtotal);
  const safeShippingMethod =
    shippingMethod === "local_delivery" ? "local_delivery" : "pickup";

  if (safeShippingMethod === "pickup" && !settings.pickup_enabled) {
    throw new Error("El retiro en el local no está disponible");
  }

  if (
    safeShippingMethod === "local_delivery" &&
    !settings.local_delivery_enabled
  ) {
    throw new Error("La entrega local no está disponible");
  }

  if (!shippingAddress.name?.trim() || !shippingAddress.email?.trim()) {
    throw new Error("Completá tu nombre y email");
  }

  if (!shippingAddress.phone?.trim()) {
    throw new Error("Completá un teléfono de contacto");
  }

  if (
    safeShippingMethod === "local_delivery" &&
    (!shippingAddress.street?.trim() || !shippingAddress.city?.trim())
  ) {
    throw new Error("Completá la dirección y localidad para la entrega");
  }

  const shippingCost = getShippingCost(safeShippingMethod, {
    localDeliveryCost: settings.local_delivery_cost,
  });
  const total = subtotal - discount.discount + shippingCost;
  const guestAccessToken = userId ? null : createGuestAccessToken();
  const reservationExpiresAt = getOrderReservationExpiration();

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
      reservation_expires_at: reservationExpiresAt,
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
    await supabase.from("orders").update({ status: "cancelled" }).eq("id", order.id);
    throw orderItemsError;
  }

  try {
    await reserveOrderStock(order.id);
    revalidateProductCacheAfterStockChange();
  } catch (error) {
    await cancelOrderAndRelease(
      order.id,
      "No se pudo reservar el stock del pedido"
    );
    throw error;
  }

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
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: reservationExpiresAt,
      payment_methods: {
        excluded_payment_types: [
          { id: "ticket" },
          { id: "atm" },
          { id: "bank_transfer" },
        ],
      },
    });
    await claimOrderCoupon(order.id);
  } catch (error) {
    await cancelOrderAndRelease(
      order.id,
      "No se pudo iniciar o confirmar la preferencia de pago"
    );
    revalidateProductCacheAfterStockChange();
    throw error;
  }

  await clearUserCart(userId);
  await sendOrderEmail(order.id, "order-created").catch((notificationError) => {
    console.error("No se pudo enviar el email de reserva:", notificationError);
  });

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
  return Promise.all((data || []).map((order) => reconcilePendingOrderPayment(order)));
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

  return reconcilePendingOrderPayment(data);
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
      return reconcilePendingOrderPayment(data);
    }
  }

  if (accessToken && data.guest_access_token === accessToken) {
    return reconcilePendingOrderPayment(data);
  }

  throw new Error("Forbidden");
}

export async function updateOrderStatus(id: string, status: string) {
  await requireAdmin();
  assertValidOrderStatus(status);
  const supabase = getSupabaseAdmin();
  const { data: existingOrder, error: existingOrderError } = await supabase
    .from("orders")
    .select("status, stock_restored, shipping_method")
    .eq("id", id)
    .single();

  if (existingOrderError) {
    throw existingOrderError;
  }

  if (existingOrder.stock_restored && status !== "cancelled") {
    throw new Error("No se puede reabrir una orden con stock restaurado");
  }

  const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
    pending: ["pending", "paid", "cancelled"],
    paid: ["paid", "ready_for_pickup", "shipped", "cancelled"],
    payment_review: ["payment_review", "cancelled"],
    ready_for_pickup: ["ready_for_pickup", "delivered", "cancelled"],
    shipped: ["shipped", "delivered", "cancelled"],
    delivered: ["delivered"],
    cancelled: ["cancelled"],
  };
  const currentStatus = existingOrder.status as OrderStatus;
  if (!allowedTransitions[currentStatus]?.includes(status)) {
    throw new Error("Ese cambio de estado no es válido para esta orden");
  }

  if (
    status === "ready_for_pickup" &&
    existingOrder.shipping_method === "local_delivery"
  ) {
    throw new Error("Una entrega local no puede quedar lista para retiro");
  }

  if (status === "shipped" && existingOrder.shipping_method !== "local_delivery") {
    throw new Error("Un pedido con retiro no puede marcarse en camino");
  }

  if (status === "cancelled") {
    await restoreOrderStock(id);
  }

  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id);

  if (error) throw error;
  const emailEvent =
    status === "shipped"
      ? "shipped"
      : status === "delivered"
        ? "delivered"
        : status === "cancelled"
          ? "cancelled"
          : status === "payment_review"
            ? "payment-review"
            : status === "paid"
              ? "payment-approved"
              : null;
  if (emailEvent) {
    await sendOrderEmail(id, emailEvent).catch((notificationError) => {
      console.error("No se pudo enviar la notificación del pedido:", notificationError);
    });
  }
  revalidatePath("/dashboard/orders");
  revalidatePath(`/dashboard/orders/${id}`);
  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${id}`);
}
