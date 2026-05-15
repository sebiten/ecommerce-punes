"use client";

import { Header } from "@/components/storefront/header";
import { Footer } from "@/components/storefront/footer";
import { CartDrawer } from "@/components/storefront/cart-drawer";
import { CartContent } from "@/components/storefront/cart-content";
import { useCartStore } from "@/hooks/use-cart";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isOpen, setIsOpen } = useCartStore();

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <CartContent />
      </CartDrawer>
    </>
  );
}