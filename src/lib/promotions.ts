export const FACEBOOK_PROMOTION = {
  code: "UNIFORMES26",
  discountAmount: 3000,
  maxUses: 10,
  storageKey: "pilcheria-promo-code",
} as const;

export function isFacebookPromotion(code: string | null | undefined) {
  return code?.trim().toUpperCase() === FACEBOOK_PROMOTION.code;
}
