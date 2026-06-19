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
    <div className="space-y-4">
      <div className="relative aspect-square overflow-hidden rounded-[2rem] border border-[#eadfce] bg-[#efe2d1] shadow-xl shadow-[#5c3514]/10">
        <Image
          src={selectedImage.url}
          alt={selectedImage.alt || productName}
          fill
          className="object-cover"
          preload
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#17110c]/45 to-transparent" />
        {featured ? (
          <Badge className="absolute left-5 top-5 border-0 bg-[#f6ae66] text-[#17110c] shadow-lg shadow-black/10">
            Destacado
          </Badge>
        ) : null}
      </div>

      {galleryImages.length > 1 ? (
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
          {galleryImages.map((image, index) => (
            <button
              key={image.id || image.url}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={`relative aspect-square overflow-hidden rounded-2xl border bg-[#efe2d1] transition ${
                selectedIndex === index
                  ? "border-[#9a5b19] ring-2 ring-[#9a5b19]/20"
                  : "border-[#eadfce] hover:border-[#9a5b19]/45"
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
