import type { MetadataRoute } from "next";
import { getProducts } from "@/actions/products";
import { absoluteUrl } from "@/lib/site";

function getXmlSafeImageUrl(url: string) {
  return url.replaceAll("&", "&amp;");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts({ categorySlug: "uniformes-escolares" });
  const now = new Date();
  const indexableProducts = products.filter(
    (product) => !product.slug.startsWith("gloria-demo-")
  );

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
    ...indexableProducts.map((product) => ({
      url: absoluteUrl(`/products/${product.slug}`),
      lastModified: new Date(product.createdAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
      images: product.images.length
        ? product.images.map((image) => getXmlSafeImageUrl(image.url))
        : undefined,
    })),
  ];
}
