const requireEnv = (value: string | undefined, fallback = ''): string => {
  return value ?? fallback;
};

export const clientEnv = {
  apiBaseUrl: requireEnv(import.meta.env.VITE_API_BASE_URL, 'http://localhost:3001'),
  discordClientId: requireEnv(import.meta.env.VITE_DISCORD_CLIENT_ID),
};
