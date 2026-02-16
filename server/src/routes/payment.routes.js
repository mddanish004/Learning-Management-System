import express, { Router } from 'express';
import { authenticateJWT } from '../middlewares/index.js';
import { createDodoOrder, handleDodoWebhook } from '../controllers/payment.controller.js';

const router = Router();

router.post('/order', express.json(), authenticateJWT, createDodoOrder);
router.post('/webhook', express.raw({ type: 'application/json' }), handleDodoWebhook);

export default router;
