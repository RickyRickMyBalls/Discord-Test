import { clientEnv } from './env';

export type HealthResponse = {
  ok: boolean;
  service: string;
};

export type TokenExchangeResponse = {
  access_token: string;
};

export const getHealth = async (): Promise<HealthResponse> => {
  const response = await fetch(`${clientEnv.apiBaseUrl}/health`);

  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`);
  }

  return (await response.json()) as HealthResponse;
};
