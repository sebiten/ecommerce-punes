import { cache } from "react";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { FACEBOOK_PROMOTION } from "@/lib/promotions";

export const getFacebookPromotionAvailability = cache(async () => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("coupons")
    .select("active, expires_at, max_uses, used_count")
    .eq("code", FACEBOOK_PROMOTION.code)
    .maybeSingle();

  if (error || !data) {
    return { available: false, remainingUses: 0 };
  }

  const maxUses = Number(data.max_uses ?? FACEBOOK_PROMOTION.maxUses);
  const usedCount = Number(data.used_count ?? 0);
  const isExpired = data.expires_at
    ? new Date(data.expires_at) < new Date()
    : false;
  const remainingUses = Math.max(0, maxUses - usedCount);

  return {
    available: data.active !== false && !isExpired && remainingUses > 0,
    remainingUses,
  };
});
