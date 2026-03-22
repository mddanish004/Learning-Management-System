import { Router } from 'express';
import {
  confirmResourceUpload,
  deleteResource,
  generateResourceDownloadUrl,
  generateResourceUploadUrl,
  listCourseResources,
} from '../controllers/resource.controller.js';
import { authenticateJWT, authorizeRole, validateRequest, ROLES } from '../middlewares/index.js';
import { validationSchemas } from '../validators/schemas.js';

const router = Router();

router.get(
  '/course/:courseId',
  validateRequest(validationSchemas.resources.courseIdParam),
  authenticateJWT,
  listCourseResources
);

router.post(
  '/upload-url',
  validateRequest(validationSchemas.resources.upload),
  authenticateJWT,
  authorizeRole([ROLES.INSTRUCTOR, ROLES.ADMIN]),
  generateResourceUploadUrl
);

router.post(
  '/confirm',
  validateRequest(validationSchemas.resources.confirm),
  authenticateJWT,
  authorizeRole([ROLES.INSTRUCTOR, ROLES.ADMIN]),
  confirmResourceUpload
);

router.get(
  '/:id/download',
  validateRequest(validationSchemas.resources.idParam),
  authenticateJWT,
  generateResourceDownloadUrl
);

router.delete(
  '/:id',
  validateRequest(validationSchemas.resources.idParam),
  authenticateJWT,
  authorizeRole([ROLES.INSTRUCTOR, ROLES.ADMIN]),
  deleteResource
);

export default router;
