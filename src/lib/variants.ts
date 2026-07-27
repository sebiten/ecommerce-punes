type VariantLabelInput = {
  size?: string | null;
  color?: string | null;
  sku?: string | null;
};

export function formatVariantLabel(
  variant: VariantLabelInput | null | undefined
) {
  if (!variant) return "Sin variante";

  const parts = [
    variant.size ? `Talle ${variant.size}` : null,
    variant.color ? variant.color : null,
    variant.sku ? `SKU ${variant.sku}` : null,
  ].filter(Boolean);

  return parts.length ? parts.join(" · ") : "Variante anterior";
}
