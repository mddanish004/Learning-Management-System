import { Router } from 'express';
import {
  createLesson,
  getLessons,
  getLessonById,
  updateLesson,
  deleteLesson,
  reorderLessons,
} from '../controllers/lesson.controller.js';
import {
  authenticateJWT,
  optionalAuth,
  authorizeRole,
  validateCourseOwnership,
  validateRequest,
  requireCourseEnrollment,
  ROLES,
} from '../middlewares/index.js';
import { validationSchemas } from '../validators/schemas.js';

const router = Router({ mergeParams: true });

router.get(
  '/',
  validateRequest(validationSchemas.lessons.courseParam),
  optionalAuth,
  getLessons
);

router.post(
  '/',
  validateRequest(validationSchemas.lessons.create),
  authenticateJWT,
  authorizeRole([ROLES.INSTRUCTOR, ROLES.ADMIN]),
  validateCourseOwnership('courseId'),
  createLesson
);

router.put(
  '/reorder',
  validateRequest(validationSchemas.lessons.reorder),
  authenticateJWT,
  authorizeRole([ROLES.INSTRUCTOR, ROLES.ADMIN]),
  validateCourseOwnership('courseId'),
  reorderLessons
);

router.get(
  '/:lessonId',
  validateRequest(validationSchemas.lessons.lessonParams),
  authenticateJWT,
  requireCourseEnrollment('courseId'),
  getLessonById
);

router.put(
  '/:lessonId',
  validateRequest(validationSchemas.lessons.update),
  authenticateJWT,
  authorizeRole([ROLES.INSTRUCTOR, ROLES.ADMIN]),
  validateCourseOwnership('courseId'),
  updateLesson
);

router.delete(
  '/:lessonId',
  validateRequest(validationSchemas.lessons.lessonParams),
  authenticateJWT,
  authorizeRole([ROLES.INSTRUCTOR, ROLES.ADMIN]),
  validateCourseOwnership('courseId'),
  deleteLesson
);

export default router;
