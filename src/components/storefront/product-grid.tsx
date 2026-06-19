import { ProductCard } from "./product-card";
import type { ProductWithDetails } from "@/types";

interface ProductGridProps {
  products: ProductWithDetails[];
  priorityFirst?: number;
}

export function ProductGrid({ products, priorityFirst = 0 }: ProductGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          priority={index < priorityFirst}
        />
      ))}
    </div>
  );
}
