import express, { Router } from 'express';
import { authenticateJWT, validateRequest } from '../middlewares/index.js';
import { createDodoOrder, handleDodoWebhook } from '../controllers/payment.controller.js';
import { validationSchemas } from '../validators/schemas.js';

const router = Router();

router.post(
  '/order',
  express.json(),
  validateRequest(validationSchemas.payments.createOrder),
  authenticateJWT,
  createDodoOrder
);
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  validateRequest(validationSchemas.payments.webhook),
  handleDodoWebhook
);

export default router;
