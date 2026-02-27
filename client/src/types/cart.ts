export type CartStatus = 'active' | 'checking_out' | 'checked_out' | 'abandoned';

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  addedAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  minOrderAmount: number;
  maxUses: number;
  currentUses: number;
  expiresAt: string;
  isActive: boolean;
}

export interface Cart {
  id: string;
  customerId: string;
  status: CartStatus;
  currency: string;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  itemCount: number;
  coupon: Coupon | null;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}
