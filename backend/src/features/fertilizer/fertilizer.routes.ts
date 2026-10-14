import { Router } from 'express';
import { recommendFertilizer, getFertilizerHistoryList } from './fertilizer.controller.ts';
import { authenticateToken } from '../../core/middleware/auth.ts';

const router = Router();

router.post('/recommend', authenticateToken, recommendFertilizer);
router.get('/history', authenticateToken, getFertilizerHistoryList);

export default router;
