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
import { authenticateJWT, authorizeRole, validateCourseOwnership, ROLES } from '../middlewares/index.js';

const router = Router();

router.use(authenticateJWT, authorizeRole([ROLES.INSTRUCTOR]));

router.get('/courses', getInstructorCourses);
router.post('/courses', createCourse);
router.put('/courses/:id', validateCourseOwnership('id'), updateCourse);
router.delete('/courses/:id', validateCourseOwnership('id'), deleteCourse);
router.get('/courses/:id/enrollments', validateCourseOwnership('id'), getInstructorCourseEnrollments);
router.get('/courses/:id/analytics', validateCourseOwnership('id'), getInstructorCourseAnalytics);

router.get('/courses/:id/resources', validateCourseOwnership('id'), listInstructorCourseResources);
router.post('/courses/:id/resources/upload-url', validateCourseOwnership('id'), generateInstructorResourceUploadUrl);
router.get(
  '/courses/:id/resources/:resourceId/download',
  validateCourseOwnership('id'),
  generateInstructorCourseResourceDownloadUrl
);
router.delete('/courses/:id/resources/:resourceId', validateCourseOwnership('id'), deleteInstructorCourseResource);

export default router;
