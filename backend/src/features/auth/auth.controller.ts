import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { JWT_SECRET } from '../../core/config.ts';
import { getUsers, saveUsers } from '../../core/db.ts';
import { AuthenticatedRequest } from '../../core/middleware/auth.ts';

// In-memory OTP store (identifier -> { hashedOtp, expiresAt, attempts })
const otpStore = new Map<string, { hashedOtp: string; expiresAt: number; attempts: number }>();

export const register = async (req: Request, res: Response) => {
  try {
    const { identifier, password, type, name, location, farmType } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ status: 'error', error: 'Email and password are required' });
    }

    const users = getUsers();
    if (users[identifier] && users[identifier].password) {
      return res.status(400).json({ status: 'error', error: 'An account already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const existing = users[identifier] || {};
    const user = {
      ...existing,
      id: existing.id || crypto.randomUUID(),
      identifier,
      password: hashedPassword,
      type: type || existing.type || 'email',
      name: name || existing.name || identifier.split('@')[0],
      location: location || existing.location || '',
      farmType: farmType || existing.farmType || 'Vegetable',
      role: existing.role || 'farmer',
      createdAt: existing.createdAt || new Date().toISOString()
    };

    users[identifier] = user;
    saveUsers(users);

    const token = jwt.sign(
      { userId: user.id, identifier: user.identifier, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({ status: 'ok', user: userWithoutPassword, token, isNewUser: !existing.id });
  } catch (error) {
    console.error('[API] Register error:', error);
    res.status(500).json({ status: 'error', error: 'Registration failed due to server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ status: 'error', error: 'Email and password are required' });
    }

    const users = getUsers();
    const user = users[identifier];

    if (!user) {
      return res.status(401).json({ status: 'error', error: 'No account found with this email. Please sign up.' });
    }

    if (!user.password) {
      return res.status(401).json({ status: 'error', error: 'Please sign in with Google or reset your password.' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ status: 'error', error: 'Invalid password. Please try again.' });
    }

    const token = jwt.sign(
      { userId: user.id, identifier: user.identifier, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = user;
    res.json({ status: 'ok', user: userWithoutPassword, token, isNewUser: false });
  } catch (error) {
    console.error('[API] Login error:', error);
    res.status(500).json({ status: 'error', error: 'Login failed due to server error' });
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ status: 'error', error: 'Old and new passwords are required' });
    }

    const users = getUsers();
    const user = Object.values(users).find((u: any) => u.id === req.user.userId) as any;

    if (!user || !user.password) {
      return res.status(404).json({ status: 'error', error: 'User not found' });
    }

    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ status: 'error', error: 'Invalid old password' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    users[user.identifier] = user;
    saveUsers(users);

    res.json({ status: 'ok', message: 'Password changed successfully' });
  } catch (error) {
    console.error('[API] Change password error:', error);
    res.json({ status: 'ok', fallback: true, message: 'Failed to change password' });
  }
};

export const resetPasswordRequest = async (req: Request, res: Response) => {
  try {
    const { identifier } = req.body;
    if (!identifier) return res.status(400).json({ status: 'error', error: 'Identifier is required' });

    const users = getUsers();
    if (!users[identifier]) {
      return res.status(404).json({ status: 'error', error: 'User not found' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    otpStore.set(identifier, { hashedOtp, expiresAt, attempts: 0 });

    console.log(`[AUTH] Password Reset OTP for ${identifier}: ${otp}`);
    res.json({ status: 'ok', message: 'Reset OTP sent successfully', expiresAt });
  } catch (error) {
    console.error('[API] Reset password request error:', error);
    res.json({ status: 'ok', fallback: true, message: 'Failed to send reset OTP' });
  }
};

export const resetPasswordConfirm = async (req: Request, res: Response) => {
  try {
    const { identifier, otp, newPassword } = req.body;
    if (!identifier || !otp || !newPassword) {
      return res.status(400).json({ status: 'error', error: 'Identifier, OTP and new password are required' });
    }

    const storedData = otpStore.get(identifier);
    if (!storedData) return res.status(400).json({ status: 'error', error: 'OTP not found or expired' });

    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(identifier);
      return res.status(400).json({ status: 'error', error: 'OTP expired' });
    }

    const isValid = await bcrypt.compare(otp, storedData.hashedOtp);
    if (!isValid) {
      storedData.attempts += 1;
      if (storedData.attempts >= 5) {
        otpStore.delete(identifier);
        return res.status(400).json({ status: 'error', error: 'Too many attempts. Please request a new OTP.' });
      }
      return res.status(400).json({ status: 'error', error: 'Invalid OTP' });
    }

    otpStore.delete(identifier);

    const users = getUsers();
    const user = users[identifier];
    if (!user) return res.status(404).json({ status: 'error', error: 'User not found' });

    user.password = await bcrypt.hash(newPassword, 10);
    saveUsers(users);

    res.json({ status: 'ok', message: 'Password reset successfully' });
  } catch (error) {
    console.error('[API] Reset password confirm error:', error);
    res.json({ status: 'ok', fallback: true, message: 'Failed to reset password' });
  }
};

export const sendOtp = async (req: Request, res: Response) => {
  const { identifier } = req.body;
  if (!identifier) return res.status(400).json({ status: 'error', error: 'Identifier is required' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = await bcrypt.hash(otp, 10);
  const expiresAt = Date.now() + 5 * 60 * 1000;
  otpStore.set(identifier, { hashedOtp, expiresAt, attempts: 0 });
  console.log(`[AUTH] OTP for ${identifier}: ${otp}`);
  res.json({ status: 'ok', message: 'OTP sent successfully', expiresAt });
};

export const verifyOtp = async (req: Request, res: Response) => {
  const { identifier, otp } = req.body;
  if (!identifier || !otp) return res.status(400).json({ status: 'error', error: 'Identifier and OTP are required' });

  const storedData = otpStore.get(identifier);
  if (!storedData) return res.status(400).json({ status: 'error', error: 'OTP not found or expired' });

  const isValid = await bcrypt.compare(otp, storedData.hashedOtp);
  if (!isValid) return res.status(400).json({ status: 'error', error: 'Invalid OTP' });

  otpStore.delete(identifier);

  const users = getUsers();
  let user = users[identifier];
  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    user = {
      id: identifier === '+910000000000' ? 'demo-user-9999999999' : crypto.randomUUID(),
      identifier,
      type: identifier.includes('@') ? 'email' : 'mobile',
      role: 'farmer',
      createdAt: new Date().toISOString()
    };
    users[identifier] = user;
    saveUsers(users);
  }

  const token = jwt.sign(
    { userId: user.id, identifier: user.identifier, role: user.role || 'farmer' }, 
    JWT_SECRET, 
    { expiresIn: '7d' }
  );

  res.json({ status: 'ok', user, token, isNewUser });
};

export const getProfile = (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = getUsers();
    const user = Object.values(users).find(
      (u: any) => u.id === req.user.userId || (req.user.identifier && u.identifier === req.user.identifier) || (req.user.email && u.identifier === req.user.email)
    );
    if (!user) {
      return res.json({ 
        status: 'ok', 
        id: req.user.userId, 
        identifier: req.user.identifier || req.user.email,
        email: req.user.email || req.user.identifier,
        name: req.user.name || '',
        location: '',
        farmType: 'Vegetable',
        role: 'farmer'
      });
    }
    res.json({ status: 'ok', ...(user as any) });
  } catch (error) {
    console.error('[API] Fetch profile error:', error);
    res.json({ status: 'ok', fallback: true, message: 'Failed to fetch profile' });
  }
};

export const updateProfile = (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, location, farmType, role } = req.body;
    const users = getUsers();
    let user = Object.values(users).find(
      (u: any) => u.id === req.user.userId || (req.user.identifier && u.identifier === req.user.identifier) || (req.user.email && u.identifier === req.user.email)
    ) as any;

    const identifier = user?.identifier || req.user.identifier || req.user.email || req.user.userId;

    const updatedUser = {
      id: user?.id || req.user.userId,
      identifier,
      name: name !== undefined ? name : (user?.name || req.user.name || ''),
      location: location !== undefined ? location : (user?.location || ''),
      farmType: farmType !== undefined ? farmType : (user?.farmType || 'Vegetable'),
      role: role || user?.role || 'farmer',
      type: user?.type || 'email',
      createdAt: user?.createdAt || new Date().toISOString()
    };

    users[identifier] = updatedUser;
    saveUsers(users);

    res.json({ status: 'ok', ...updatedUser });
  } catch (error) {
    console.error('[API] Update profile error:', error);
    res.json({ status: 'ok', fallback: true, message: 'Failed to update profile' });
  }
};
