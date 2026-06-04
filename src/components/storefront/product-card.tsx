import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import type { ProductWithDetails } from "@/types";

interface ProductCardProps {
  product: ProductWithDetails;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const imageUrl =
    product.images?.[0]?.url ||
    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=600&fit=crop";

  return (
    <Link href={`/products/${product.slug}`}>
      <Card className="group h-full overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1">
        <div className="relative aspect-square overflow-hidden bg-[#f8f4f0]">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            priority={priority}
          />
          {product.featured && (
            <Badge className="absolute left-3 top-3 bg-[#f6ae66] text-black border-0 font-semibold">
              Destacado
            </Badge>
          )}
        </div>
        <CardContent className="p-5">
          {product.category && (
            <p className="text-xs text-[#f6ae66] font-medium uppercase tracking-wider mb-2">
              {product.category.name}
            </p>
          )}
          <h3 className="font-semibold text-lg line-clamp-2 mb-2">{product.name}</h3>
        </CardContent>
        <CardFooter className="p-5 pt-0 flex items-center justify-between">
          <p className="font-bold text-xl text-[#1a1a1a]">
            {formatPrice(Number(product.basePrice))}
          </p>
          <span className="text-sm text-[#f6ae66] font-medium group-hover:translate-x-1 transition-transform">
            Ver →
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
