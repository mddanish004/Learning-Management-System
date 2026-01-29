import { Router } from 'express';
import {
  createLesson,
  getLessons,
  getLessonById,
  updateLesson,
  deleteLesson,
  reorderLessons,
} from '../controllers/lesson.controller.js';
import { authenticateJWT, authorizeRole, validateCourseOwnership, ROLES } from '../middlewares/index.js';

const router = Router({ mergeParams: true });

router.get('/', getLessons);

router.post(
  '/',
  authenticateJWT,
  authorizeRole([ROLES.INSTRUCTOR, ROLES.ADMIN]),
  validateCourseOwnership('courseId'),
  createLesson
);

router.put(
  '/reorder',
  authenticateJWT,
  authorizeRole([ROLES.INSTRUCTOR, ROLES.ADMIN]),
  validateCourseOwnership('courseId'),
  reorderLessons
);

router.get('/:lessonId', getLessonById);

router.put(
  '/:lessonId',
  authenticateJWT,
  authorizeRole([ROLES.INSTRUCTOR, ROLES.ADMIN]),
  validateCourseOwnership('courseId'),
  updateLesson
);

router.delete(
  '/:lessonId',
  authenticateJWT,
  authorizeRole([ROLES.INSTRUCTOR, ROLES.ADMIN]),
  validateCourseOwnership('courseId'),
  deleteLesson
);

export default router;
