import { serverEnv } from './env.js';

type DiscordTokenSuccess = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
};

type DiscordTokenError = {
  error?: string;
  error_description?: string;
  message?: string;
};

const ensureConfiguredSecret = () => {
  if (
    serverEnv.discordClientId === 'your_discord_application_id' ||
    serverEnv.discordClientSecret === 'your_discord_client_secret'
  ) {
    throw new Error('Discord OAuth environment variables are not configured on the server.');
  }
};

export const exchangeDiscordCode = async (code: string): Promise<DiscordTokenSuccess> => {
  ensureConfiguredSecret();

  const body = new URLSearchParams({
    client_id: serverEnv.discordClientId,
    client_secret: serverEnv.discordClientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: serverEnv.discordRedirectUri,
  });

  const response = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  const payload = (await response.json()) as DiscordTokenSuccess | DiscordTokenError;

  if (!response.ok || !('access_token' in payload)) {
    const message =
      'error_description' in payload && payload.error_description
        ? payload.error_description
        : 'Discord token exchange failed.';
    throw new Error(message);
  }

  return payload;
};
