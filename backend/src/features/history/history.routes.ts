import { Router } from 'express';
import { getUserHistory, addHistoryEntry } from './history.controller.ts';
import { authenticateToken } from '../../core/middleware/auth.ts';

const router = Router();

router.get('/', authenticateToken, getUserHistory);
router.post('/', authenticateToken, addHistoryEntry);

export default router;
