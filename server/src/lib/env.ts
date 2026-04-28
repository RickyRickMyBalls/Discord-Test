import dotenv from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = dirname(fileURLToPath(import.meta.url));

dotenv.config({
  path: resolve(currentDirectory, '../../.env'),
});

const getRequiredString = (value: string | undefined, fallback?: string) => {
  const resolved = value ?? fallback;

  if (!resolved) {
    throw new Error('Missing required server environment variable.');
  }

  return resolved;
};

export const serverEnv = {
  port: Number.parseInt(process.env.PORT ?? '3001', 10),
  clientUrl: getRequiredString(process.env.CLIENT_URL, 'http://127.0.0.1:5174'),
  discordClientId: getRequiredString(process.env.DISCORD_CLIENT_ID, 'your_discord_application_id'),
  discordClientSecret: getRequiredString(
    process.env.DISCORD_CLIENT_SECRET,
    'your_discord_client_secret',
  ),
  discordRedirectUri: getRequiredString(process.env.DISCORD_REDIRECT_URI, 'https://127.0.0.1'),
};
