import { Router } from 'express';
import type { CartHandler } from '../handlers/cart.handler';

export function createCartRoutes(handler: CartHandler): Router {
  const router = Router();

  // Commands (POST)
  router.post('/create-cart', handler.createCart);
  router.post('/add-item-to-cart', handler.addItemToCart);
  router.post('/remove-item-from-cart', handler.removeItemFromCart);
  router.post('/update-item-quantity', handler.updateItemQuantity);
  router.post('/abandon-cart', handler.abandonCart);

  // Queries (GET)
  router.get('/get-cart-by-id/:id', handler.getCartById);
  router.get('/get-all-carts', handler.getCartsByCustomer);

  return router;
}
