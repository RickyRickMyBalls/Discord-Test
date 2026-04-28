import type { DiscordSDK } from '@discord/embedded-app-sdk';
import { getApiUrl } from '../lib/api';
import { clientEnv } from '../lib/env';

export type AuthenticatedUser = {
  avatar: string | null;
  discriminator: string;
  globalName: string | null;
  id: string;
  username: string;
};

export type DiscordAuthSuccess = {
  accessToken: string;
  application: {
    description: string;
    icon: string | null;
    id: string;
    name: string;
  };
  expires: string;
  scopes: string[];
  user: AuthenticatedUser;
};

export type DiscordAuthDebugDetails = {
  discordError?: string;
  discordErrorDescription?: string;
  rawResponsePreview?: string;
  responseStatus?: number;
};

export type DiscordAuthProgress =
  | 'authorizing'
  | 'authorizing_consent'
  | 'authorizing_silent'
  | 'silent_authorization_failed'
  | 'exchanging_token'
  | 'authenticating';

export class DiscordAuthFlowError extends Error {
  debug?: DiscordAuthDebugDetails;

  constructor(message: string, debug?: DiscordAuthDebugDetails) {
    super(message);
    this.name = 'DiscordAuthFlowError';
    this.debug = debug;
  }
}

const authorizeWithPrompt = async (discordSdk: DiscordSDK, prompt: 'consent' | 'none') => {
  return discordSdk.commands.authorize({
    client_id: clientEnv.discordClientId,
    prompt: prompt as 'none',
    response_type: 'code',
    scope: ['identify'],
    state: '',
  });
};

export const authorizeAndAuthenticate = async (
  discordSdk: DiscordSDK,
  onProgress?: (status: DiscordAuthProgress) => void,
): Promise<DiscordAuthSuccess> => {
  onProgress?.('authorizing');
  onProgress?.('authorizing_silent');

  let code: string;

  try {
    const silentAuthorization = await authorizeWithPrompt(discordSdk, 'none');
    code = silentAuthorization.code;
  } catch {
    onProgress?.('silent_authorization_failed');
    onProgress?.('authorizing_consent');

    const consentAuthorization = await authorizeWithPrompt(discordSdk, 'consent');
    code = consentAuthorization.code;
  }

  onProgress?.('exchanging_token');

  const tokenResponse = await fetch(getApiUrl('/api/token'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  });

  const rawTokenPayload = await tokenResponse.text();
  let tokenPayload:
    | { access_token: string }
    | { debug?: DiscordAuthDebugDetails; message?: string; ok?: boolean }
    | null = null;

  try {
    tokenPayload = JSON.parse(rawTokenPayload) as
      | { access_token: string }
      | { debug?: DiscordAuthDebugDetails; message?: string; ok?: boolean };
  } catch {
    throw new DiscordAuthFlowError('Token exchange returned a non-JSON response to the client.', {
      rawResponsePreview: rawTokenPayload.slice(0, 300),
      responseStatus: tokenResponse.status,
    });
  }

  if (!tokenResponse.ok || !tokenPayload || !('access_token' in tokenPayload)) {
    const message =
      tokenPayload && 'message' in tokenPayload && tokenPayload.message
        ? tokenPayload.message
        : `Token exchange failed with status ${tokenResponse.status}.`;
    const debug =
      tokenPayload && 'debug' in tokenPayload ? tokenPayload.debug : undefined;
    throw new DiscordAuthFlowError(message, {
      ...debug,
      responseStatus: debug?.responseStatus ?? tokenResponse.status,
    });
  }

  onProgress?.('authenticating');

  const auth = await discordSdk.commands.authenticate({
    access_token: tokenPayload.access_token,
  });

  if (!auth) {
    throw new Error('Discord authenticate() returned no auth payload.');
  }

  return {
    accessToken: auth.access_token,
    application: {
      description: auth.application.description,
      icon: auth.application.icon ?? null,
      id: auth.application.id,
      name: auth.application.name,
    },
    expires: auth.expires,
    scopes: auth.scopes.map((scope) => String(scope)),
    user: {
      avatar: auth.user.avatar ?? null,
      discriminator: auth.user.discriminator,
      globalName: auth.user.global_name ?? null,
      id: auth.user.id,
      username: auth.user.username,
    },
  };
};
