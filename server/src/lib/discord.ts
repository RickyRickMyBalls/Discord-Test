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

type DiscordTokenExchangeFailureDetails = {
  discordError?: string;
  discordErrorDescription?: string;
  responseStatus: number;
};

export class DiscordTokenExchangeError extends Error {
  details: DiscordTokenExchangeFailureDetails;

  constructor(message: string, details: DiscordTokenExchangeFailureDetails) {
    super(message);
    this.name = 'DiscordTokenExchangeError';
    this.details = details;
  }
}

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

  const rawPayload = await response.text();
  let payload: DiscordTokenSuccess | DiscordTokenError | null = null;

  try {
    payload = JSON.parse(rawPayload) as DiscordTokenSuccess | DiscordTokenError;
  } catch {
    console.error('[discord-oauth] Token exchange returned a non-JSON payload.', {
      clientId: serverEnv.discordClientId,
      redirectUri: serverEnv.discordRedirectUri,
      responseStatus: response.status,
      responsePreview: rawPayload.slice(0, 300),
    });

    throw new DiscordTokenExchangeError('Discord token exchange returned a non-JSON response.', {
      responseStatus: response.status,
    });
  }

  if (!response.ok || !payload || !('access_token' in payload)) {
    const message =
      'error_description' in payload && payload.error_description
        ? payload.error_description
        : 'Discord token exchange failed.';

    const details = {
      discordError: 'error' in payload ? payload.error : undefined,
      discordErrorDescription:
        'error_description' in payload ? payload.error_description : undefined,
      responseStatus: response.status,
    };

    console.error('[discord-oauth] Token exchange failed.', {
      clientId: serverEnv.discordClientId,
      codeLength: code.length,
      discordError: details.discordError,
      discordErrorDescription: details.discordErrorDescription,
      redirectUri: serverEnv.discordRedirectUri,
      responseStatus: details.responseStatus,
    });

    throw new DiscordTokenExchangeError(message, details);
  }

  return payload;
};
