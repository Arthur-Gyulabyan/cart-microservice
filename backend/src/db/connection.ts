import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { config } from '../config';

let db: Database.Database;

export function initDb(): Database.Database {
  const dbDir = path.dirname(config.dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(config.dbPath);

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      discount_type TEXT NOT NULL,
      discount_value INTEGER NOT NULL,
      min_order_amount INTEGER NOT NULL DEFAULT 0,
      max_uses INTEGER NOT NULL DEFAULT 0,
      current_uses INTEGER NOT NULL DEFAULT 0,
      expires_at TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS carts (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      currency TEXT NOT NULL DEFAULT 'USD',
      subtotal INTEGER NOT NULL DEFAULT 0,
      discount_amount INTEGER NOT NULL DEFAULT 0,
      total_amount INTEGER NOT NULL DEFAULT 0,
      item_count INTEGER NOT NULL DEFAULT 0,
      coupon_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (coupon_id) REFERENCES coupons(id)
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id TEXT PRIMARY KEY,
      cart_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      unit_price INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      subtotal INTEGER NOT NULL DEFAULT 0,
      added_at TEXT NOT NULL,
      FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_carts_customer_id ON carts(customer_id);
    CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
  `);

  seedCoupons(db);

  return db;
}

function seedCoupons(db: Database.Database): void {
  const count = db.prepare('SELECT COUNT(*) as count FROM coupons').get() as { count: number };
  if (count.count > 0) return;

  const insert = db.prepare(`
    INSERT INTO coupons (id, code, discount_type, discount_value, min_order_amount, max_uses, current_uses, expires_at, is_active)
    VALUES (@id, @code, @discountType, @discountValue, @minOrderAmount, @maxUses, @currentUses, @expiresAt, @isActive)
  `);

  const seedData = [
    {
      id: 'cpn_001',
      code: 'SAVE10',
      discountType: 'percentage',
      discountValue: 10,
      minOrderAmount: 5000,
      maxUses: 100,
      currentUses: 0,
      expiresAt: '2026-12-31T23:59:59Z',
      isActive: 1,
    },
    {
      id: 'cpn_002',
      code: 'WELCOME20',
      discountType: 'fixed_amount',
      discountValue: 2000,
      minOrderAmount: 0,
      maxUses: 1000,
      currentUses: 0,
      expiresAt: '2026-12-31T23:59:59Z',
      isActive: 1,
    },
    {
      id: 'cpn_003',
      code: 'SUMMER15',
      discountType: 'percentage',
      discountValue: 15,
      minOrderAmount: 10000,
      maxUses: 50,
      currentUses: 0,
      expiresAt: '2026-12-31T23:59:59Z',
      isActive: 1,
    },
  ];

  const insertMany = db.transaction((coupons: typeof seedData) => {
    for (const coupon of coupons) {
      insert.run(coupon);
    }
  });

  insertMany(seedData);
}

export function getDb(): Database.Database {
  return db;
}
