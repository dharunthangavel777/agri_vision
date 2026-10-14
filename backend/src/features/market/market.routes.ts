import { Router } from 'express';
import { getMarketPrices } from './market.controller.ts';

const router = Router();

router.get('/', getMarketPrices);

export default router;
