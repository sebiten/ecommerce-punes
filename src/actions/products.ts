"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ProductWithDetails, ProductImage, ProductVariant, Category } from "@/types";

export async function getProducts(options?: {
  categorySlug?: string;
  featured?: boolean;
  limit?: number;
}): Promise<ProductWithDetails[]> {
  try {
    const supabase = await createClient();

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
      query = query.eq("category.slug", options.categorySlug);
    }

    if (options?.featured) {
      query = query.eq("featured", true);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching products:", error);
      return [];
    }

    return (data || []).map((product: any) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      basePrice: parseFloat(product.base_price) || 0,
      categoryId: product.category_id,
      featured: product.featured || false,
      active: product.active !== false,
      createdAt: product.created_at,
      category: product.category ? {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug,
        description: product.category.description,
        image_url: product.category.image_url,
        parent_id: product.category.parent_id,
        sort_order: product.category.sort_order || 0,
        created_at: product.category.created_at,
      } : null,
      images: (product.images || []).map((img: any) => ({
        id: img.id,
        product_id: img.product_id,
        url: img.url,
        alt: img.alt,
        sort_order: img.sort_order || 0,
      })),
      variants: (product.variants || []).map((v: any) => ({
        id: v.id,
        product_id: v.product_id,
        width: parseFloat(v.width) || 0,
        length: parseFloat(v.length) || 0,
        priceOverride: v.price_override ? parseFloat(v.price_override) : null,
        stock: v.stock || 0,
        active: v.active !== false,
      })),
    })) as ProductWithDetails[];
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export async function getProductBySlug(slug: string): Promise<ProductWithDetails | null> {
  try {
    const supabase = await createClient();

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

    if (error || !data) return null;

    const product = data as any;
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      basePrice: parseFloat(product.base_price) || 0,
      categoryId: product.category_id,
      featured: product.featured || false,
      active: product.active !== false,
      createdAt: product.created_at,
      category: product.category ? {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug,
        description: product.category.description,
        image_url: product.category.image_url,
        parent_id: product.category.parent_id,
        sort_order: product.category.sort_order || 0,
        created_at: product.category.created_at,
      } : null,
      images: (product.images || []).map((img: any) => ({
        id: img.id,
        product_id: img.product_id,
        url: img.url,
        alt: img.alt,
        sort_order: img.sort_order || 0,
      })),
      variants: (product.variants || []).map((v: any) => ({
        id: v.id,
        product_id: v.product_id,
        width: parseFloat(v.width) || 0,
        length: parseFloat(v.length) || 0,
        priceOverride: v.price_override ? parseFloat(v.price_override) : null,
        stock: v.stock || 0,
        active: v.active !== false,
      })),
    } as ProductWithDetails;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching categories:", error);
      return [];
    }
    return (data || []) as Category[];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export async function createProduct(product: {
  name: string;
  slug: string;
  description?: string;
  basePrice: number;
  categoryId?: string;
  featured?: boolean;
  images: { url: string; alt?: string }[];
  variants: { width: number; length: number; priceOverride?: number; stock?: number }[];
}) {
  const supabase = await createClient();

  const { data: productData, error: productError } = await supabase
    .from("products")
    .insert({
      name: product.name,
      slug: product.slug,
      description: product.description,
      base_price: product.basePrice,
      category_id: product.categoryId,
      featured: product.featured || false,
    })
    .select()
    .single();

  if (productError) throw productError;

  if (product.images.length > 0) {
    await supabase.from("product_images").insert(
      product.images.map((img, idx) => ({
        product_id: productData.id,
        url: img.url,
        alt: img.alt,
        sort_order: idx,
      }))
    );
  }

  if (product.variants.length > 0) {
    await supabase.from("product_variants").insert(
      product.variants.map((v) => ({
        product_id: productData.id,
        width: v.width,
        length: v.length,
        price_override: v.priceOverride,
        stock: v.stock || 0,
      }))
    );
  }

  revalidatePath("/");
  revalidatePath("/products");
  return productData;
}

export async function updateProduct(
  id: string,
  product: {
    name?: string;
    slug?: string;
    description?: string;
    basePrice?: number;
    categoryId?: string;
    featured?: boolean;
    active?: boolean;
  }
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("products")
    .update({
      name: product.name,
      slug: product.slug,
      description: product.description,
      base_price: product.basePrice,
      category_id: product.categoryId,
      featured: product.featured,
      active: product.active,
    })
    .eq("id", id);

  if (error) throw error;

  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath(`/products/${product.slug}`);
}

export async function deleteProduct(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;

  revalidatePath("/");
  revalidatePath("/products");
}