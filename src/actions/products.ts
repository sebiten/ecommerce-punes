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

const productPayloadSchema = z
  .object({
    name: z.string().trim().min(2),
    slug: z.string().trim().min(2),
    description: z.string().trim().max(4000).optional(),
    basePrice: z.number().positive(),
    compareAtPrice: z.number().positive().nullable().optional(),
    brand: z.string().trim().nullable().optional(),
    categoryId: z.string().uuid().nullable().optional(),
    featured: z.boolean().optional(),
    active: z.boolean().optional(),
    images: z.array(productImageSchema).max(10).default([]),
    variants: z.array(productVariantSchema).max(100).default([]),
  })
  .superRefine((product, context) => {
    if (product.active === false) return;

    if (!product.description || product.description.trim().length < 20) {
      context.addIssue({
        code: "custom",
        path: ["description"],
        message: "Un producto activo necesita una descripción completa",
      });
    }
    if (product.images.length === 0) {
      context.addIssue({
        code: "custom",
        path: ["images"],
        message: "Un producto activo necesita al menos una imagen",
      });
    }
    if (!product.variants.some((variant) => variant.active !== false)) {
      context.addIssue({
        code: "custom",
        path: ["variants"],
        message: "Un producto activo necesita al menos una variante",
      });
    }
  });

type ProductPayload = z.infer<typeof productPayloadSchema>;

type ProductMutationResult =
  | { ok: true }
  | { ok: false; error: string };

function getProductMutationError(error: unknown) {
  if (error instanceof z.ZodError) {
    return Array.from(new Set(error.issues.map((issue) => issue.message))).join(
      ". "
    );
  }

  if (error && typeof error === "object" && "code" in error) {
    const databaseError = error as {
      code?: string;
      message?: string;
      constraint?: string;
    };
    const details = `${databaseError.constraint ?? ""} ${databaseError.message ?? ""}`;

    if (databaseError.code === "23505") {
      if (details.includes("sku")) {
        return "Ese SKU ya está asignado a otra variante";
      }
      if (details.includes("product_variants")) {
        return "Ya existe una variante con ese talle y color";
      }
      return "Ya existe otro producto con ese nombre o dirección web";
    }
  }

  return "No se pudo guardar el producto. Revisá los datos e intentá nuevamente";
}

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
    `${a.size}-${a.color ?? ""}`.localeCompare(
      `${b.size}-${b.color ?? ""}`,
      "es",
      { numeric: true, sensitivity: "base" }
    )
  );
}

function mapProduct(product: any): ProductWithDetails {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
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
  const [
    { data: previousImages, error: previousImagesError },
    { data: previousVariants, error: previousVariantsError },
  ] = await Promise.all([
    supabase.from("product_images").select("*").eq("product_id", productId),
    supabase.from("product_variants").select("*").eq("product_id", productId),
  ]);
  if (previousImagesError) throw previousImagesError;
  if (previousVariantsError) throw previousVariantsError;

  const imageByUrl = new Map(
    (previousImages || []).map((image) => [image.url, image])
  );
  const desiredImages = payload.images.map((image, index) => ({
    id: imageByUrl.get(image.url)?.id ?? randomUUID(),
    product_id: productId,
    url: image.url,
    alt: image.alt || null,
    sort_order: index,
  }));
  const variants = normalizeProductVariants(payload.variants);
  const variantByKey = new Map(
    (previousVariants || []).map((variant) => [
      `${variant.size?.trim().toLocaleLowerCase("es-AR") ?? ""}:${
        variant.color?.trim().toLocaleLowerCase("es-AR") ?? ""
      }`,
      variant,
    ])
  );
  const desiredVariants = variants.map((variant) => {
    const key = `${variant.size.toLocaleLowerCase("es-AR")}:${
      variant.color?.toLocaleLowerCase("es-AR") ?? ""
    }`;
    return {
      id: variantByKey.get(key)?.id ?? randomUUID(),
      product_id: productId,
      size: variant.size,
      color: variant.color ?? null,
      sku: variant.sku ?? null,
      price_override: variant.priceOverride ?? null,
      stock: variant.stock ?? 0,
      active: variant.active ?? true,
    };
  });
  const desiredImageIds = new Set(desiredImages.map((image) => image.id));
  const desiredVariantIds = new Set(
    desiredVariants.map((variant) => variant.id)
  );
  const staleImages = (previousImages || []).filter(
    (image) => !desiredImageIds.has(image.id)
  );
  const staleVariants = (previousVariants || []).filter(
    (variant) => !desiredVariantIds.has(variant.id)
  );

  try {
    if (desiredImages.length > 0) {
      const { error } = await supabase
        .from("product_images")
        .upsert(desiredImages, { onConflict: "id" });
      if (error) throw error;
    }
    if (desiredVariants.length > 0) {
      const { error } = await supabase
        .from("product_variants")
        .upsert(desiredVariants, { onConflict: "id" });
      if (error) throw error;
    }
    if (staleImages.length > 0) {
      const { error } = await supabase
        .from("product_images")
        .delete()
        .in(
          "id",
          staleImages.map((image) => image.id)
        );
      if (error) throw error;
    }
    if (staleVariants.length > 0) {
      const staleIds = staleVariants.map((variant) => variant.id);
      const { error } = await supabase
        .from("product_variants")
        .delete()
        .in("id", staleIds);

      if (error?.code === "23503") {
        const { error: archiveError } = await supabase
          .from("product_variants")
          .update({ active: false, stock: 0 })
          .in("id", staleIds);
        if (archiveError) throw archiveError;
      } else if (error) {
        throw error;
      }
    }
  } catch (error) {
    const previousImageIds = new Set(
      (previousImages || []).map((image) => image.id)
    );
    const previousVariantIds = new Set(
      (previousVariants || []).map((variant) => variant.id)
    );
    const newImageIds = desiredImages
      .filter((image) => !previousImageIds.has(image.id))
      .map((image) => image.id);
    const newVariantIds = desiredVariants
      .filter((variant) => !previousVariantIds.has(variant.id))
      .map((variant) => variant.id);

    if (newImageIds.length > 0) {
      await supabase.from("product_images").delete().in("id", newImageIds);
    }
    if (newVariantIds.length > 0) {
      await supabase.from("product_variants").delete().in("id", newVariantIds);
    }
    if ((previousImages || []).length > 0) {
      await supabase
        .from("product_images")
        .upsert(previousImages || [], { onConflict: "id" });
    }
    if ((previousVariants || []).length > 0) {
      await supabase
        .from("product_variants")
        .upsert(previousVariants || [], { onConflict: "id" });
    }
    throw error;
  }

  return staleImages.map((image) => image.url);
}

