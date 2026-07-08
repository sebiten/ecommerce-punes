import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Punes Colchones y Sommiers",
    short_name: "Punes",
    description:
      "Tienda online de colchones, sommiers y accesorios para el descanso.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fffaf4",
    theme_color: "#f6ae66",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
