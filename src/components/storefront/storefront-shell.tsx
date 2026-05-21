"use client";

import { Header } from "@/components/storefront/header";
import { Footer } from "@/components/storefront/footer";
import { CartDrawer } from "@/components/storefront/cart-drawer";
import { CartContent } from "@/components/storefront/cart-content";
import { CartSync } from "@/components/storefront/cart-sync";
import { useCartStore } from "@/hooks/use-cart";
import type { StoreSettings } from "@/types";

interface StorefrontShellProps {
  children: React.ReactNode;
  settings: StoreSettings;
}

export function StorefrontShell({ children, settings }: StorefrontShellProps) {
  const { isOpen, setIsOpen } = useCartStore();

  return (
    <>
      <CartSync />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} />
      <CartDrawer isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <CartContent />
      </CartDrawer>
    </>
  );
}
