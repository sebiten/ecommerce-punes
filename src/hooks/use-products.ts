"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { ProductWithDetails, Category } from "@/types";

const supabase = createClient();

export function useProducts(options?: {
  categorySlug?: string;
  featured?: boolean;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["products", options],
    queryFn: async () => {
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
      if (error) throw error;
      return (data || []) as ProductWithDetails[];
    },
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
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

      if (error) throw error;
      return data as ProductWithDetails;
    },
    enabled: !!slug,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return (data || []) as Category[];
    },
  });
}

export function useFeaturedProducts(limit = 8) {
  return useProducts({ featured: true, limit });
}