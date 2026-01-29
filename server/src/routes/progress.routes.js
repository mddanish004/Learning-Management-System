import { Router } from 'express';
import { markLessonComplete, getCourseProgress } from '../controllers/progress.controller.js';
import { authenticateJWT } from '../middlewares/index.js';

const router = Router();

router.post('/lessons/:id/complete', authenticateJWT, markLessonComplete);

router.get('/progress/:courseId', authenticateJWT, getCourseProgress);

export default router;
