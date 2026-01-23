import { Router } from 'express';
import { register, registerInstructor, registerAdmin, login, refresh, logout } from '../controllers/user.auth.js';
import { authenticateJWT } from '../middlewares/authenticateJWT.js';
import { authorizeRole, ROLES } from '../middlewares/authorizeRole.js';

const router = Router();

router.post('/register', register);
router.post('/register/instructor', registerInstructor);
router.post('/register/admin', authenticateJWT, authorizeRole([ROLES.ADMIN]), registerAdmin);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);

export default router;
