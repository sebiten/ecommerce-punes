import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import type { ProductWithDetails } from "@/types";

interface ProductCardProps {
  product: ProductWithDetails;
  priority?: boolean;
}

function getAvailableVariants(product: ProductWithDetails) {
  return product.variants.filter(
    (variant) => variant.active !== false && Number(variant.stock ?? 0) > 0
  );
}

function getDisplayPrice(product: ProductWithDetails) {
  const variantPrices = getAvailableVariants(product)
    .map((variant) => Number(variant.priceOverride ?? product.basePrice))
    .filter((price) => Number.isFinite(price) && price > 0);

  return variantPrices.length ? Math.min(...variantPrices) : Number(product.basePrice);
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const imageUrl =
    product.images?.[0]?.url ||
    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=600&fit=crop";
  const availableVariants = getAvailableVariants(product);
  const totalStock = availableVariants.reduce(
    (sum, variant) => sum + Number(variant.stock ?? 0),
    0
  );
  const availableMeasureCount =
    availableVariants.length || product.variants.length || 1;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f6ae66] focus-visible:ring-offset-4"
    >
      <article className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-[#eadfce] bg-[#fffdf9] shadow-sm shadow-[#5c3514]/5 transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#5c3514]/12">
        <div className="relative aspect-[4/3] overflow-hidden bg-[#efe2d1]">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover transition duration-500 ease-out group-hover:scale-[1.04]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
          />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#17110c]/45 to-transparent" />
          {product.featured ? (
            <Badge className="absolute left-4 top-4 border-0 bg-[#f6ae66] text-[#17110c] shadow-lg shadow-black/10">
              Destacado
            </Badge>
          ) : null}
          <span className="absolute bottom-4 left-4 rounded-full bg-[#fffaf4]/95 px-3 py-1 text-xs font-semibold text-[#5f3b18] shadow-sm">
            {totalStock > 0 ? "Entrega disponible" : "Consultar stock"}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-5">
          {product.category ? (
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a5b19]">
              {product.category.name}
            </p>
          ) : null}

          <h3 className="mt-2 line-clamp-2 text-xl font-bold leading-tight text-[#17110c]">
            {product.name}
          </h3>

          <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#6d6257]">
            {product.description || "Descanso confiable con terminacion cuidada."}
          </p>

          <div className="mt-5 flex flex-wrap gap-2 text-xs text-[#6d4c2c]">
            <span className="rounded-full bg-[#f8f0e5] px-3 py-1">
              {availableMeasureCount} medida{availableMeasureCount !== 1 ? "s" : ""}
            </span>
            <span className="rounded-full bg-[#f8f0e5] px-3 py-1">
              {totalStock > 0 ? `Stock ${totalStock}` : "A pedido"}
            </span>
          </div>

          <div className="mt-auto space-y-4 pt-6">
            <div>
              <p className="text-xs text-[#8b7a69]">Desde</p>
              <p className="text-2xl font-black tracking-tight text-[#17110c]">
                {formatPrice(getDisplayPrice(product))}
              </p>
            </div>
            <span className="inline-flex w-full items-center justify-center rounded-full bg-[#f6ae66] px-4 py-3 text-sm font-bold text-[#17110c] shadow-sm shadow-[#5c3514]/10 transition group-hover:bg-[#ffbd79]">
              Ver producto
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
