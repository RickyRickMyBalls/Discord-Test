import dotenv from 'dotenv';

dotenv.config();

const getRequiredString = (value: string | undefined, fallback?: string) => {
  const resolved = value ?? fallback;

  if (!resolved) {
    throw new Error('Missing required server environment variable.');
  }

  return resolved;
};

export const serverEnv = {
  port: Number.parseInt(process.env.PORT ?? '3001', 10),
  clientUrl: getRequiredString(process.env.CLIENT_URL, 'http://localhost:5173'),
  discordClientId: getRequiredString(process.env.DISCORD_CLIENT_ID, 'your_discord_application_id'),
  discordClientSecret: getRequiredString(
    process.env.DISCORD_CLIENT_SECRET,
    'your_discord_client_secret',
  ),
  discordRedirectUri: getRequiredString(process.env.DISCORD_REDIRECT_URI, 'https://127.0.0.1'),
};
