import { Router } from 'express';
import {
  deleteResource,
  generateResourceDownloadUrl,
  generateResourceUploadUrl,
} from '../controllers/resource.controller.js';
import { authenticateJWT, authorizeRole, validateRequest, ROLES } from '../middlewares/index.js';
import { validationSchemas } from '../validators/schemas.js';

const router = Router();

router.post(
  '/upload-url',
  validateRequest(validationSchemas.resources.upload),
  authenticateJWT,
  authorizeRole([ROLES.INSTRUCTOR, ROLES.ADMIN]),
  generateResourceUploadUrl
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
