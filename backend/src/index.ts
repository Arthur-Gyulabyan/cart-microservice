import { config } from './config';
import { initDb } from './db/connection';
import { CartRepository } from './repositories/cart.repository';
import { CouponRepository } from './repositories/coupon.repository';
import { CartService } from './services/cart.service';
import { CartHandler } from './handlers/cart.handler';
import { CheckoutHandler } from './handlers/checkout.handler';
import { CouponHandler } from './handlers/coupon.handler';
import { createApp } from './app';

const db = initDb();

const cartRepo = new CartRepository(db);
const couponRepo = new CouponRepository(db);

const service = new CartService(cartRepo, couponRepo);

const cartHandler = new CartHandler(service);
const checkoutHandler = new CheckoutHandler(service);
const couponHandler = new CouponHandler(service);

const app = createApp({ cartHandler, checkoutHandler, couponHandler });

app.listen(config.port, () => {
  console.log(`Cart microservice running on http://localhost:${config.port}`);
  console.log(`Health check: http://localhost:${config.port}/health`);
});
