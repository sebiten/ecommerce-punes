"use server";

import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ensureUserProfile } from "@/actions/auth";
import { createPreference } from "@/lib/mercadopago/client";
import { revalidatePath } from "next/cache";
import type { CartItem } from "@/types";

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
    street: string;
    city: string;
    state: string;
    zip?: string;
  };
  couponCode?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("User not authenticated");

  await ensureUserProfile(userId);
  const supabase = getSupabaseAdmin();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      clerk_user_id: userId,
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
    await supabase.from("order_items").insert({
      order_id: order.id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      quantity: item.quantity,
      unit_price: item.product?.basePrice || 0,
    });
  }

  const preference = await createPreference({
    items: items.map((item) => ({
      id: item.product_id,
      title: item.product?.name || "Producto",
      unit_price: item.product?.basePrice || 0,
      quantity: item.quantity,
      picture_url: item.product?.images?.[0]?.url,
    })),
    external_reference: order.id,
    notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
    back_urls: {
      success: `${process.env.NEXT_PUBLIC_APP_URL}/order-confirmation/${order.id}`,
      failure: `${process.env.NEXT_PUBLIC_APP_URL}/checkout`,
      pending: `${process.env.NEXT_PUBLIC_APP_URL}/checkout`,
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
  return data;
}

export async function updateOrderStatus(id: string, status: string) {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/dashboard/orders");
}