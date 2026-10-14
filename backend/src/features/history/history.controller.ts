import { Response } from 'express';
import crypto from 'crypto';
import { getHistory, saveHistory } from '../../core/db.ts';
import { AuthenticatedRequest } from '../../core/middleware/auth.ts';

export const getUserHistory = (req: AuthenticatedRequest, res: Response) => {
  try {
    const history = getHistory();
    const userHistory = history.filter((item: any) => item.userId === req.user.userId);
    res.json({ 
      status: 'ok', 
      history: userHistory.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) 
    });
  } catch (error) {
    console.error('[API] Fetch history error:', error);
    res.json({ status: 'ok', history: [], fallback: true, message: 'Failed to fetch history' });
  }
};

export const addHistoryEntry = (req: AuthenticatedRequest, res: Response) => {
  try {
    const history = getHistory();
    const newEntry = {
      id: crypto.randomUUID(),
      ...req.body,
      userId: req.user.userId,
      timestamp: new Date().toISOString()
    };
    history.push(newEntry);
    saveHistory(history);
    res.status(201).json({ status: 'ok', entry: newEntry });
  } catch (error) {
    console.error('[API] Save history error:', error);
    res.json({ status: 'ok', fallback: true, message: 'Failed to save history' });
  }
};
