import { Router } from 'express';
import type { CouponHandler } from '../handlers/coupon.handler';

export function createCouponRoutes(handler: CouponHandler): Router {
  const router = Router();

  router.post('/apply-coupon', handler.applyCoupon);

  return router;
}
