"use client";

import * as React from "react";
import { Header } from "@/components/storefront/header";
import { CartDrawer } from "@/components/storefront/cart-drawer";
import { CartContent } from "@/components/storefront/cart-content";
import { CartSync } from "@/components/storefront/cart-sync";
import { hydrateCartStore, subscribeCartStorePersistence, useCartStore } from "@/hooks/use-cart";

interface StorefrontClientShellProps {
  children: React.ReactNode;
}

export function StorefrontClientShell({ children }: StorefrontClientShellProps) {
  const isOpen = useCartStore((state) => state.isOpen);
  const setIsOpen = useCartStore((state) => state.setIsOpen);

  React.useEffect(() => {
    hydrateCartStore();
    return subscribeCartStorePersistence();
  }, []);

  return (
    <>
      <CartSync />
      <Header />
      <main className="flex-1">{children}</main>
      <CartDrawer isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <CartContent />
      </CartDrawer>
    </>
  );
}
