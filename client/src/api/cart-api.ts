import type { Cart } from '../types/cart';

const BASE = '/api/v1';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(body.error?.message ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

function post<T>(url: string, body: unknown): Promise<T> {
  return request<T>(url, { method: 'POST', body: JSON.stringify(body) });
}

export const cartApi = {
  // Queries
  getCartById: (id: string) => request<Cart>(`${BASE}/get-cart-by-id/${id}`),

  getAllCarts: (customerId: string, status?: string) => {
    const params = new URLSearchParams({ customerId });
    if (status) params.set('status', status);
    return request<Cart[]>(`${BASE}/get-all-carts?${params}`);
  },

  // Commands
  createCart: (customerId: string, currency: string) =>
    post<Cart>(`${BASE}/create-cart`, { customerId, currency }),

  addItemToCart: (id: string, items: { productId: string; productName: string; unitPrice: number; quantity: number }[]) =>
    post<Cart>(`${BASE}/add-item-to-cart`, { id, items }),

  removeItemFromCart: (id: string, cartItemId: string) =>
    post<Cart>(`${BASE}/remove-item-from-cart`, { id, cartItemId }),

  updateItemQuantity: (id: string, cartItemId: string, quantity: number) =>
    post<Cart>(`${BASE}/update-item-quantity`, { id, cartItemId, quantity }),

  applyCoupon: (id: string, couponCode: string) =>
    post<Cart>(`${BASE}/apply-coupon`, { id, couponCode }),

  validateCart: (id: string) =>
    post<Cart>(`${BASE}/validate-cart`, { id }),

  initiateCheckout: (id: string) =>
    post<Cart>(`${BASE}/initiate-checkout`, { id }),

  placeOrder: (id: string, paymentMethodId: string) =>
    post<Cart>(`${BASE}/place-order`, { id, paymentMethodId }),

  triggerPayment: (id: string, orderId: string, paymentMethodId: string) =>
    post<Cart>(`${BASE}/trigger-payment`, { id, orderId, paymentMethodId }),

  handleValidationFailure: (id: string) =>
    post<Cart>(`${BASE}/handle-validation-failure`, { id }),

  abandonCart: (id: string) =>
    post<Cart>(`${BASE}/abandon-cart`, { id }),
};
