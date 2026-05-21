import { create } from "zustand";
import type { CartItem, ProductWithDetails } from "@/types";
import { getCartSubtotal } from "@/lib/commerce";

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: ProductWithDetails, variantId: string | null, quantity?: number) => void;
  removeItem: (productId: string, variantId?: string | null) => void;
  updateQuantity: (productId: string, variantId: string | null, quantity: number) => void;
  setItems: (items: CartItem[]) => void;
  clearCart: () => void;
  toggleCart: () => void;
  setIsOpen: (isOpen: boolean) => void;
  getTotal: () => number;
  getItemCount: () => number;
}

const initialState = {
  items: [] as CartItem[],
  isOpen: false,
};

export const useCartStore = create<CartStore>()((set, get) => ({
  ...initialState,

  addItem: (product: ProductWithDetails, variantId: string | null, quantity = 1) => {
    set((state) => {
      const existingIndex = state.items.findIndex(
        (item) =>
          item.product_id === product.id &&
          item.variant_id === (variantId || null)
      );

      if (existingIndex > -1) {
        const newItems = [...state.items];
        newItems[existingIndex].quantity += quantity;
        return { items: newItems };
      }

      return {
        items: [
          ...state.items,
          {
            product_id: product.id,
            variant_id: variantId || null,
            quantity,
            product,
          },
        ],
      };
    });
  },

  removeItem: (productId, variantId = null) => {
    set((state) => ({
      items: state.items.filter(
        (item) =>
          !(item.product_id === productId && item.variant_id === variantId)
      ),
    }));
  },

  updateQuantity: (productId, variantId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId, variantId);
      return;
    }

    set((state) => {
      const newItems = state.items.map((item) =>
        item.product_id === productId && item.variant_id === variantId
          ? { ...item, quantity }
          : item
      );
      return { items: newItems };
    });
  },

  setItems: (items) =>
    set({
      items: items.map((item) => ({
        ...item,
        variant_id: item.variant_id ?? null,
      })),
    }),

  clearCart: () => set({ items: [] }),

  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

  setIsOpen: (isOpen) => set({ isOpen }),

  getTotal: () => {
    const { items } = get();
    return getCartSubtotal(items);
  },

  getItemCount: () => {
    const { items } = get();
    return items.reduce((count, item) => count + item.quantity, 0);
  },
}));

if (typeof window !== "undefined") {
  const stored = localStorage.getItem("pune-cart");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.state?.items) {
        useCartStore.setState({ items: parsed.state.items }, false);
      }
    } catch (e) {
      console.error("Error loading cart from localStorage", e);
    }
  }

  useCartStore.subscribe((state) => {
    localStorage.setItem("pune-cart", JSON.stringify({ state: { items: state.items } }));
  });
}
