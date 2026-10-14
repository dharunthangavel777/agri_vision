import { Router } from 'express';
import {
  register,
  login,
  changePassword,
  resetPasswordRequest,
  resetPasswordConfirm,
  sendOtp,
  verifyOtp,
  getProfile,
  updateProfile,
} from './auth.controller.ts';
import { authLimiter } from '../../core/middleware/rateLimit.ts';
import { authenticateToken } from '../../core/middleware/auth.ts';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/change-password', authenticateToken, changePassword);
router.post('/reset-password-request', authLimiter, resetPasswordRequest);
router.post('/reset-password-confirm', resetPasswordConfirm);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.get('/profile', authenticateToken, getProfile);
router.post('/update-profile', authenticateToken, updateProfile);

export default router;
