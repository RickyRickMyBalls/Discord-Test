import { Router } from 'express';
import { exchangeDiscordCode } from '../lib/discord.js';

export const authRouter = Router();

authRouter.post('/token', async (request, response) => {
  const code = request.body?.code;

  if (typeof code !== 'string' || code.trim().length === 0) {
    response.status(400).json({
      ok: false,
      message: 'A Discord authorization code is required.',
    });
    return;
  }

  try {
    const token = await exchangeDiscordCode(code);

    response.json({
      access_token: token.access_token,
    });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: error instanceof Error ? error.message : 'Discord token exchange failed.',
    });
  }
});
