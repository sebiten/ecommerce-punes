"use client";

import { useMemo, useState } from "react";
import { useCartStore } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { ProductWithDetails, ProductVariant } from "@/types";
import { formatPrice } from "@/lib/utils";

interface AddToCartButtonProps {
  product: ProductWithDetails;
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const availableVariants = useMemo(
    () =>
      product.variants?.filter(
        (variant) => variant.active !== false && Number(variant.stock ?? 0) > 0
      ) ?? [],
    [product.variants]
  );
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    availableVariants[0] || null
  );
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);
  const selectedStock = Number(selectedVariant?.stock ?? 0);
  const canAddToCart = !product.variants?.length || Boolean(selectedVariant);

  const handleAddToCart = () => {
    if (!canAddToCart) return;
    addItem(product, selectedVariant?.id ?? null, quantity);
  };

  const currentPrice = selectedVariant?.priceOverride || product.basePrice;
  const nextQuantity = product.variants?.length
    ? Math.min(quantity + 1, selectedStock)
    : quantity + 1;

  if (!product.variants || product.variants.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Label>Cantidad</Label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              -
            </Button>
            <span className="w-8 text-center">{quantity}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuantity(quantity + 1)}
            >
              +
            </Button>
          </div>
        </div>
      <Button
        className="w-full"
        size="lg"
        data-testid="add-to-cart-button"
        onClick={handleAddToCart}
      >
        Agregar al carrito - {formatPrice(Number(currentPrice) * quantity)}
      </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-2 block">Medida</Label>
        <RadioGroup
          value={selectedVariant?.id}
          onValueChange={(value) => {
            const variant = product.variants?.find((v) => v.id === value);
            setSelectedVariant(variant || null);
            setQuantity((current) =>
              variant ? Math.min(current, Number(variant.stock ?? 0)) : 1
            );
          }}
          className="grid grid-cols-2 gap-2"
        >
          {product.variants.map((variant) => {
            const variantStock = Number(variant.stock ?? 0);
            const isAvailable = variant.active !== false && variantStock > 0;

            return (
            <div key={variant.id}>
              <RadioGroupItem
                value={variant.id}
                id={variant.id}
                className="peer sr-only"
                disabled={!isAvailable}
              />
              <Label
                htmlFor={variant.id}
                className="flex cursor-pointer flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-45 peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary [&:has([data-state=checked])]:border-primary"
              >
                <span className="text-sm font-medium">
                  {variant.width} x {variant.length} cm
                </span>
                {variant.priceOverride && (
                  <span className="text-sm font-semibold">
                    {formatPrice(Number(variant.priceOverride))}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {isAvailable ? `Stock: ${variantStock}` : "Sin stock"}
                </span>
              </Label>
            </div>
            );
          })}
        </RadioGroup>
        {!availableVariants.length ? (
          <p className="mt-2 text-sm text-destructive">
            No hay medidas con stock disponible.
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-4">
        <Label>Cantidad</Label>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
          >
            -
          </Button>
          <span className="w-8 text-center">{quantity}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuantity(nextQuantity)}
            disabled={Boolean(product.variants?.length) && quantity >= selectedStock}
          >
            +
          </Button>
        </div>
      </div>

      <Button
        className="w-full"
        size="lg"
        data-testid="add-to-cart-button"
        onClick={handleAddToCart}
        disabled={!canAddToCart}
      >
        Agregar al carrito - {formatPrice(Number(currentPrice) * quantity)}
      </Button>
    </div>
  );
}
