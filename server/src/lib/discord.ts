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
  rawResponsePreview?: string;
  retryAfterSeconds?: string | null;
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
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': `Discord-Test-Farding/0.1 (${serverEnv.clientUrl})`,
    },
    body,
  });

  const rawPayload = await response.text();
  let payload: DiscordTokenSuccess | DiscordTokenError | null = null;

  try {
    payload = JSON.parse(rawPayload) as DiscordTokenSuccess | DiscordTokenError;
  } catch {
    const retryAfterSeconds = response.headers.get('retry-after');
    const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');

    if (response.status === 429) {
      console.error('[discord-oauth] Token exchange hit a non-JSON rate limit response.', {
        clientId: serverEnv.discordClientId,
        rateLimitRemaining,
        redirectUri: serverEnv.discordRedirectUri,
        responseStatus: response.status,
        responsePreview: rawPayload.slice(0, 300),
        retryAfterSeconds,
      });

      throw new DiscordTokenExchangeError(
        `Discord OAuth is rate limiting the token exchange. Wait ${retryAfterSeconds ?? 'a bit'} and try again.`,
        {
          rawResponsePreview: rawPayload.slice(0, 300),
          responseStatus: response.status,
          retryAfterSeconds,
        },
      );
    }

    console.error('[discord-oauth] Token exchange returned a non-JSON payload.', {
      clientId: serverEnv.discordClientId,
      redirectUri: serverEnv.discordRedirectUri,
      responseStatus: response.status,
      responsePreview: rawPayload.slice(0, 300),
    });

    throw new DiscordTokenExchangeError('Discord token exchange returned a non-JSON response.', {
      rawResponsePreview: rawPayload.slice(0, 300),
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
      rawResponsePreview: rawPayload.slice(0, 300),
      retryAfterSeconds: response.headers.get('retry-after'),
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
