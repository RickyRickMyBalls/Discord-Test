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

export type DiscordAuthProgress =
  | 'authorizing'
  | 'exchanging_token'
  | 'authenticating';

export const authorizeAndAuthenticate = async (
  discordSdk: DiscordSDK,
  onProgress?: (status: DiscordAuthProgress) => void,
): Promise<DiscordAuthSuccess> => {
  onProgress?.('authorizing');

  // The installed SDK types only allow `prompt: 'none'`, but we want an
  // explicit consent prompt during testing.
  const { code } = await discordSdk.commands.authorize({
    client_id: clientEnv.discordClientId,
    prompt: 'consent' as 'none',
    response_type: 'code',
    scope: ['identify'],
    state: '',
  });

  onProgress?.('exchanging_token');

  const tokenResponse = await fetch(getApiUrl('/api/token'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  });

  const tokenPayload = (await tokenResponse.json()) as
    | { access_token: string }
    | { message?: string; ok?: boolean };

  if (!tokenResponse.ok || !('access_token' in tokenPayload)) {
    const message =
      'message' in tokenPayload && tokenPayload.message
        ? tokenPayload.message
        : `Token exchange failed with status ${tokenResponse.status}.`;
    throw new Error(message);
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
