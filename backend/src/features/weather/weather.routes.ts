import { Router } from 'express';
import { getWeather } from './weather.controller.ts';

const router = Router();

router.get('/:city', getWeather);

export default router;
