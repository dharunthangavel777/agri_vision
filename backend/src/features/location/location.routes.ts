import { Router } from 'express';
import { reverseGeocode, searchLocations, ipLocation } from './location.controller.ts';

const router = Router();

router.get('/reverse', reverseGeocode);
router.get('/search', searchLocations);
router.get('/ip', ipLocation);

export default router;
