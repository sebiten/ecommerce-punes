export const dynamic = "force-dynamic";

import { CartContent } from "@/components/storefront/cart-content";

export default function CartPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Tu Carrito</h1>
      <CartContent />
    </div>
  );
}