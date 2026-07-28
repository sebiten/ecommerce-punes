"use server";

import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { ensureUserProfile } from "@/actions/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { CartItem, ProductWithDetails } from "@/types";

const cartItemInputSchema = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().nullable(),
  quantity: z.number().int().positive(),
});

type CartItemInput = z.infer<typeof cartItemInputSchema>;

type CartRow = {
  id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  product?: any;
};

function createCartKey(productId: string, variantId: string | null) {
  return `${productId}:${variantId ?? "default"}`;
}

function mapProduct(product: any): ProductWithDetails {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    sizeGuide: product.size_guide || null,
    basePrice: Number(product.base_price) || 0,
    compareAtPrice: product.compare_at_price
      ? Number(product.compare_at_price)
      : null,
    brand: product.brand || null,
    categoryId: product.category_id,
    featured: product.featured || false,
    active: product.active !== false,
    createdAt: product.created_at,
    category: product.category
      ? {
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug,
          description: product.category.description,
          image_url: product.category.image_url,
          parent_id: product.category.parent_id,
          sort_order: product.category.sort_order || 0,
          active: product.category.active !== false,
          created_at: product.category.created_at,
        }
      : null,
    images: (product.images || [])
      .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((image: any) => ({
        id: image.id,
        product_id: image.product_id,
        url: image.url,
        alt: image.alt,
        sort_order: image.sort_order || 0,
      })),
    variants: (product.variants || []).map((variant: any) => ({
      id: variant.id,
      product_id: variant.product_id,
      size: variant.size || "",
      color: variant.color || null,
      sku: variant.sku || null,
      priceOverride: variant.price_override ? Number(variant.price_override) : null,
      stock: variant.stock || 0,
      active: variant.active !== false,
    })),
  };
}

function mapCartItem(row: CartRow): CartItem {
  return {
    id: row.id,
    product_id: row.product_id,
    variant_id: row.variant_id,
    quantity: row.quantity,
    product: row.product ? mapProduct(row.product) : undefined,
  };
}

function normalizeCartItems(items: CartItemInput[]): CartItemInput[] {
  const merged = new Map<string, CartItemInput>();

  for (const item of items) {
    const parsed = cartItemInputSchema.parse({
      product_id: item.product_id,
      variant_id: item.variant_id ?? null,
      quantity: item.quantity,
    });
    const key = createCartKey(parsed.product_id, parsed.variant_id);
    const existing = merged.get(key);

    if (existing) {
      existing.quantity += parsed.quantity;
      continue;
    }

    merged.set(key, { ...parsed });
  }

  return Array.from(merged.values());
}

async function selectUserCart(userId: string): Promise<CartItem[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("cart_items")
    .select(`
      id,
      product_id,
      variant_id,
      quantity,
      product:products(
        *,
        category:categories(*),
        images:product_images(*),
        variants:product_variants(*)
      )
    `)
    .eq("clerk_user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []).map((row) => mapCartItem(row as CartRow));
}

async function replaceUserCart(userId: string, items: CartItemInput[]) {
  const supabase = getSupabaseAdmin();
  const normalizedItems = normalizeCartItems(items);

  const { error: deleteError } = await supabase
    .from("cart_items")
    .delete()
    .eq("clerk_user_id", userId);

  if (deleteError) {
    throw deleteError;
  }

  if (normalizedItems.length === 0) {
    return;
  }

  const { error: insertError } = await supabase.from("cart_items").insert(
    normalizedItems.map((item) => ({
      clerk_user_id: userId,
      product_id: item.product_id,
      variant_id: item.variant_id,
      quantity: item.quantity,
    }))
  );

  if (insertError) {
    throw insertError;
  }
}

function mergeCartCollections(remoteItems: CartItem[], localItems: CartItemInput[]) {
  const merged = new Map<string, CartItemInput>();

  for (const item of remoteItems) {
    merged.set(createCartKey(item.product_id, item.variant_id), {
      product_id: item.product_id,
      variant_id: item.variant_id ?? null,
      quantity: item.quantity,
    });
  }

  for (const item of normalizeCartItems(localItems)) {
    const key = createCartKey(item.product_id, item.variant_id);

    if (merged.has(key)) {
      continue;
    }

    merged.set(key, { ...item });
  }

  return Array.from(merged.values());
}

function revalidateCartPaths() {
  revalidatePath("/cart");
  revalidatePath("/checkout");
}

export async function addToCart(
  productId: string,
  variantId: string | null,
  quantity: number
) {
  const { userId } = await auth();
  if (!userId) throw new Error("User not authenticated");

  await ensureUserProfile();

  const input = cartItemInputSchema.parse({
    product_id: productId,
    variant_id: variantId ?? null,
    quantity,
  });
  const existingItems = await selectUserCart(userId);
  const existingItem = existingItems.find(
    (item) =>
      item.product_id === input.product_id &&
      (item.variant_id ?? null) === input.variant_id
  );

  await replaceUserCart(userId, [
    ...existingItems
      .filter((item) => item.id !== existingItem?.id)
      .map((item) => ({
        product_id: item.product_id,
        variant_id: item.variant_id ?? null,
        quantity: item.quantity,
      })),
    {
      product_id: input.product_id,
      variant_id: input.variant_id,
      quantity: (existingItem?.quantity || 0) + input.quantity,
    },
  ]);

  revalidateCartPaths();
}

export async function removeFromCart(cartItemId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("User not authenticated");

  await ensureUserProfile();
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("id", cartItemId)
    .eq("clerk_user_id", userId);

  if (error) throw error;
  revalidateCartPaths();
}

export async function getCartItems(): Promise<CartItem[]> {
  const { userId } = await auth();
  if (!userId) return [];

  await ensureUserProfile();
  return selectUserCart(userId);
}

export async function updateCartItemQuantity(cartItemId: string, quantity: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("User not authenticated");

  await ensureUserProfile();
  const supabase = getSupabaseAdmin();

  if (quantity <= 0) {
    return removeFromCart(cartItemId);
  }

  const { error } = await supabase
    .from("cart_items")
    .update({ quantity })
    .eq("id", cartItemId)
    .eq("clerk_user_id", userId);

  if (error) throw error;
  revalidateCartPaths();
}

export async function mergeCartItems(items: CartItemInput[]): Promise<CartItem[]> {
  const { userId } = await auth();
  if (!userId) throw new Error("User not authenticated");

  await ensureUserProfile();
  const remoteItems = await selectUserCart(userId);
  const mergedItems = mergeCartCollections(remoteItems, items);

  await replaceUserCart(userId, mergedItems);
  revalidateCartPaths();

  return selectUserCart(userId);
}

export async function replaceCartItems(items: CartItemInput[]): Promise<CartItem[]> {
  const { userId } = await auth();
  if (!userId) throw new Error("User not authenticated");

  await ensureUserProfile();
  const normalizedItems = normalizeCartItems(items);

  await replaceUserCart(userId, normalizedItems);
  revalidateCartPaths();

  return selectUserCart(userId);
}
