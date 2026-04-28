import cors from 'cors';
import express from 'express';
import { serverEnv } from './lib/env.js';
import { authRouter } from './routes/auth.js';
import { healthRouter } from './routes/health.js';

export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: serverEnv.clientUrl,
    }),
  );
  app.use(express.json());

  app.use('/health', healthRouter);
  app.use('/api', authRouter);

  return app;
};
