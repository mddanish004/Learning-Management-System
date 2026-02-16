import { Router } from 'express';
import {
  deleteResource,
  generateResourceDownloadUrl,
  generateResourceUploadUrl,
} from '../controllers/resource.controller.js';
import { authenticateJWT, authorizeRole, ROLES } from '../middlewares/index.js';

const router = Router();

router.post(
  '/upload-url',
  authenticateJWT,
  authorizeRole([ROLES.INSTRUCTOR, ROLES.ADMIN]),
  generateResourceUploadUrl
);

router.get('/:id/download', authenticateJWT, generateResourceDownloadUrl);

router.delete(
  '/:id',
  authenticateJWT,
  authorizeRole([ROLES.INSTRUCTOR, ROLES.ADMIN]),
  deleteResource
);

export default router;
