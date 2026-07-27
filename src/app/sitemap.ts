import type { MetadataRoute } from "next";
import { getBrands, getCategories, getProducts } from "@/actions/products";
import { absoluteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, brands] = await Promise.all([
    getProducts(),
    getCategories(),
    getBrands(),
  ]);
  const now = new Date();

  return [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/products"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/uniformes-escolares-ledesma"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.95,
    },
    ...[
      "/guia-de-talles",
      "/cambios-y-devoluciones",
      "/terminos",
      "/privacidad",
      "/arrepentimiento",
    ].map((path) => ({
      url: absoluteUrl(path),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: path === "/arrepentimiento" ? 0.6 : 0.5,
    })),
    ...categories.map((category) => ({
      url: absoluteUrl(`/categories/${category.slug}`),
      lastModified: new Date(category.created_at),
      changeFrequency: "weekly" as const,
      priority: 0.75,
    })),
    ...brands.map((brand) => ({
      url: absoluteUrl(`/brands/${encodeURIComponent(brand)}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...products.map((product) => ({
      url: absoluteUrl(`/products/${product.slug}`),
      lastModified: new Date(product.createdAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
      images: product.images.length
        ? product.images.map((image) => image.url)
        : undefined,
    })),
  ];
}
