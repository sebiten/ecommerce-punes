"use client";

import { useEffect } from "react";
import { useCartStore } from "@/hooks/use-cart";

export function ClearCartOnMount() {
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return null;
}
