import { Router } from "express";
import { generateQuiz } from "../controllers/ai.controller.js";
import { authenticateJWT, rateLimitByUser } from "../middlewares/index.js";

const router = Router();

router.post(
  "/quiz",
  authenticateJWT,
  rateLimitByUser({ windowMs: 60000, max: 10 }),
  generateQuiz
);

export default router;
