import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

import { uploadDir } from './core/middleware/upload.ts';
import authRoutes from './features/auth/auth.routes.ts';
import fertilizerRoutes from './features/fertilizer/fertilizer.routes.ts';
import historyRoutes from './features/history/history.routes.ts';
import weatherRoutes from './features/weather/weather.routes.ts';
import chatRoutes from './features/chat/chat.routes.ts';
import locationRoutes from './features/location/location.routes.ts';

export async function createApp() {
  const app = express();
  app.set('trust proxy', 1);

  app.use(express.json());

  // Static uploads serving
  app.use('/uploads', express.static(uploadDir));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', message: 'AI Smart Agriculture Adviser API is running' });
  });

  // Base API endpoint
  app.get('/api', (_req, res) => {
    res.json({ status: 'ok', message: 'AI Smart Agriculture Adviser API is running' });
  });

  // Mount Feature-First API Routes (handles both direct /api/* and rewritten /* on Vercel)
  app.use(['/api/auth', '/auth'], authRoutes);
  app.use(['/api/fertilizer', '/fertilizer'], fertilizerRoutes);
  app.use(['/api/history', '/history'], historyRoutes);
  app.use(['/api/weather', '/weather'], weatherRoutes);
  app.use(['/api/chat', '/chat'], chatRoutes);
  app.use(['/api/location', '/location'], locationRoutes);

  // 404 for unmatched /api routes
  app.all(['/api', '/api/*'], (req, res) => {
    console.warn(`[API] 404 Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ status: 'error', error: `API route not found: ${req.method} ${req.url}` });
  });

  // 404 for unmatched /uploads routes
  app.all(['/uploads', '/uploads/*'], (_req, res) => {
    res.status(404).json({ status: 'error', error: 'Upload not found' });
  });

  // Vite development middleware or production static files
  if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        proxy: {}, // Prevent self-referencing proxy loops inside Express
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app;
}
