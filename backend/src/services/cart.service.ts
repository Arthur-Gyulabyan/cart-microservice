import crypto from 'crypto';
import type { Cart, CartItem, Coupon } from '../types/entities';
import type {
  CreateCartRequest,
  AddItemRequest,
  RemoveItemRequest,
  UpdateQuantityRequest,
  ApplyCouponRequest,
  PlaceOrderRequest,
  TriggerPaymentRequest,
} from '../types/requests';
import { NotFoundError, ValidationError, BusinessRuleError } from '../types/errors';
import { CartRepository } from '../repositories/cart.repository';
import { CouponRepository } from '../repositories/coupon.repository';

export class CartService {
  constructor(
    private cartRepo: CartRepository,
    private couponRepo: CouponRepository
  ) {}

  createCart(customerId: string, currency: string): Cart {
    if (!customerId) throw new ValidationError('customerId is required');
    if (!currency) throw new ValidationError('currency is required');

    const now = new Date().toISOString();
    const cart: Cart = {
      id: crypto.randomUUID(),
      customerId,
      status: 'active',
      currency,
      subtotal: 0,
      discountAmount: 0,
      totalAmount: 0,
      itemCount: 0,
      coupon: null,
      items: [],
      createdAt: now,
      updatedAt: now,
    };

    this.cartRepo.save(cart);
    return cart;
  }

  addItemToCart(id: string, items: AddItemRequest['items']): Cart {
    const cart = this.getActiveCart(id);

    if (!items || items.length === 0) {
      throw new ValidationError('At least one item is required');
    }

    for (const item of items) {
      if (!item.productId) throw new ValidationError('productId is required for each item');
      if (!item.productName) throw new ValidationError('productName is required for each item');
      if (item.unitPrice == null || item.unitPrice < 0) throw new ValidationError('unitPrice must be >= 0');
      if (!item.quantity || item.quantity <= 0) throw new ValidationError('quantity must be greater than 0');

      const existing = cart.items.find((ci) => ci.productId === item.productId);
      if (existing) {
        existing.quantity += item.quantity;
        existing.subtotal = existing.unitPrice * existing.quantity;
      } else {
        const cartItem: CartItem = {
          id: crypto.randomUUID(),
          productId: item.productId,
          productName: item.productName,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          subtotal: item.unitPrice * item.quantity,
          addedAt: new Date().toISOString(),
        };
        cart.items.push(cartItem);
      }
    }

    this.recalculate(cart);
    cart.updatedAt = new Date().toISOString();
    this.cartRepo.update(cart);
    return cart;
  }

  removeItemFromCart(id: string, cartItemId: string): Cart {
    const cart = this.getActiveCart(id);

    if (!cartItemId) throw new ValidationError('cartItemId is required');

    const itemIndex = cart.items.findIndex((ci) => ci.id === cartItemId);
    if (itemIndex === -1) {
      throw new NotFoundError('CartItem', cartItemId);
    }

    cart.items.splice(itemIndex, 1);
    this.recalculate(cart);
    cart.updatedAt = new Date().toISOString();
    this.cartRepo.update(cart);
    return cart;
  }

  updateItemQuantity(id: string, cartItemId: string, quantity: number): Cart {
    const cart = this.getActiveCart(id);

    if (!cartItemId) throw new ValidationError('cartItemId is required');
    if (quantity == null || quantity < 1) throw new ValidationError('quantity must be >= 1');

    const item = cart.items.find((ci) => ci.id === cartItemId);
    if (!item) {
      throw new NotFoundError('CartItem', cartItemId);
    }

    item.quantity = quantity;
    item.subtotal = item.unitPrice * item.quantity;
    this.recalculate(cart);
    cart.updatedAt = new Date().toISOString();
    this.cartRepo.update(cart);
    return cart;
  }

