import { Router } from 'express';
import { login, register } from '../controllers/authController.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = Router();
router.post('/login', login);
router.post('/register', requireAuth, requireAdmin, register);
export default router;
