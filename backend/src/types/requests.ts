export interface CreateCartRequest {
  customerId: string;
  currency: string;
}

export interface AddItemRequest {
  id: string;
  items: {
    productId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
  }[];
}

export interface RemoveItemRequest {
  id: string;
  cartItemId: string;
}

export interface UpdateQuantityRequest {
  id: string;
  cartItemId: string;
  quantity: number;
}

export interface ApplyCouponRequest {
  id: string;
  couponCode: string;
}

export interface PlaceOrderRequest {
  id: string;
  paymentMethodId: string;
}

export interface TriggerPaymentRequest {
  id: string;
  orderId: string;
  paymentMethodId: string;
}
