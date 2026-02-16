import { Router } from 'express';
import { authenticateJWT } from '../middlewares/index.js';
import { listUserEnrollments } from '../controllers/enrollment.controller.js';

const router = Router();

router.get('/', authenticateJWT, listUserEnrollments);

export default router;
