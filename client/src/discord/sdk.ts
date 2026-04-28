import { DiscordSDK } from '@discord/embedded-app-sdk';
import { clientEnv } from '../lib/env';

export type DiscordBootContext = {
  channelId: string | null;
  guildId: string | null;
  instanceId: string | null;
  platform: string | null;
};

export type DiscordBootResult =
  | {
      status: 'ready';
      context: DiscordBootContext;
      sdk: DiscordSDK;
    }
  | {
      status: 'error';
      context: DiscordBootContext;
      message: string;
    };

const getDiscordContext = (): DiscordBootContext => {
  const params = new URLSearchParams(window.location.search);

  return {
    channelId: params.get('channel_id'),
    guildId: params.get('guild_id'),
    instanceId: params.get('instance_id'),
    platform: params.get('platform'),
  };
};

const getRequiredClientId = () => {
  if (!clientEnv.discordClientId) {
    throw new Error('Missing VITE_DISCORD_CLIENT_ID.');
  }

  return clientEnv.discordClientId;
};

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  let timeoutId: ReturnType<typeof window.setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new Error(`Discord SDK ready timed out after ${timeoutMs}ms.`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      window.clearTimeout(timeoutId);
    }
  }
};

export const setupDiscordSdk = async (): Promise<DiscordBootResult> => {
  const context = getDiscordContext();

  try {
    const clientId = getRequiredClientId();
    const sdk = new DiscordSDK(clientId);

    await withTimeout(sdk.ready(), 10000);

    return {
      status: 'ready',
      context: {
        ...context,
        channelId: sdk.channelId,
        guildId: sdk.guildId,
        instanceId: sdk.instanceId,
        platform: sdk.platform,
      },
      sdk,
    };
  } catch (error) {
    return {
      status: 'error',
      context,
      message: error instanceof Error ? error.message : 'Unknown Discord SDK error.',
    };
  }
};

export type ReadyDiscordSdk = Extract<DiscordBootResult, { status: 'ready' }>;
