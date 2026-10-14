import { Router } from 'express';
import { handleChat, handleChatImage } from './chat.controller.ts';
import { upload } from '../../core/middleware/upload.ts';

const router = Router();

router.post('/', handleChat);
router.post('/image', upload.single('image'), handleChatImage);

export default router;
