import { Router } from 'express';
import type { CheckoutHandler } from '../handlers/checkout.handler';

export function createCheckoutRoutes(handler: CheckoutHandler): Router {
  const router = Router();

  router.post('/validate-cart', handler.validateCart);
  router.post('/initiate-checkout', handler.initiateCheckout);
  router.post('/place-order', handler.placeOrder);
  router.post('/trigger-payment', handler.triggerPayment);
  router.post('/handle-validation-failure', handler.handleValidationFailure);

  return router;
}
