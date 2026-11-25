import { Router } from 'express';
import { listLogs } from '../controllers/logController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);
router.get('/', listLogs);
export default router;
