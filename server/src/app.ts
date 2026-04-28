import cors from 'cors';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serverEnv } from './lib/env.js';
import { authRouter } from './routes/auth.js';
import { healthRouter } from './routes/health.js';

export const createApp = () => {
  const app = express();
  const currentFilePath = fileURLToPath(import.meta.url);
  const currentDirPath = path.dirname(currentFilePath);
  const clientDistPath = path.resolve(currentDirPath, '../../client/dist');
  const clientIndexPath = path.join(clientDistPath, 'index.html');

  app.use(
    cors({
      origin: serverEnv.clientUrl,
    }),
  );
  app.use(express.json());

  app.use('/health', healthRouter);
  app.use('/api', authRouter);
  app.use(express.static(clientDistPath));
  app.get(/^(?!\/(?:api|health)(?:\/|$)).*/, (_request, response) => {
    response.sendFile(clientIndexPath);
  });

  return app;
};
