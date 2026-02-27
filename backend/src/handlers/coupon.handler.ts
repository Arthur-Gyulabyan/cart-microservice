import type { Request, Response, NextFunction } from 'express';
import type { CartService } from '../services/cart.service';

export class CouponHandler {
  constructor(private service: CartService) {}

  applyCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id, couponCode } = req.body;
      const cart = this.service.applyCoupon(id, couponCode);
      res.status(200).json(cart);
    } catch (err) {
      next(err);
    }
  };
}
