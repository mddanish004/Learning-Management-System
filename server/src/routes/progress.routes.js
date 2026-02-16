import { Router } from 'express';
import { markLessonComplete, getCourseProgress } from '../controllers/progress.controller.js';
import { authenticateJWT, requireCourseEnrollment, requireLessonEnrollment, validateRequest } from '../middlewares/index.js';
import { validationSchemas } from '../validators/schemas.js';

const router = Router();

router.post(
  '/lessons/:id/complete',
  validateRequest(validationSchemas.progress.lessonIdParam),
  authenticateJWT,
  requireLessonEnrollment('id'),
  markLessonComplete
);

router.get(
  '/progress/:courseId',
  validateRequest(validationSchemas.progress.courseIdParam),
  authenticateJWT,
  requireCourseEnrollment('courseId'),
  getCourseProgress
);

export default router;
