import os from 'os';
import { createApp } from './app.ts';
import { PORT } from './core/config.ts';

export { createApp };

function getLocalIp(): string {
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
  } catch {
    // Fallback if network interfaces cannot be read
  }
  return 'localhost';
}

export async function startServer() {
  const app = await createApp();
  const localIp = getLocalIp();

  app.listen(PORT, '0.0.0.0', () => {
    const frontendUrl = `http://localhost:${PORT}/`;
    const backendUrl = `http://localhost:${PORT}/api`;
    const healthUrl = `http://localhost:${PORT}/api/health`;
    const networkUrl = `http://${localIp}:${PORT}/`;

    console.log(`
  \x1b[32m┌──────────────────────────────────────────────────────────┐\x1b[0m
  \x1b[32m│\x1b[0m  \x1b[1m\x1b[32m🌱 AI SMART AGRICULTURE SYSTEM\x1b[0m                          \x1b[32m│\x1b[0m
  \x1b[32m├──────────────────────────────────────────────────────────┤\x1b[0m
  \x1b[32m│\x1b[0m                                                          \x1b[32m│\x1b[0m
  \x1b[32m│\x1b[0m  \x1b[1m\x1b[36m➜  Frontend UI :\x1b[0m  \x1b[4m${frontendUrl.padEnd(38)}\x1b[0m  \x1b[32m│\x1b[0m
  \x1b[32m│\x1b[0m  \x1b[1m\x1b[33m➜  Backend API :\x1b[0m  \x1b[4m${backendUrl.padEnd(38)}\x1b[0m  \x1b[32m│\x1b[0m
  \x1b[32m│\x1b[0m  \x1b[1m\x1b[35m➜  API Health  :\x1b[0m  \x1b[4m${healthUrl.padEnd(38)}\x1b[0m  \x1b[32m│\x1b[0m
  \x1b[32m│\x1b[0m  \x1b[1m\x1b[34m➜  Network     :\x1b[0m  \x1b[4m${networkUrl.padEnd(38)}\x1b[0m  \x1b[32m│\x1b[0m
  \x1b[32m│\x1b[0m                                                          \x1b[32m│\x1b[0m
  \x1b[32m└──────────────────────────────────────────────────────────┘\x1b[0m
`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}
