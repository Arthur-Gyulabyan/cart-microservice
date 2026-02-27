import type Database from 'better-sqlite3';
import type { Cart, CartItem, CartStatus, Coupon } from '../types/entities';

interface CartRow {
  id: string;
  customer_id: string;
  status: string;
  currency: string;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  item_count: number;
  coupon_id: string | null;
  created_at: string;
  updated_at: string;
}

interface CartItemRow {
  id: string;
  cart_id: string;
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  added_at: string;
}

interface CouponRow {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_amount: number;
  max_uses: number;
  current_uses: number;
  expires_at: string;
  is_active: number;
}

export class CartRepository {
  constructor(private db: Database.Database) {}

  findById(id: string): Cart | null {
    const cartRow = this.db.prepare(
      'SELECT * FROM carts WHERE id = @id'
    ).get({ id }) as CartRow | undefined;

    if (!cartRow) return null;

    const itemRows = this.db.prepare(
      'SELECT * FROM cart_items WHERE cart_id = @cartId ORDER BY added_at'
    ).all({ cartId: id }) as CartItemRow[];

    let coupon: Coupon | null = null;
    if (cartRow.coupon_id) {
      const couponRow = this.db.prepare(
        'SELECT * FROM coupons WHERE id = @id'
      ).get({ id: cartRow.coupon_id }) as CouponRow | undefined;

      if (couponRow) {
        coupon = this.hydrateCoupon(couponRow);
      }
    }

    return this.hydrateCart(cartRow, itemRows, coupon);
  }

  findByCustomer(customerId: string, status?: string): Cart[] {
    let query = 'SELECT * FROM carts WHERE customer_id = @customerId';
    const params: Record<string, string> = { customerId };

    if (status) {
      query += ' AND status = @status';
      params.status = status;
    }

    query += ' ORDER BY created_at DESC';

    const cartRows = this.db.prepare(query).all(params) as CartRow[];
    if (cartRows.length === 0) return [];

    return cartRows.map((cartRow) => {
      const itemRows = this.db.prepare(
        'SELECT * FROM cart_items WHERE cart_id = @cartId ORDER BY added_at'
      ).all({ cartId: cartRow.id }) as CartItemRow[];

      let coupon: Coupon | null = null;
      if (cartRow.coupon_id) {
        const couponRow = this.db.prepare(
          'SELECT * FROM coupons WHERE id = @id'
        ).get({ id: cartRow.coupon_id }) as CouponRow | undefined;

        if (couponRow) {
          coupon = this.hydrateCoupon(couponRow);
        }
      }

      return this.hydrateCart(cartRow, itemRows, coupon);
    });
  }

  save(cart: Cart): void {
    const insertCart = this.db.prepare(`
      INSERT INTO carts (id, customer_id, status, currency, subtotal, discount_amount, total_amount, item_count, coupon_id, created_at, updated_at)
      VALUES (@id, @customerId, @status, @currency, @subtotal, @discountAmount, @totalAmount, @itemCount, @couponId, @createdAt, @updatedAt)
    `);

    const insertItem = this.db.prepare(`
      INSERT INTO cart_items (id, cart_id, product_id, product_name, unit_price, quantity, subtotal, added_at)
      VALUES (@id, @cartId, @productId, @productName, @unitPrice, @quantity, @subtotal, @addedAt)
    `);

    const transaction = this.db.transaction((cart: Cart) => {
      insertCart.run({
        id: cart.id,
        customerId: cart.customerId,
        status: cart.status,
        currency: cart.currency,
        subtotal: cart.subtotal,
        discountAmount: cart.discountAmount,
        totalAmount: cart.totalAmount,
        itemCount: cart.itemCount,
        couponId: cart.coupon?.id || null,
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt,
      });

      for (const item of cart.items) {
        insertItem.run({
          id: item.id,
          cartId: cart.id,
          productId: item.productId,
          productName: item.productName,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          subtotal: item.subtotal,
          addedAt: item.addedAt,
        });
      }
    });

    transaction(cart);
  }

  update(cart: Cart): void {
    const updateCart = this.db.prepare(`
      UPDATE carts
      SET customer_id = @customerId,
          status = @status,
          currency = @currency,
          subtotal = @subtotal,
          discount_amount = @discountAmount,
          total_amount = @totalAmount,
          item_count = @itemCount,
          coupon_id = @couponId,
          updated_at = @updatedAt
      WHERE id = @id
    `);

    const deleteItems = this.db.prepare(
      'DELETE FROM cart_items WHERE cart_id = @cartId'
    );

    const insertItem = this.db.prepare(`
      INSERT INTO cart_items (id, cart_id, product_id, product_name, unit_price, quantity, subtotal, added_at)
      VALUES (@id, @cartId, @productId, @productName, @unitPrice, @quantity, @subtotal, @addedAt)
    `);

    const transaction = this.db.transaction((cart: Cart) => {
      updateCart.run({
        id: cart.id,
        customerId: cart.customerId,
        status: cart.status,
        currency: cart.currency,
        subtotal: cart.subtotal,
        discountAmount: cart.discountAmount,
        totalAmount: cart.totalAmount,
        itemCount: cart.itemCount,
        couponId: cart.coupon?.id || null,
        updatedAt: cart.updatedAt,
      });

      deleteItems.run({ cartId: cart.id });

      for (const item of cart.items) {
        insertItem.run({
          id: item.id,
          cartId: cart.id,
          productId: item.productId,
          productName: item.productName,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          subtotal: item.subtotal,
          addedAt: item.addedAt,
        });
      }
    });

    transaction(cart);
  }

  private hydrateCart(row: CartRow, itemRows: CartItemRow[], coupon: Coupon | null): Cart {
    return {
      id: row.id,
      customerId: row.customer_id,
      status: row.status as CartStatus,
      currency: row.currency,
      subtotal: row.subtotal,
      discountAmount: row.discount_amount,
      totalAmount: row.total_amount,
      itemCount: row.item_count,
      coupon,
      items: itemRows.map((ir) => this.hydrateCartItem(ir)),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private hydrateCartItem(row: CartItemRow): CartItem {
    return {
      id: row.id,
      productId: row.product_id,
      productName: row.product_name,
      unitPrice: row.unit_price,
      quantity: row.quantity,
      subtotal: row.subtotal,
      addedAt: row.added_at,
    };
  }

  private hydrateCoupon(row: CouponRow): Coupon {
    return {
      id: row.id,
      code: row.code,
      discountType: row.discount_type as 'percentage' | 'fixed_amount',
      discountValue: row.discount_value,
      minOrderAmount: row.min_order_amount,
      maxUses: row.max_uses,
      currentUses: row.current_uses,
      expiresAt: row.expires_at,
      isActive: row.is_active === 1,
    };
  }
}
