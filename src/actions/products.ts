"use server";

import { cache } from "react";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { unstable_cache } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/actions/auth";
import { getCategoriesPublic } from "@/actions/categories";
import {
  PRODUCT_DETAILS_CACHE_TAG,
  PRODUCTS_CACHE_TAG,
  revalidateProductCacheFromServerAction,
} from "@/lib/cache/products";
import type { Category, ProductWithDetails } from "@/types";
import { reportDataFallback } from "@/lib/logging";

const productImageSchema = z.object({
  url: z.string().url(),
  alt: z.string().trim().optional(),
});

const productVariantSchema = z.object({
  size: z.string().trim().min(1),
  color: z.string().trim().nullable().optional(),
  sku: z.string().trim().nullable().optional(),
  priceOverride: z.number().nonnegative().nullable().optional(),
  stock: z.number().int().nonnegative().optional(),
  active: z.boolean().optional(),
});

const productPayloadSchema = z.object({
  name: z.string().trim().min(2),
  slug: z.string().trim().min(2),
  description: z.string().trim().optional(),
  sizeGuide: z.string().trim().max(4000).optional(),
  basePrice: z.number().nonnegative(),
  compareAtPrice: z.number().nonnegative().nullable().optional(),
  brand: z.string().trim().nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  images: z.array(productImageSchema).default([]),
  variants: z.array(productVariantSchema).default([]),
});

type ProductPayload = z.infer<typeof productPayloadSchema>;

const PRODUCT_IMAGES_BUCKET = "product-images";
const MAX_PRODUCT_IMAGE_SIZE = 4 * 1024 * 1024;

function normalizeProductVariants(variants: ProductPayload["variants"]) {
  const variantsBySize = new Map<string, ProductPayload["variants"][number]>();

  for (const variant of variants) {
    const size = variant.size.trim();
    const color = variant.color?.trim() || null;
    const sku = variant.sku?.trim() || null;
    const key = `${size.toLocaleLowerCase("es-AR")}:${color?.toLocaleLowerCase("es-AR") ?? ""}`;
    const existing = variantsBySize.get(key);

    if (!existing) {
      variantsBySize.set(key, { ...variant, size, color, sku });
      continue;
    }

    variantsBySize.set(key, {
      ...existing,
      sku: existing.sku || sku,
      priceOverride: existing.priceOverride ?? variant.priceOverride ?? null,
      stock: Number(existing.stock ?? 0) + Number(variant.stock ?? 0),
      active: Boolean(existing.active ?? true) || Boolean(variant.active ?? true),
    });
  }

  return Array.from(variantsBySize.values()).sort((a, b) =>
    `${a.size}-${a.color ?? ""}`.localeCompare(`${b.size}-${b.color ?? ""}`, "es")
  );
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

async function fetchProduct(query: any) {
  const { data, error } = await query.maybeSingle();

  if (error) throw error;
  if (!data) return null;

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

  const variants = normalizeProductVariants(payload.variants);

  if (variants.length > 0) {
    const { error } = await supabase.from("product_variants").insert(
      variants.map((variant) => ({
        product_id: productId,
        size: variant.size,
        color: variant.color ?? null,
        sku: variant.sku ?? null,
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

export async function getProducts(options?: {
  categorySlug?: string;
  brand?: string;
  searchTerm?: string;
  featured?: boolean;
  limit?: number;
}): Promise<ProductWithDetails[]> {
  try {
    return await getProductsCached({
      categorySlug: options?.categorySlug,
      brand: options?.brand?.trim() || undefined,
      searchTerm: options?.searchTerm?.trim() || undefined,
      featured: options?.featured,
      limit: options?.limit,
    });
  } catch (error) {
    reportDataFallback("products", error);
    return [];
  }
}

const getProductsCached = unstable_cache(
  async (options?: {
    categorySlug?: string;
    brand?: string;
    searchTerm?: string;
    featured?: boolean;
    limit?: number;
  }): Promise<ProductWithDetails[]> => {
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
      const { data: selectedCategory, error: categoryError } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", options.categorySlug)
        .eq("active", true)
        .maybeSingle();

      if (categoryError) throw categoryError;
      if (!selectedCategory) return [];

      const { data: childCategories, error: childCategoriesError } =
        await supabase
          .from("categories")
          .select("id")
          .eq("parent_id", selectedCategory.id)
          .eq("active", true);

      if (childCategoriesError) throw childCategoriesError;
      query = query.in("category_id", [
        selectedCategory.id,
        ...(childCategories || []).map((category) => category.id),
      ]);
    }

    if (options?.brand) {
      query = query.ilike("brand", options.brand);
    }

    if (options?.searchTerm) {
      const searchTerm = options.searchTerm.replace(/[,%()]/g, " ").trim();
      if (searchTerm) {
        query = query.or(
          `name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%`
        );
      }
    }

    if (options?.featured) {
      query = query.eq("featured", true);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map(mapProduct);
  },
  ["products-public-v2"],
  {
    tags: [PRODUCTS_CACHE_TAG],
    revalidate: 3600,
  }
);

export async function getBrands(): Promise<string[]> {
  try {
    return await getBrandsCached();
  } catch (error) {
    reportDataFallback("brands", error);
    return [];
  }
}

const getBrandsCached = unstable_cache(
  async (): Promise<string[]> => {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("products")
      .select("brand")
      .eq("active", true)
      .not("brand", "is", null)
      .order("brand", { ascending: true });

    if (error) throw error;

    return Array.from(
      new Set(
        (data || [])
          .map((row) => row.brand?.trim())
          .filter((brand): brand is string => Boolean(brand))
      )
    );
  },
  ["product-brands-v2"],
  {
    tags: [PRODUCTS_CACHE_TAG],
    revalidate: 3600,
  }
);

export const getProductBySlug = cache(async function getProductBySlug(
  slug: string
): Promise<ProductWithDetails | null> {
  try {
    return await getProductBySlugCached(slug);
  } catch (error) {
    reportDataFallback("product", error);
    return null;
  }
});

const getProductBySlugCached = unstable_cache(
  async (slug: string): Promise<ProductWithDetails | null> => {
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
  },
  ["product-by-slug-v2"],
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
      size_guide: payload.sizeGuide || null,
      base_price: payload.basePrice,
      compare_at_price: payload.compareAtPrice ?? null,
      brand: payload.brand || null,
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
  revalidateProductCacheFromServerAction(product.slug);

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
      size_guide: payload.sizeGuide || null,
      base_price: payload.basePrice,
      compare_at_price: payload.compareAtPrice ?? null,
      brand: payload.brand || null,
      category_id: payload.categoryId || null,
      featured: payload.featured || false,
      active: payload.active ?? true,
    })
    .eq("id", id);

  if (error) {
    throw error;
  }

  await replaceProductRelations(supabase, id, payload);
  revalidateProductCacheFromServerAction(existing.slug);
  revalidateProductCacheFromServerAction(payload.slug);
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  const supabase = getSupabaseAdmin();
  const existing = await getProductByIdAdmin(id);

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    throw error;
  }

  revalidateProductCacheFromServerAction(existing?.slug);
}

export async function renameProductBrand(
  currentBrand: string,
  formData: FormData
) {
  await requireAdmin();
  const nextBrand = z
    .string()
    .trim()
    .min(1)
    .max(80)
    .parse(formData.get("brand"));
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("products")
    .update({ brand: nextBrand })
    .ilike("brand", currentBrand);

  if (error) throw error;
  revalidateProductCacheFromServerAction();
}
