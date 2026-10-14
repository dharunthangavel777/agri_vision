import { Request, Response } from 'express';

export const handleChat = async (_req: Request, res: Response) => {
  res.status(410).json({ status: 'error', error: 'This endpoint has moved to the frontend' });
};

export const handleChatImage = async (_req: Request, res: Response) => {
  res.status(410).json({ status: 'error', error: 'This endpoint has moved to the frontend' });
};
