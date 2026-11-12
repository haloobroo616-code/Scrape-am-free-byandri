import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import sendHandler from './api/send';
import verifHandler from './api/verif';
import healthHandler from './api/health';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Mount API endpoints using the shared Vercel serverless handlers
  app.all('/api/health', (req, res) => healthHandler(req, res));
  app.all('/api/send', (req, res) => sendHandler(req, res));
  app.all('/api/verif', (req, res) => verifHandler(req, res));

  // Serve static dist in production, or Vite middlewares in development
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started on http://0.0.0.0:${PORT}`);
  });
}

startServer();
