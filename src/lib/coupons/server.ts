import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";

export class CouponValidationError extends Error {}

export async function calculateCouponDiscount(
  couponCode: string | undefined,
  subtotal: number
) {
  const normalizedCode = couponCode?.trim().toUpperCase();
  if (!normalizedCode) {
    return { code: null, discount: 0 };
  }

  const supabase = getSupabaseAdmin();
  const { data: coupon, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", normalizedCode)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!coupon) {
    throw new CouponValidationError("El cupón no es válido.");
  }

  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    throw new CouponValidationError("El cupón está vencido.");
  }

  if (
    coupon.max_uses &&
    Number(coupon.used_count || 0) >= Number(coupon.max_uses)
  ) {
    throw new CouponValidationError("El cupón ya no tiene usos disponibles.");
  }

  if (coupon.min_purchase && subtotal < Number(coupon.min_purchase)) {
    throw new CouponValidationError(
      "El subtotal no alcanza el mínimo requerido para este cupón."
    );
  }

  const rawDiscount =
    coupon.type === "percentage"
      ? subtotal * (Number(coupon.value) / 100)
      : Number(coupon.value);

  return {
    code: normalizedCode,
    discount: Math.min(subtotal, Math.max(0, rawDiscount)),
  };
}
