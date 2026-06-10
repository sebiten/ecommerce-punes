"use client";

import { useCartStore } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { getCartItemLineTotal } from "@/lib/commerce";

export function CartContent() {
  const { items, removeItem, updateQuantity, getTotal, setIsOpen } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <p className="text-muted-foreground mb-4">Tu carrito está vacío</p>
        <Button asChild>
          <Link href="/products" onClick={() => setIsOpen(false)}>
            Ver productos
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4">
        {items.map((item) => {
          const imageUrl =
            item.product?.images?.[0]?.url ||
            "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=300&h=300&fit=crop";
          const selectedVariant = item.variant_id
            ? item.product?.variants?.find((variant) => variant.id === item.variant_id)
            : null;
          const maxQuantity = selectedVariant ? Number(selectedVariant.stock ?? 0) : null;
          const hasReachedStockLimit =
            maxQuantity !== null && item.quantity >= maxQuantity;
          const isUnavailableVariant = Boolean(item.variant_id && !selectedVariant);

          return (
            <div key={`${item.product_id}-${item.variant_id}`} className="flex gap-4">
              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                <Image
                  src={imageUrl}
                  alt={item.product?.name || "Producto"}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <h4 className="text-sm font-medium line-clamp-1">
                    {item.product?.name}
                  </h4>
                  {selectedVariant ? (
                    <p className="text-xs text-muted-foreground">
                      {selectedVariant?.width} x {selectedVariant?.length} cm
                    </p>
                  ) : null}
                  {isUnavailableVariant ? (
                    <p className="text-xs text-destructive">
                      Variante no disponible
                    </p>
                  ) : null}
                  {maxQuantity !== null ? (
                    <p className="text-xs text-muted-foreground">
                      Stock disponible: {maxQuantity}
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() =>
                        updateQuantity(item.product_id, item.variant_id, item.quantity - 1)
                      }
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() =>
                        updateQuantity(item.product_id, item.variant_id, item.quantity + 1)
                      }
                      disabled={hasReachedStockLimit || isUnavailableVariant}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  <p className="text-sm font-medium">
                    {formatPrice(getCartItemLineTotal(item))}
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => removeItem(item.product_id, item.variant_id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>

      <div className="border-t pt-4 mt-4 space-y-4">
        <div className="flex items-center justify-between text-lg font-semibold">
          <span>Total</span>
          <span>{formatPrice(getTotal())}</span>
        </div>
        <Button className="w-full" size="lg" asChild>
          <Link href="/checkout" onClick={() => setIsOpen(false)}>
            Finalizar compra
          </Link>
        </Button>
      </div>
    </div>
  );
}
