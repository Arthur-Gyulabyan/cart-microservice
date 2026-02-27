import type { Request, Response, NextFunction } from 'express';
import type { CartService } from '../services/cart.service';

export class CheckoutHandler {
  constructor(private service: CartService) {}

  validateCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.body;
      const cart = this.service.validateCart(id);
      res.status(200).json(cart);
    } catch (err) {
      next(err);
    }
  };

  initiateCheckout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.body;
      const cart = this.service.initiateCheckout(id);
      res.status(200).json(cart);
    } catch (err) {
      next(err);
    }
  };

  placeOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id, paymentMethodId } = req.body;
      const cart = this.service.placeOrder(id, paymentMethodId);
      res.status(200).json(cart);
    } catch (err) {
      next(err);
    }
  };

  triggerPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id, orderId, paymentMethodId } = req.body;
      const cart = this.service.triggerPayment(id, orderId, paymentMethodId);
      res.status(200).json(cart);
    } catch (err) {
      next(err);
    }
  };

  handleValidationFailure = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.body;
      const cart = this.service.handleValidationFailure(id);
      res.status(200).json(cart);
    } catch (err) {
      next(err);
    }
  };
}
