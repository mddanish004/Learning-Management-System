import { Router } from "express";
import { generateQuiz } from "../controllers/ai.controller.js";
import { authenticateJWT, rateLimitByUser, validateRequest } from "../middlewares/index.js";
import { validationSchemas } from '../validators/schemas.js';

const router = Router();

router.post(
  "/quiz",
  validateRequest(validationSchemas.ai.generateQuiz),
  authenticateJWT,
  rateLimitByUser({ windowMs: 60000, max: 10 }),
  generateQuiz
);

export default router;
