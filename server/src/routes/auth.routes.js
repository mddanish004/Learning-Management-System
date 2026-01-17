import { Router } from 'express';
import { register, registerInstructor, login, refresh, logout } from '../controllers/user.auth.js';

const router = Router();

router.post('/register', register);
router.post('/register/instructor', registerInstructor);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);

export default router;
