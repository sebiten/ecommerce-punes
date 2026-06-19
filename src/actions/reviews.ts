"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath, unstable_cache, updateTag } from "next/cache";
import { z } from "zod";
import { ensureUserProfile } from "@/actions/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { ProductReview, ProductReviewStats } from "@/types";

type ReviewFormState = {
  ok: boolean;
  message: string;
};

const PRODUCT_REVIEWS_CACHE_TAG = "product-reviews";

const reviewSchema = z.object({
  productId: z.string().uuid(),
  productSlug: z.string().trim().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(80).optional(),
  comment: z.string().trim().min(10).max(1000),
});

function mapReview(row: any): ProductReview {
  return {
    id: row.id,
    product_id: row.product_id,
    clerk_user_id: row.clerk_user_id,
    order_id: row.order_id,
    rating: Number(row.rating),
    title: row.title,
    comment: row.comment,
    reviewer_name: row.reviewer_name,
    approved: row.approved !== false,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getProductReviewStats(
  productId: string
): Promise<ProductReviewStats> {
  return getProductReviewStatsCached(productId);
}

const getProductReviewStatsCached = unstable_cache(
  async (productId: string): Promise<ProductReviewStats> => {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("product_reviews")
      .select("rating")
      .eq("product_id", productId)
      .eq("approved", true);

    if (error) {
      console.error("Error fetching review stats:", error);
      return { average: 0, count: 0 };
    }

    const ratings = data || [];
    const count = ratings.length;
    const average = count
      ? ratings.reduce((sum, row) => sum + Number(row.rating), 0) / count
      : 0;

    return {
      average: Number(average.toFixed(1)),
      count,
    };
  },
  ["product-review-stats"],
  {
    tags: [PRODUCT_REVIEWS_CACHE_TAG],
    revalidate: 3600,
  }
);

export async function getProductReviews(productId: string): Promise<ProductReview[]> {
  return getProductReviewsCached(productId);
}

const getProductReviewsCached = unstable_cache(
  async (productId: string): Promise<ProductReview[]> => {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("product_reviews")
      .select("*")
      .eq("product_id", productId)
      .eq("approved", true)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error fetching reviews:", error);
      return [];
    }

    return (data || []).map(mapReview);
  },
  ["product-reviews"],
  {
    tags: [PRODUCT_REVIEWS_CACHE_TAG],
    revalidate: 3600,
  }
);

export async function getProductReviewEligibility(productId: string) {
  const { userId } = await auth();
  if (!userId) {
    return {
      canReview: false,
      reason: "Inicia sesión para dejar una reseña.",
      existingReview: null,
    };
  }

  const supabase = getSupabaseAdmin();
  const { data: existingReview } = await supabase
    .from("product_reviews")
    .select("*")
    .eq("product_id", productId)
    .eq("clerk_user_id", userId)
    .maybeSingle();

  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, status, items:order_items!inner(product_id)")
    .eq("clerk_user_id", userId)
    .in("status", ["paid", "shipped", "delivered"])
    .eq("items.product_id", productId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Error checking review eligibility:", error);
    return {
      canReview: false,
      reason: "No pudimos validar tu compra.",
      existingReview: existingReview ? mapReview(existingReview) : null,
    };
  }

  return {
    canReview: Boolean(orders?.[0]),
    reason: orders?.[0]
      ? null
      : "Solo clientes con una compra pagada pueden dejar reseña.",
    existingReview: existingReview ? mapReview(existingReview) : null,
    orderId: orders?.[0]?.id ?? null,
  };
}

export async function submitProductReview(
  _state: ReviewFormState,
  formData: FormData
): Promise<ReviewFormState> {
  const { userId } = await auth();
  if (!userId) {
    return { ok: false, message: "Inicia sesión para dejar una reseña." };
  }

  const parsed = reviewSchema.safeParse({
    productId: formData.get("productId"),
    productSlug: formData.get("productSlug"),
    rating: formData.get("rating"),
    title: formData.get("title"),
    comment: formData.get("comment"),
  });

  if (!parsed.success) {
    return { ok: false, message: "Completa la reseña con datos válidos." };
  }

  const profile = await ensureUserProfile(userId);
  const eligibility = await getProductReviewEligibility(parsed.data.productId);

  if (!eligibility.canReview || !eligibility.orderId) {
    return {
      ok: false,
      message: eligibility.reason || "No puedes opinar sobre este producto.",
    };
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("product_reviews").upsert(
    {
      product_id: parsed.data.productId,
      clerk_user_id: userId,
      order_id: eligibility.orderId,
      rating: parsed.data.rating,
      title: parsed.data.title || null,
      comment: parsed.data.comment,
      reviewer_name: profile.full_name || profile.email,
      approved: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "product_id,clerk_user_id" }
  );

  if (error) {
    console.error("Error saving review:", error);
    return { ok: false, message: "No se pudo guardar la reseña." };
  }

  updateTag(PRODUCT_REVIEWS_CACHE_TAG);
  revalidatePath(`/products/${parsed.data.productSlug}`);
  return { ok: true, message: "Resena guardada." };
}
