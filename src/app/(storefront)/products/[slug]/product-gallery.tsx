"use client";

import { useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import type { ProductImage } from "@/types";

interface ProductGalleryProps {
  productName: string;
  featured: boolean;
  images: ProductImage[];
}

const fallbackImage =
  "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=800&fit=crop";

export function ProductGallery({
  productName,
  featured,
  images,
}: ProductGalleryProps) {
  const galleryImages = images.length
    ? images
    : [{ id: "fallback", url: fallbackImage, alt: productName, sort_order: 0, product_id: "" }];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedImage = galleryImages[selectedIndex] ?? galleryImages[0];

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
        <Image
          src={selectedImage.url}
          alt={selectedImage.alt || productName}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
        {featured ? (
          <Badge className="absolute left-4 top-4">Destacado</Badge>
        ) : null}
      </div>

      {galleryImages.length > 1 ? (
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
          {galleryImages.map((image, index) => (
            <button
              key={image.id || image.url}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={`relative aspect-square overflow-hidden rounded-lg border bg-muted ${
                selectedIndex === index ? "border-primary ring-2 ring-primary/25" : "border-border"
              }`}
              aria-label={`Ver imagen ${index + 1} de ${productName}`}
            >
              <Image
                src={image.url}
                alt={image.alt || productName}
                fill
                className="object-cover"
                sizes="96px"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
