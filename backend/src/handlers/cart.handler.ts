import type { Request, Response, NextFunction } from 'express';
import type { CartService } from '../services/cart.service';

export class CartHandler {
  constructor(private service: CartService) {}

  createCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { customerId, currency } = req.body;
      const cart = this.service.createCart(customerId, currency);
      res.status(201).json(cart);
    } catch (err) {
      next(err);
    }
  };

  addItemToCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id, items } = req.body;
      const cart = this.service.addItemToCart(id, items);
      res.status(200).json(cart);
    } catch (err) {
      next(err);
    }
  };

  removeItemFromCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id, cartItemId } = req.body;
      const cart = this.service.removeItemFromCart(id, cartItemId);
      res.status(200).json(cart);
    } catch (err) {
      next(err);
    }
  };

  updateItemQuantity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id, cartItemId, quantity } = req.body;
      const cart = this.service.updateItemQuantity(id, cartItemId, quantity);
      res.status(200).json(cart);
    } catch (err) {
      next(err);
    }
  };

  abandonCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.body;
      const cart = this.service.abandonCart(id);
      res.status(200).json(cart);
    } catch (err) {
      next(err);
    }
  };

  getCartById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cart = this.service.getCartById(String(req.params.id));
      res.status(200).json(cart);
    } catch (err) {
      next(err);
    }
  };

  getCartsByCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = String(req.query.customerId);
      const status = req.query.status ? String(req.query.status) : undefined;
      const carts = this.service.getCartsByCustomer(customerId, status);
      res.status(200).json(carts);
    } catch (err) {
      next(err);
    }
  };
}
