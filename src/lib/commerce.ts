import type { CartItem, ProductVariant } from "@/types";

export const STANDARD_SHIPPING_COST = 5000;
export const EXPRESS_SHIPPING_COST = 10000;
export const FREE_SHIPPING_THRESHOLD = 50000;

interface ShippingSettings {
  standardShippingCost?: number;
  expressShippingCost?: number;
  freeShippingThreshold?: number;
}

export function getVariantPrice(
  basePrice: number,
  variant?: Pick<ProductVariant, "priceOverride"> | null
) {
  return Number(variant?.priceOverride ?? basePrice);
}

export function getCartItemVariant(item: CartItem) {
  if (!item.variant_id || !item.product?.variants) {
    return null;
  }

  return item.product.variants.find((variant) => variant.id === item.variant_id) ?? null;
}

export function getCartItemUnitPrice(item: CartItem) {
  const basePrice = Number(item.product?.basePrice ?? 0);
  const variant = getCartItemVariant(item);
  return getVariantPrice(basePrice, variant);
}

export function getCartItemLineTotal(item: CartItem) {
  return getCartItemUnitPrice(item) * item.quantity;
}

export function getCartSubtotal(items: CartItem[]) {
  return items.reduce((total, item) => total + getCartItemLineTotal(item), 0);
}

export function getShippingCost(
  subtotal: number,
  shippingMethod: string,
  settings?: ShippingSettings
) {
  const standardShippingCost =
    settings?.standardShippingCost ?? STANDARD_SHIPPING_COST;
  const expressShippingCost =
    settings?.expressShippingCost ?? EXPRESS_SHIPPING_COST;
  const freeShippingThreshold =
    settings?.freeShippingThreshold ?? FREE_SHIPPING_THRESHOLD;

  if (shippingMethod === "express") {
    return expressShippingCost;
  }

  if (subtotal >= freeShippingThreshold) {
    return 0;
  }

  return standardShippingCost;
}