function getProductImageStoragePath(url: string) {
  try {
    const marker = `/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/`;
    const pathname = new URL(url).pathname;
    const markerIndex = pathname.indexOf(marker);
    if (markerIndex === -1) return null;
    return decodeURIComponent(pathname.slice(markerIndex + marker.length));
  } catch {
    return null;
  }
}

async function removeUnreferencedProductImages(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  urls: string[]
) {
  const paths: string[] = [];

  for (const url of urls) {
    const path = getProductImageStoragePath(url);
    if (!path) continue;

    const { count, error } = await supabase
      .from("product_images")
      .select("id", { count: "exact", head: true })
      .eq("url", url);
    if (!error && count === 0) paths.push(path);
  }

  if (paths.length > 0) {
    const { error } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .remove(paths);
    if (error) {
      console.error("No se pudieron limpiar imágenes sin referencia:", error);
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
  ["products-public-v4"],
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
  ["product-by-slug-v4"],
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

  try {
    await replaceProductRelations(supabase, product.id, payload);
  } catch (relationError) {
    await supabase.from("products").delete().eq("id", product.id);
    await removeUnreferencedProductImages(
      supabase,
      payload.images.map((image) => image.url)
    );
    throw relationError;
  }
  revalidateProductCacheFromServerAction(product.slug);

  return product;
}

export async function saveProduct(
  input: ProductPayload,
  productId?: string
): Promise<ProductMutationResult> {
  try {
    if (productId) {
      await updateProduct(productId, input);
    } else {
      await createProduct(input);
    }

    return { ok: true };
  } catch (error) {
    console.error("Error al guardar el producto:", error);
    return { ok: false, error: getProductMutationError(error) };
  }
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

  let removedImageUrls: string[];
  try {
    removedImageUrls = await replaceProductRelations(supabase, id, payload);
  } catch (relationError) {
    await supabase
      .from("products")
      .update({
        name: existing.name,
        slug: existing.slug,
        description: existing.description || null,
        base_price: existing.basePrice,
        compare_at_price: existing.compareAtPrice,
        brand: existing.brand,
        category_id: existing.categoryId,
        featured: existing.featured,
        active: existing.active,
      })
      .eq("id", id);
    throw relationError;
  }

  await removeUnreferencedProductImages(supabase, removedImageUrls);
  revalidateProductCacheFromServerAction(existing.slug);
  revalidateProductCacheFromServerAction(payload.slug);
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  const supabase = getSupabaseAdmin();
  const existing = await getProductByIdAdmin(id);

  if (!existing) {
    throw new Error("Producto no encontrado");
  }

  const imageUrls = existing.images.map((image) => image.url);
  const { count: orderItemCount, error: orderItemCountError } = await supabase
    .from("order_items")
    .select("id", { count: "exact", head: true })
    .eq("product_id", id);
  if (orderItemCountError) throw orderItemCountError;

  const productMutation =
    (orderItemCount ?? 0) > 0
      ? supabase.from("products").update({ active: false }).eq("id", id)
      : supabase.from("products").delete().eq("id", id);
  const { error } = await productMutation;
  if (error) {
    throw error;
  }

  if ((orderItemCount ?? 0) === 0) {
    await removeUnreferencedProductImages(supabase, imageUrls);
  }
  revalidateProductCacheFromServerAction(existing.slug);
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
