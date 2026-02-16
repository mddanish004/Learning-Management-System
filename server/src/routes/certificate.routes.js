import { Router } from 'express';
import { generateCertificate, generateCertificateDownloadUrl } from '../controllers/certificate.controller.js';
import { authenticateJWT } from '../middlewares/index.js';

const router = Router();

router.post('/generate/:courseId', authenticateJWT, generateCertificate);
router.get('/:id/download', authenticateJWT, generateCertificateDownloadUrl);

export default router;
