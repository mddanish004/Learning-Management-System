import { Router } from 'express';
import { register, registerInstructor, registerAdmin, login, refresh, logout } from '../controllers/user.auth.js';
import { authenticateJWT, authorizeRole, ROLES, validateRequest } from '../middlewares/index.js';
import { validationSchemas } from '../validators/schemas.js';

const router = Router();

router.post('/register', validateRequest(validationSchemas.auth.register), register);
router.post('/register/instructor', validateRequest(validationSchemas.auth.registerInstructor), registerInstructor);
router.post(
  '/register/admin',
  validateRequest(validationSchemas.auth.registerAdmin),
  authenticateJWT,
  authorizeRole([ROLES.ADMIN]),
  registerAdmin
);
router.post('/login', validateRequest(validationSchemas.auth.login), login);
router.post('/refresh', validateRequest(validationSchemas.auth.refresh), refresh);
router.post('/logout', validateRequest(validationSchemas.auth.logout), logout);

export default router;
