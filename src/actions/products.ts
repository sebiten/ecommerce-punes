"use server";

import { cache } from "react";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { revalidatePath, unstable_cache, updateTag } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/actions/auth";
import { getCategoriesPublic } from "@/actions/categories";
import type { Category, ProductWithDetails } from "@/types";

const productImageSchema = z.object({
  url: z.string().url(),
  alt: z.string().trim().optional(),
});

const productVariantSchema = z.object({
  width: z.number().positive(),
  length: z.number().positive(),
  priceOverride: z.number().nonnegative().nullable().optional(),
  stock: z.number().int().nonnegative().optional(),
  active: z.boolean().optional(),
});

const productPayloadSchema = z.object({
  name: z.string().trim().min(2),
  slug: z.string().trim().min(2),
  description: z.string().trim().optional(),
  basePrice: z.number().nonnegative(),
  categoryId: z.string().uuid().nullable().optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  images: z.array(productImageSchema).default([]),
  variants: z.array(productVariantSchema).default([]),
});

type ProductPayload = z.infer<typeof productPayloadSchema>;

const PRODUCTS_CACHE_TAG = "products";
const PRODUCT_DETAILS_CACHE_TAG = "product-details";
const PRODUCT_IMAGES_BUCKET = "product-images";
const MAX_PRODUCT_IMAGE_SIZE = 4 * 1024 * 1024;

function mapProduct(product: any): ProductWithDetails {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    basePrice: Number(product.base_price) || 0,
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
      width: Number(variant.width) || 0,
      length: Number(variant.length) || 0,
      priceOverride: variant.price_override ? Number(variant.price_override) : null,
      stock: variant.stock || 0,
      active: variant.active !== false,
    })),
  };
}

async function fetchProduct(query: any) {
  const { data, error } = await query.single();

  if (error || !data) {
    return null;
  }

  return mapProduct(data);
}

async function replaceProductRelations(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  productId: string,
  payload: ProductPayload
) {
  await supabase.from("product_images").delete().eq("product_id", productId);
  await supabase.from("product_variants").delete().eq("product_id", productId);

  if (payload.images.length > 0) {
    const { error } = await supabase.from("product_images").insert(
      payload.images.map((image, index) => ({
        product_id: productId,
        url: image.url,
        alt: image.alt || null,
        sort_order: index,
      }))
    );

    if (error) {
      throw error;
    }
  }

  if (payload.variants.length > 0) {
    const { error } = await supabase.from("product_variants").insert(
      payload.variants.map((variant) => ({
        product_id: productId,
        width: variant.width,
        length: variant.length,
        price_override: variant.priceOverride ?? null,
        stock: variant.stock ?? 0,
        active: variant.active ?? true,
      }))
    );

    if (error) {
      throw error;
    }
  }
}

async function revalidateProductPaths(slug?: string) {
  updateTag(PRODUCTS_CACHE_TAG);
  updateTag(PRODUCT_DETAILS_CACHE_TAG);
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/dashboard/products");

  if (slug) {
    revalidatePath(`/products/${slug}`);
  }
}

export async function getProducts(options?: {
  categorySlug?: string;
  searchTerm?: string;
  featured?: boolean;
  limit?: number;
}): Promise<ProductWithDetails[]> {
  return getProductsCached({
    categorySlug: options?.categorySlug,
    searchTerm: options?.searchTerm?.trim() || undefined,
    featured: options?.featured,
    limit: options?.limit,
  });
}

const getProductsCached = unstable_cache(
  async (options?: {
    categorySlug?: string;
    searchTerm?: string;
    featured?: boolean;
    limit?: number;
  }): Promise<ProductWithDetails[]> => {
    try {
      const supabase = getSupabaseAdmin();

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

      if (options?.searchTerm) {
        query = query.or(`name.ilike.%${options.searchTerm}%,description.ilike.%${options.searchTerm}%`);
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

      return (data || []).map(mapProduct);
    } catch (error) {
      console.error("Error fetching products:", error);
      return [];
    }
  },
  ["products-public"],
  {
    tags: [PRODUCTS_CACHE_TAG],
    revalidate: 3600,
  }
);

export const getProductBySlug = cache(async function getProductBySlug(
  slug: string
): Promise<ProductWithDetails | null> {
  return getProductBySlugCached(slug);
});

const getProductBySlugCached = unstable_cache(
  async (slug: string): Promise<ProductWithDetails | null> => {
    try {
      const supabase = getSupabaseAdmin();

      return fetchProduct(
        supabase
          .from("products")
          .select(`
            *,
            category:categories(*),
            images:product_images(*),
            variants:product_variants(*)
          `)
          .eq("slug", slug)
          .eq("active", true)
      );
    } catch (error) {
      console.error("Error fetching product:", error);
      return null;
    }
  },
  ["product-by-slug"],
  {
    tags: [PRODUCT_DETAILS_CACHE_TAG],
    revalidate: 3600,
  }
);

export async function getProductByIdAdmin(id: string): Promise<ProductWithDetails | null> {
  await requireAdmin();
  const supabase = getSupabaseAdmin();

  return fetchProduct(
    supabase
      .from("products")
      .select(`
        *,
        category:categories(*),
        images:product_images(*),
        variants:product_variants(*)
      `)
      .eq("id", id)
  );
}

export async function getCategories(): Promise<Category[]> {
  return getCategoriesPublic();
}

export async function createProduct(input: ProductPayload) {
  await requireAdmin();
  const payload = productPayloadSchema.parse(input);
  const supabase = getSupabaseAdmin();

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      name: payload.name,
      slug: payload.slug,
      description: payload.description || null,
      base_price: payload.basePrice,
      category_id: payload.categoryId || null,
      featured: payload.featured || false,
      active: payload.active ?? true,
    })
    .select("id, slug")
    .single();

  if (error || !product) {
    throw error ?? new Error("No se pudo crear el producto");
  }

  await replaceProductRelations(supabase, product.id, payload);
  await revalidateProductPaths(product.slug);

  return product;
}

export async function uploadProductImage(formData: FormData) {
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("Archivo invalido");
  }

  if (file.size > MAX_PRODUCT_IMAGE_SIZE) {
    throw new Error("La imagen no puede superar 4MB");
  }

  if (file.type !== "image/webp") {
    throw new Error("La imagen debe estar convertida a WebP");
  }

  const supabase = getSupabaseAdmin();
  const path = `products/${randomUUID()}.webp`;
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(path, file, {
      cacheControl: "31536000",
      contentType: "image/webp",
      upsert: false,
    });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path);

  return {
    path,
    url: data.publicUrl,
  };
}

export async function updateProduct(id: string, input: ProductPayload) {
  await requireAdmin();
  const payload = productPayloadSchema.parse(input);
  const supabase = getSupabaseAdmin();

  const existing = await getProductByIdAdmin(id);
  if (!existing) {
    throw new Error("Producto no encontrado");
  }

  const { error } = await supabase
    .from("products")
    .update({
      name: payload.name,
      slug: payload.slug,
      description: payload.description || null,
      base_price: payload.basePrice,
      category_id: payload.categoryId || null,
      featured: payload.featured || false,
      active: payload.active ?? true,
    })
    .eq("id", id);

  if (error) {
    throw error;
  }

  await replaceProductRelations(supabase, id, payload);
  await revalidateProductPaths(existing.slug);
  await revalidateProductPaths(payload.slug);
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  const supabase = getSupabaseAdmin();
  const existing = await getProductByIdAdmin(id);

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    throw error;
  }

  await revalidateProductPaths(existing?.slug);
}
