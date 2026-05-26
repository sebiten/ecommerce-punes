"use server";

import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ensureUserProfile, getProfile, requireAdmin } from "@/actions/auth";
import { createPreference } from "@/lib/mercadopago/client";
import { revalidatePath } from "next/cache";
import type { CartItem, OrderStatus } from "@/types";
import { getCartItemUnitPrice } from "@/lib/commerce";

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

export async function createOrder({
  items,
  total,
  shippingCost,
  shippingMethod,
  shippingAddress,
  couponCode,
}: {
  items: CartItem[];
  total: number;
  shippingCost: number;
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

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      clerk_user_id: userId ?? null,
      total,
      shipping_cost: shippingCost,
      shipping_method: shippingMethod,
      shipping_address: shippingAddress,
      status: "pending",
    })
    .select()
    .single();

  if (orderError) throw orderError;

  for (const item of items) {
    const unitPrice = getCartItemUnitPrice(item);

    await supabase.from("order_items").insert({
      order_id: order.id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      quantity: item.quantity,
      unit_price: unitPrice,
    });
  }

  const preference = await createPreference({
    items: items.map((item) => ({
      id: item.product_id,
      title: item.product?.name || "Producto",
      unit_price: getCartItemUnitPrice(item),
      quantity: item.quantity,
      picture_url: item.product?.images?.[0]?.url,
    })),
    payer: {
      name: shippingAddress.name.split(" ")[0] || shippingAddress.name,
      surname: shippingAddress.name.split(" ").slice(1).join(" "),
      email: shippingAddress.email,
    },
    external_reference: order.id,
    notification_url: `${appUrl}/api/webhooks/mercadopago`,
    back_urls: {
      success: `${appUrl}/order-confirmation/${order.id}`,
      failure: `${appUrl}/checkout`,
      pending: `${appUrl}/checkout`,
    },
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

export async function updateOrderStatus(id: string, status: string) {
  await requireAdmin();
  assertValidOrderStatus(status);
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/dashboard/orders");
  revalidatePath(`/dashboard/orders/${id}`);
  revalidatePath("/account/orders");
}
