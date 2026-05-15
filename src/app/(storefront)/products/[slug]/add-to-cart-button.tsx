"use client";

import { useState } from "react";
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
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants?.[0] || null
  );
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = () => {
    addItem(product, selectedVariant?.id ?? null, quantity);
  };

  const currentPrice = selectedVariant?.priceOverride || product.basePrice;

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
        <Button className="w-full" size="lg" onClick={handleAddToCart}>
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
          }}
          className="grid grid-cols-2 gap-2"
        >
          {product.variants.map((variant) => (
            <div key={variant.id}>
              <RadioGroupItem
                value={variant.id}
                id={variant.id}
                className="peer sr-only"
              />
              <Label
                htmlFor={variant.id}
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
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
                  Stock: {variant.stock}
                </span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

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

      <Button className="w-full" size="lg" onClick={handleAddToCart}>
        Agregar al carrito - {formatPrice(Number(currentPrice) * quantity)}
      </Button>
    </div>
  );
}