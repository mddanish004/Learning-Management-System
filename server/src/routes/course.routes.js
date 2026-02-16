import { Router } from 'express';
import {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  getInstructorCourses,
} from '../controllers/course.controller.js';
import {
  enrollInFreeCourse,
  listCourseEnrollments,
} from '../controllers/enrollment.controller.js';
import { authenticateJWT, authorizeRole, validateCourseOwnership, validateRequest, ROLES } from '../middlewares/index.js';
import lessonRoutes from './lesson.routes.js';
import { validationSchemas } from '../validators/schemas.js';

const router = Router();

router.use('/:courseId/lessons', lessonRoutes);

router.get('/', validateRequest(validationSchemas.courses.list), getCourses);

router.get(
  '/my-courses',
  validateRequest(validationSchemas.courses.listInstructorCourses),
  authenticateJWT,
  authorizeRole([ROLES.INSTRUCTOR, ROLES.ADMIN]),
  getInstructorCourses
);

router.post(
  '/:id/enroll',
  validateRequest(validationSchemas.courses.enroll),
  authenticateJWT,
  enrollInFreeCourse
);

router.get(
  '/:id/enrollments',
  validateRequest(validationSchemas.courses.enrollments),
  authenticateJWT,
  authorizeRole([ROLES.INSTRUCTOR, ROLES.ADMIN]),
  validateCourseOwnership('id'),
  listCourseEnrollments
);

router.get('/:id', validateRequest(validationSchemas.courses.idParam), getCourseById);

router.post(
  '/',
  validateRequest(validationSchemas.courses.create),
  authenticateJWT,
  authorizeRole([ROLES.INSTRUCTOR, ROLES.ADMIN]),
  createCourse
);

router.put(
  '/:id',
  validateRequest(validationSchemas.courses.update),
  authenticateJWT,
  authorizeRole([ROLES.INSTRUCTOR, ROLES.ADMIN]),
  validateCourseOwnership('id'),
  updateCourse
);

router.delete(
  '/:id',
  validateRequest(validationSchemas.courses.idParam),
  authenticateJWT,
  authorizeRole([ROLES.INSTRUCTOR, ROLES.ADMIN]),
  validateCourseOwnership('id'),
  deleteCourse
);

export default router;
