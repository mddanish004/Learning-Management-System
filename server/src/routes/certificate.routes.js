import { Router } from 'express';
import { generateCertificate, generateCertificateDownloadUrl } from '../controllers/certificate.controller.js';
import { authenticateJWT, validateRequest } from '../middlewares/index.js';
import { validationSchemas } from '../validators/schemas.js';

const router = Router();

router.post(
  '/generate/:courseId',
  validateRequest(validationSchemas.certificates.generate),
  authenticateJWT,
  generateCertificate
);
router.get(
  '/:id/download',
  validateRequest(validationSchemas.certificates.download),
  authenticateJWT,
  generateCertificateDownloadUrl
);

export default router;
