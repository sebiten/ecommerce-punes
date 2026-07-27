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
  whatsappPhone?: string | null;
  productUrl?: string;
}

function variantKey(variant: ProductVariant) {
  return `${variant.size.trim().toLocaleLowerCase("es-AR")}:${variant.color?.trim().toLocaleLowerCase("es-AR") ?? ""}`;
}

export function AddToCartButton({
  product,
  whatsappPhone,
  productUrl: providedProductUrl,
}: AddToCartButtonProps) {
  const variants = useMemo(() => {
    const unique = new Map<string, ProductVariant>();

    for (const variant of product.variants ?? []) {
      const key = variantKey(variant);
      const existing = unique.get(key);
      if (
        !existing ||
        (variant.active !== false &&
          Number(variant.stock) > Number(existing.stock))
      ) {
        unique.set(key, variant);
      }
    }

    return Array.from(unique.values()).sort((a, b) =>
      `${a.size}-${a.color ?? ""}`.localeCompare(
        `${b.size}-${b.color ?? ""}`,
        "es"
      )
    );
  }, [product.variants]);
  const availableVariants = variants.filter(
    (variant) => variant.active !== false && Number(variant.stock) > 0
  );
  const [selectedVariant, setSelectedVariant] =
    useState<ProductVariant | null>(availableVariants[0] || null);
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);
  const selectedStock = Number(selectedVariant?.stock ?? 0);
  const currentPrice = Number(
    selectedVariant?.priceOverride ?? product.basePrice
  );
  const canAddToCart = !variants.length || Boolean(selectedVariant);
  const selectedLabel = selectedVariant
    ? [
        `talle ${selectedVariant.size}`,
        selectedVariant.color ? `color ${selectedVariant.color}` : null,
      ]
        .filter(Boolean)
        .join(", ")
    : "sin variante";
  const productUrl =
    providedProductUrl ||
    (typeof window === "undefined"
      ? ""
      : `${window.location.origin}/products/${product.slug}`);
  const whatsappUrl = whatsappPhone
    ? `https://wa.me/${whatsappPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Hola, quiero consultar por ${product.name}, ${selectedLabel}. ${productUrl}`
      )}`
    : null;

  return (
    <div className="space-y-5">
      {variants.length ? (
        <div>
          <Label className="mb-3 block">Elegí talle y color</Label>
          <RadioGroup
            value={selectedVariant?.id}
            onValueChange={(value) => {
              const variant = variants.find((item) => item.id === value) || null;
              setSelectedVariant(variant);
              setQuantity((current) =>
                variant
                  ? Math.max(1, Math.min(current, Number(variant.stock)))
                  : 1
              );
            }}
            className="grid grid-cols-2 gap-2 sm:grid-cols-3"
          >
            {variants.map((variant) => {
              const stock = Number(variant.stock);
              const available = variant.active !== false && stock > 0;

              return (
                <div key={variant.id}>
                  <RadioGroupItem
                    value={variant.id}
                    id={variant.id}
                    className="peer sr-only"
                    disabled={!available}
                  />
                  <Label
                    htmlFor={variant.id}
                    className="flex min-h-20 cursor-pointer flex-col justify-center rounded-xl border bg-card px-3 py-3 text-center peer-disabled:cursor-not-allowed peer-disabled:opacity-45 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                  >
                    <span className="font-bold">{variant.size}</span>
                    {variant.color ? (
                      <span className="mt-1 text-xs text-muted-foreground">
                        {variant.color}
                      </span>
                    ) : null}
                    <span className="mt-1 text-xs text-muted-foreground">
                      {available ? `${stock} disponibles` : "Sin stock"}
                    </span>
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
          {!availableVariants.length ? (
            <p className="mt-2 text-sm text-destructive">
              No hay variantes con stock disponible.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-center gap-4">
        <Label>Cantidad</Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
            disabled={quantity <= 1}
          >
            -
          </Button>
          <span className="w-8 text-center">{quantity}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setQuantity((current) =>
                variants.length
                  ? Math.min(current + 1, selectedStock)
                  : current + 1
              )
            }
            disabled={variants.length > 0 && quantity >= selectedStock}
          >
            +
          </Button>
        </div>
      </div>

      <Button
        className="min-h-12 w-full"
        size="lg"
        data-testid="add-to-cart-button"
        onClick={() =>
          canAddToCart &&
          addItem(product, selectedVariant?.id ?? null, quantity)
        }
        disabled={!canAddToCart}
      >
        Agregar al carrito - {formatPrice(currentPrice * quantity)}
      </Button>

      {whatsappUrl ? (
        <Button variant="outline" className="min-h-11 w-full" asChild>
          <a href={whatsappUrl} target="_blank" rel="noreferrer">
            Consultar esta prenda por WhatsApp
          </a>
        </Button>
      ) : null}
    </div>
  );
}
