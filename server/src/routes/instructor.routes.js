import { Router } from 'express';
import {
  createCourse,
  deleteCourse,
  getInstructorCourses,
  updateCourse,
} from '../controllers/course.controller.js';
import {
  deleteInstructorCourseResource,
  generateInstructorCourseResourceDownloadUrl,
  generateInstructorResourceUploadUrl,
  getInstructorCourseAnalytics,
  getInstructorCourseEnrollments,
  listInstructorCourseResources,
} from '../controllers/instructor.controller.js';
import { authenticateJWT, authorizeRole, validateCourseOwnership, validateRequest, ROLES } from '../middlewares/index.js';
import { validationSchemas } from '../validators/schemas.js';

const router = Router();

router.use(authenticateJWT, authorizeRole([ROLES.INSTRUCTOR]));

router.get('/courses', validateRequest(validationSchemas.instructor.listCourses), getInstructorCourses);
router.post('/courses', validateRequest(validationSchemas.instructor.createCourse), createCourse);
router.put(
  '/courses/:id',
  validateRequest(validationSchemas.instructor.updateCourse),
  validateCourseOwnership('id'),
  updateCourse
);
router.delete(
  '/courses/:id',
  validateRequest(validationSchemas.instructor.courseIdParam),
  validateCourseOwnership('id'),
  deleteCourse
);
router.get(
  '/courses/:id/enrollments',
  validateRequest(validationSchemas.instructor.listEnrollments),
  validateCourseOwnership('id'),
  getInstructorCourseEnrollments
);
router.get(
  '/courses/:id/analytics',
  validateRequest(validationSchemas.instructor.courseIdParam),
  validateCourseOwnership('id'),
  getInstructorCourseAnalytics
);

router.get(
  '/courses/:id/resources',
  validateRequest(validationSchemas.instructor.listResources),
  validateCourseOwnership('id'),
  listInstructorCourseResources
);
router.post(
  '/courses/:id/resources/upload-url',
  validateRequest(validationSchemas.instructor.uploadResource),
  validateCourseOwnership('id'),
  generateInstructorResourceUploadUrl
);
router.get(
  '/courses/:id/resources/:resourceId/download',
  validateRequest(validationSchemas.instructor.courseResourceParams),
  validateCourseOwnership('id'),
  generateInstructorCourseResourceDownloadUrl
);
router.delete(
  '/courses/:id/resources/:resourceId',
  validateRequest(validationSchemas.instructor.courseResourceParams),
  validateCourseOwnership('id'),
  deleteInstructorCourseResource
);

export default router;
