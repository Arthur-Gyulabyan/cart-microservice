import type Database from 'better-sqlite3';
import type { Coupon } from '../types/entities';

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

export class CouponRepository {
  constructor(private db: Database.Database) {}

  findByCode(code: string): Coupon | null {
    const row = this.db.prepare(
      'SELECT * FROM coupons WHERE code = @code'
    ).get({ code }) as CouponRow | undefined;

    if (!row) return null;
    return this.hydrate(row);
  }

  incrementUsage(id: string): void {
    this.db.prepare(
      'UPDATE coupons SET current_uses = current_uses + 1 WHERE id = @id'
    ).run({ id });
  }

  private hydrate(row: CouponRow): Coupon {
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
