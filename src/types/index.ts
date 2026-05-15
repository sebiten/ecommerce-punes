export type Role = "client" | "admin";

export type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled";

export type CouponType = "percentage" | "fixed";

export interface Profile {
  id: string;
  clerk_user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: Role;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  basePrice: number;
  categoryId: string | null;
  featured: boolean;
  active: boolean;
  createdAt: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt: string | null;
  sort_order: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  width: number;
  length: number;
  priceOverride: number | null;
  stock: number;
  active: boolean;
}

export interface ProductWithDetails extends Product {
  category: Category | null;
  images: ProductImage[];
  variants: ProductVariant[];
}

export interface Address {
  id: string;
  profile_id: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string | null;
  is_default: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  profile_id: string | null;
  status: OrderStatus;
  total: number;
  shipping_cost: number;
  shipping_method: string | null;
  shipping_address: Address | null;
  mercadopago_id: string | null;
  mercadopago_status: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  unit_price: number;
}

export interface OrderItemWithProduct extends OrderItem {
  product: Product;
  variant: ProductVariant | null;
}

export interface OrderWithItems extends Order {
  items: OrderItemWithProduct[];
}

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  min_purchase: number | null;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  active: boolean;
  created_at: string;
}

export interface CartItem {
  id?: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  product?: ProductWithDetails;
}

export interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId?: string | null) => void;
  updateQuantity: (productId: string, variantId: string | null, quantity: number) => void;
  clearCart: () => void;
  total: number;
}