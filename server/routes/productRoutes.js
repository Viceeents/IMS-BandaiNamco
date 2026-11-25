import { Router } from 'express';
import {
  adjustStock, createProduct, deleteProduct, getProduct, getStats, listProducts, updateProduct
} from '../controllers/productController.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);
router.get('/stats', getStats);
router.get('/', listProducts);
router.get('/:id', getProduct);
router.post('/', requireAdmin, createProduct);
router.put('/:id', requireAdmin, updateProduct);
router.patch('/:id/stock', adjustStock);
router.delete('/:id', requireAdmin, deleteProduct);
export default router;
