const getStringEnv = (value: string | undefined, fallback = ''): string => {
  return value ?? fallback;
};

const isEmbeddedDiscordActivity = () => {
  const params = new URLSearchParams(window.location.search);

  return (
    params.has('frame_id') &&
    params.has('instance_id') &&
    params.has('platform')
  );
};

const getApiBaseUrl = () => {
  if (isEmbeddedDiscordActivity()) {
    return '';
  }

  const configuredBaseUrl = getStringEnv(import.meta.env.VITE_API_BASE_URL);

  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/+$/, '');
  }

  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://127.0.0.1:3001';
  }

  return '';
};

export const clientEnv = {
  apiBaseUrl: getApiBaseUrl(),
  discordClientId: getStringEnv(import.meta.env.VITE_DISCORD_CLIENT_ID),
};
