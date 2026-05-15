"use server";

import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ensureUserProfile } from "@/actions/auth";
import { revalidatePath } from "next/cache";

export async function addToCart(
  productId: string,
  variantId: string | null,
  quantity: number
) {
  const { userId } = await auth();
  if (!userId) throw new Error("User not authenticated");

  await ensureUserProfile(userId);
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("cart_items")
    .upsert(
      {
        profile_id: userId,
        product_id: productId,
        variant_id: variantId,
        quantity,
      },
      {
        onConflict: "profile_id,product_id,variant_id",
      }
    );

  if (error) throw error;
  revalidatePath("/cart");
}

export async function removeFromCart(cartItemId: string) {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("id", cartItemId);

  if (error) throw error;
  revalidatePath("/cart");
}

export async function getCartItems() {
  const { userId } = await auth();
  if (!userId) return [];

  await ensureUserProfile(userId);
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("cart_items")
    .select(`
      *,
      product:products(
        *,
        images:product_images(*),
        variants:product_variants(*)
      ),
      variant:product_variants(*)
    `)
    .eq("profile_id", userId);

  if (error) throw error;
  return data;
}

export async function updateCartItemQuantity(cartItemId: string, quantity: number) {
  const supabase = getSupabaseAdmin();

  if (quantity <= 0) {
    return removeFromCart(cartItemId);
  }

  const { error } = await supabase
    .from("cart_items")
    .update({ quantity })
    .eq("id", cartItemId);

  if (error) throw error;
  revalidatePath("/cart");
}