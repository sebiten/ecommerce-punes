import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/account/", "/api/", "/checkout", "/dashboard/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
