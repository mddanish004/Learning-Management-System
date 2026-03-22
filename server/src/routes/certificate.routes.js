import { Router } from 'express';
import { generateCertificate, generateCertificateDownloadUrl, getCertificateBycourse } from '../controllers/certificate.controller.js';
import { authenticateJWT, validateRequest } from '../middlewares/index.js';
import { validationSchemas } from '../validators/schemas.js';

const router = Router();

router.get(
  '/course/:courseId',
  validateRequest(validationSchemas.certificates.getByCourse),
  authenticateJWT,
  getCertificateBycourse
);
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
