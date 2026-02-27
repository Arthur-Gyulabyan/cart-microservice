import express from 'express';
import cors from 'cors';
import { config } from './config';
import { createCartRoutes } from './routes/cart.routes';
import { createCheckoutRoutes } from './routes/checkout.routes';
import { createCouponRoutes } from './routes/coupon.routes';
import { errorHandler } from './middleware/error';
import type { CartHandler } from './handlers/cart.handler';
import type { CheckoutHandler } from './handlers/checkout.handler';
import type { CouponHandler } from './handlers/coupon.handler';

interface RouteHandlers {
  cartHandler: CartHandler;
  checkoutHandler: CheckoutHandler;
  couponHandler: CouponHandler;
}

export function createApp(handlers: RouteHandlers): express.Application {
  const app = express();

  app.use(cors({ origin: config.corsOrigins }));
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/v1', createCartRoutes(handlers.cartHandler));
  app.use('/api/v1', createCheckoutRoutes(handlers.checkoutHandler));
  app.use('/api/v1', createCouponRoutes(handlers.couponHandler));

  app.use(errorHandler);

  return app;
}
