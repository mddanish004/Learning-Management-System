import { Router } from 'express';
import { markLessonComplete, getCourseProgress } from '../controllers/progress.controller.js';
import { authenticateJWT, requireCourseEnrollment, requireLessonEnrollment } from '../middlewares/index.js';

const router = Router();

router.post('/lessons/:id/complete', authenticateJWT, requireLessonEnrollment('id'), markLessonComplete);

router.get('/progress/:courseId', authenticateJWT, requireCourseEnrollment('courseId'), getCourseProgress);

export default router;