  applyCoupon(id: string, couponCode: string): Cart {
    const cart = this.getActiveCart(id);

    if (!couponCode) throw new ValidationError('couponCode is required');

    const coupon = this.couponRepo.findByCode(couponCode);
    if (!coupon) {
      throw new NotFoundError('Coupon', couponCode);
    }

    if (!coupon.isActive) {
      throw new BusinessRuleError('Coupon is not active');
    }

    const now = new Date();
    if (new Date(coupon.expiresAt) < now) {
      throw new BusinessRuleError('Coupon has expired');
    }

    if (coupon.maxUses > 0 && coupon.currentUses >= coupon.maxUses) {
      throw new BusinessRuleError('Coupon usage limit has been reached');
    }

    if (coupon.minOrderAmount > 0 && cart.subtotal < coupon.minOrderAmount) {
      throw new BusinessRuleError(
        `Minimum order amount of ${coupon.minOrderAmount} not met. Current subtotal: ${cart.subtotal}`
      );
    }

    cart.coupon = coupon;
    this.recalculate(cart);
    cart.updatedAt = new Date().toISOString();
    this.cartRepo.update(cart);
    return cart;
  }

  validateCart(id: string): Cart {
    const cart = this.getCartById(id);

    if (cart.items.length === 0) {
      throw new BusinessRuleError('Cart must have at least one item to validate');
    }

    return cart;
  }

  initiateCheckout(id: string): Cart {
    const cart = this.getActiveCart(id);

    if (cart.items.length === 0) {
      throw new BusinessRuleError('Cart must have at least one item to checkout');
    }

    cart.status = 'checking_out';
    cart.updatedAt = new Date().toISOString();
    this.cartRepo.update(cart);
    return cart;
  }

  placeOrder(id: string, paymentMethodId: string): Cart {
    const cart = this.getCartById(id);

    if (!paymentMethodId) throw new ValidationError('paymentMethodId is required');

    if (cart.status !== 'checking_out') {
      throw new BusinessRuleError('Cart must be in checking_out status to place an order');
    }

    if (cart.coupon) {
      this.couponRepo.incrementUsage(cart.coupon.id);
    }

    cart.status = 'checked_out';
    cart.updatedAt = new Date().toISOString();
    this.cartRepo.update(cart);
    return cart;
  }

  triggerPayment(id: string, orderId: string, paymentMethodId: string): Cart {
    const cart = this.getCartById(id);

    if (!orderId) throw new ValidationError('orderId is required');
    if (!paymentMethodId) throw new ValidationError('paymentMethodId is required');

    if (cart.status !== 'checked_out') {
      throw new BusinessRuleError('Cart must be in checked_out status to trigger payment');
    }

    return cart;
  }

  handleValidationFailure(id: string): Cart {
    const cart = this.getCartById(id);

    cart.status = 'active';
    cart.updatedAt = new Date().toISOString();
    this.cartRepo.update(cart);
    return cart;
  }

  abandonCart(id: string): Cart {
    const cart = this.getCartById(id);

    if (cart.status === 'checked_out') {
      throw new BusinessRuleError('Cannot abandon a cart that has already been checked out');
    }

    cart.status = 'abandoned';
    cart.updatedAt = new Date().toISOString();
    this.cartRepo.update(cart);
    return cart;
  }

  getCartById(id: string): Cart {
    const cart = this.cartRepo.findById(id);
    if (!cart) throw new NotFoundError('Cart', id);
    return cart;
  }

  getCartsByCustomer(customerId: string, status?: string): Cart[] {
    if (!customerId) throw new ValidationError('customerId is required');
    return this.cartRepo.findByCustomer(customerId, status);
  }

  private getActiveCart(id: string): Cart {
    const cart = this.getCartById(id);
    if (cart.status !== 'active') {
      throw new BusinessRuleError(`Cart is not active. Current status: ${cart.status}`);
    }
    return cart;
  }

  private recalculate(cart: Cart): void {
    cart.subtotal = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
    cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    cart.discountAmount = 0;
    if (cart.coupon) {
      if (cart.coupon.discountType === 'percentage') {
        cart.discountAmount = Math.round(cart.subtotal * (cart.coupon.discountValue / 100));
      } else if (cart.coupon.discountType === 'fixed_amount') {
        cart.discountAmount = Math.min(cart.coupon.discountValue, cart.subtotal);
      }
    }

    cart.totalAmount = cart.subtotal - cart.discountAmount;
  }
}
