import { Router } from "express";
import { generateQuiz, saveQuiz, getSavedQuiz } from "../controllers/ai.controller.js";
import { authenticateJWT, authorizeRole, ROLES, rateLimitByUser, validateRequest } from "../middlewares/index.js";
import { validationSchemas } from '../validators/schemas.js';

const router = Router();

router.post(
  "/quiz",
  validateRequest(validationSchemas.ai.generateQuiz),
  authenticateJWT,
  authorizeRole([ROLES.INSTRUCTOR, ROLES.ADMIN]),
  rateLimitByUser({ windowMs: 60000, max: 10 }),
  generateQuiz
);

router.post(
  "/quiz/save",
  validateRequest(validationSchemas.ai.saveQuiz),
  authenticateJWT,
  authorizeRole([ROLES.INSTRUCTOR, ROLES.ADMIN]),
  saveQuiz
);

router.get(
  "/quiz/:courseId",
  validateRequest(validationSchemas.ai.getSavedQuiz),
  authenticateJWT,
  getSavedQuiz
);

export default router;
