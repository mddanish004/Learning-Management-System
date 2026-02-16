import { Router } from 'express';
import { authenticateJWT, validateRequest } from '../middlewares/index.js';
import { listUserEnrollments } from '../controllers/enrollment.controller.js';
import { validationSchemas } from '../validators/schemas.js';

const router = Router();

router.get('/', validateRequest(validationSchemas.enrollments.list), authenticateJWT, listUserEnrollments);

export default router;
