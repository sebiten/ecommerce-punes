import { createClient } from "@/lib/supabase/client";
import type { ProductWithDetails, Category } from "@/types";

export async function getProducts(options?: {
  categorySlug?: string;
  featured?: boolean;
  limit?: number;
}): Promise<ProductWithDetails[]> {
  const supabase = createClient();

  let query = supabase
    .from("products")
    .select(`
      *,
      category:categories(*),
      images:product_images(*),
      variants:product_variants(*)
    `)
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (options?.categorySlug) {
    const { data: selectedCategory } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", options.categorySlug)
      .eq("active", true)
      .maybeSingle();

    if (!selectedCategory) {
      return [];
    }

    const { data: childCategories } = await supabase
      .from("categories")
      .select("id")
      .eq("parent_id", selectedCategory.id)
      .eq("active", true);

    query = query.in("category_id", [
      selectedCategory.id,
      ...(childCategories || []).map((category) => category.id),
    ]);
  }

  if (options?.featured) {
    query = query.eq("featured", true);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function getProductBySlug(slug: string): Promise<ProductWithDetails | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      category:categories(*),
      images:product_images(*),
      variants:product_variants(*)
    `)
    .eq("slug", slug)
    .eq("active", true)
    .single();

  if (error) return null;
  return data as ProductWithDetails;
}

export async function getCategories(): Promise<Category[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .single();

  if (error) return null;
  return data;
}
