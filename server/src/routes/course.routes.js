import { Router } from 'express';
import {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  getInstructorCourses,
} from '../controllers/course.controller.js';
import { authenticateJWT, authorizeRole, validateCourseOwnership, ROLES } from '../middlewares/index.js';
import lessonRoutes from './lesson.routes.js';

const router = Router();

router.use('/:courseId/lessons', lessonRoutes);

router.get('/', getCourses);

router.get('/my-courses', authenticateJWT, authorizeRole([ROLES.INSTRUCTOR, ROLES.ADMIN]), getInstructorCourses);

router.get('/:id', getCourseById);

router.post(
  '/',
  authenticateJWT,
  authorizeRole([ROLES.INSTRUCTOR, ROLES.ADMIN]),
  createCourse
);

router.put(
  '/:id',
  authenticateJWT,
  authorizeRole([ROLES.INSTRUCTOR, ROLES.ADMIN]),
  validateCourseOwnership('id'),
  updateCourse
);

router.delete(
  '/:id',
  authenticateJWT,
  authorizeRole([ROLES.INSTRUCTOR, ROLES.ADMIN]),
  validateCourseOwnership('id'),
  deleteCourse
);

export default router;
