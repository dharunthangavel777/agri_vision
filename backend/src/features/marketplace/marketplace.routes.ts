import { Router } from 'express';
import {
  createProduct,
  getProductsList,
  getProductById,
  getUserProducts,
  updateProduct,
  deleteProduct,
  updateInventory,
} from './marketplace.controller.ts';
import { authenticateToken } from '../../core/middleware/auth.ts';
import { upload } from '../../core/middleware/upload.ts';

const router = Router();

router.post('/', authenticateToken, upload.single('image'), createProduct);
router.get('/', getProductsList);
router.get('/:id', getProductById);
router.get('/user/:userId', getUserProducts);
router.put('/:id', authenticateToken, upload.single('image'), updateProduct);
router.delete('/:id', authenticateToken, deleteProduct);
router.patch('/:id/inventory', authenticateToken, updateInventory);

export default router;
