import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config.ts';

export interface AuthenticatedRequest extends Request {
  user?: any;
  file?: any;
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ status: 'error', error: 'Access denied' });
  }

  // 1. First attempt to verify with local JWT_SECRET
  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (!err && user) {
      req.user = user;
      return next();
    }

    // 2. If local verify fails, decode token to handle Firebase ID tokens
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded && (decoded.sub || decoded.user_id || decoded.uid)) {
        req.user = {
          userId: decoded.user_id || decoded.sub || decoded.uid,
          identifier: decoded.email || decoded.phone_number || decoded.sub,
          email: decoded.email,
          name: decoded.name || '',
          role: decoded.role || 'farmer'
        };
        return next();
      }
    } catch (decodeErr) {
      console.warn('[AUTH] Token decode error:', decodeErr);
    }

    return res.status(403).json({ status: 'error', error: 'Invalid token' });
  });
};
