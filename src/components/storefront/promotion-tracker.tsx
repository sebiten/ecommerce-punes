"use client";

import { useEffect } from "react";
import { FACEBOOK_PROMOTION } from "@/lib/promotions";

export function PromotionTracker() {
  useEffect(() => {
    window.sessionStorage.setItem(
      FACEBOOK_PROMOTION.storageKey,
      FACEBOOK_PROMOTION.code
    );
  }, []);

  return null;
}
