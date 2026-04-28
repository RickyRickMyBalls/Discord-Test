import { type DiscordSDK } from '@discord/embedded-app-sdk';
import { useEffect, useState } from 'react';
import {
  authorizeAndAuthenticate,
  DiscordAuthFlowError,
  type DiscordAuthSuccess,
} from './discord/auth';
import { DebugConsole, type DebugLogEntry } from './features/debug/DebugConsole';
import { CurrentUserCard } from './features/profile/CurrentUserCard';
import {
  type DiscordBootContext,
  setupDiscordSdk,
} from './discord/sdk';
import { getHealth } from './lib/api';
import { clientEnv } from './lib/env';
import './styles.css';

type HealthState =
  | { status: 'idle' | 'loading' }
  | { status: 'success'; service: string }
  | { status: 'error'; message: string };

type DiscordState =
  | { status: 'idle' }
  | { status: 'connecting' }
  | { status: 'ready'; context: DiscordBootContext; sdk: DiscordSDK }
  | { status: 'error'; message: string; context: DiscordBootContext };

type AuthState =
  | { status: 'idle' }
  | { status: 'authorizing' }
  | { status: 'exchanging_token' }
  | { status: 'authenticating' }
  | { status: 'authenticated'; result: DiscordAuthSuccess }
  | { status: 'error'; message: string };

function App() {
  const [health, setHealth] = useState<HealthState>({ status: 'loading' });
  const [discord, setDiscord] = useState<DiscordState>({ status: 'idle' });
  const [auth, setAuth] = useState<AuthState>({ status: 'idle' });
  const [debugEntries, setDebugEntries] = useState<DebugLogEntry[]>([]);

  const addDebugEntry = (
    level: DebugLogEntry['level'],
    message: string,
    detail?: string,
  ) => {
    setDebugEntries((currentEntries) => [
      {
        detail,
        id: Date.now() + currentEntries.length,
        level,
        message,
        timestamp: new Date().toLocaleTimeString(),
      },
      ...currentEntries,
    ]);
  };

  useEffect(() => {
    let active = true;

    const loadHealth = async () => {
      try {
        addDebugEntry('info', 'Checking backend health endpoint.');
        const response = await getHealth();

        if (!active) {
          return;
        }

        setHealth({ status: 'success', service: response.service });
        addDebugEntry('success', 'Backend health check succeeded.', response.service);
      } catch (error) {
        if (!active) {
          return;
        }

        const message =
          error instanceof Error ? error.message : 'Unknown health check error';
        setHealth({ status: 'error', message });
        addDebugEntry('error', 'Backend health check failed.', message);
      }
    };

    void loadHealth();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const bootDiscord = async () => {
      setDiscord({ status: 'connecting' });
      addDebugEntry('info', 'Starting Discord SDK boot.');

      const result = await setupDiscordSdk();

      if (!active) {
        return;
      }

      if (result.status === 'ready') {
        setDiscord({
          status: 'ready',
          context: result.context,
          sdk: result.sdk,
        });
        addDebugEntry(
          'success',
          'Discord SDK ready.',
          JSON.stringify(result.context, null, 2),
        );
        return;
      }

      setDiscord({
        status: 'error',
        message: result.message,
        context: result.context,
      });
      addDebugEntry(
        'error',
        'Discord SDK boot failed.',
        `${result.message}\n${JSON.stringify(result.context, null, 2)}`,
      );
    };

    void bootDiscord();

    return () => {
      active = false;
    };
  }, []);

  const handleDiscordAuth = async () => {
    if (discord.status !== 'ready') {
      addDebugEntry('error', 'Skipped auth start because Discord SDK is not ready.');
      return;
    }

    try {
      const authPayload = await authorizeAndAuthenticate(discord.sdk, (status) => {
        setAuth({ status });
        addDebugEntry('info', `Discord auth progress: ${status}.`);
      });

      setAuth({
        status: 'authenticated',
        result: authPayload,
      });
      addDebugEntry(
        'success',
        'Discord auth completed successfully.',
        JSON.stringify(
          {
            application: authPayload.application.name,
            scopes: authPayload.scopes,
            user: authPayload.user,
          },
          null,
          2,
        ),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown auth error.';
      setAuth({
        status: 'error',
        message,
      });
      if (error instanceof DiscordAuthFlowError) {
        addDebugEntry(
          'error',
          'Discord auth failed.',
          JSON.stringify(
            {
              debug: error.debug,
              message,
            },
            null,
            2,
          ),
        );
        return;
      }

      addDebugEntry('error', 'Discord auth failed.', message);
    }
  };

  const isDiscordContextDetected = Boolean(
    discord.status === 'ready'
      ? discord.context.instanceId
      : discord.status === 'error'
        ? discord.context.instanceId
        : new URLSearchParams(window.location.search).get('instance_id'),
  );

  return (
    <main className="app-shell">
      <section className="hero-card">
        <p className="eyebrow">Phase 1 Discord Boot</p>
        <h1>Discord Test Farding</h1>
        <p className="lede">
          The Activity now boots the Embedded App SDK and can complete Discord
          authorization with the minimal <code>identify</code> scope.
        </p>
      </section>

      <section className="grid">
        <article className="panel">
          <h2>Frontend</h2>
          <p>Vite + React + TypeScript is running with a real Discord SDK boot and auth path.</p>
        </article>

        <article className="panel">
          <h2>Backend Health</h2>
          {health.status === 'loading' || health.status === 'idle' ? (
            <p>Checking server status...</p>
          ) : null}
          {health.status === 'success' ? (
            <p>
              Connected to <code>{health.service}</code>.
            </p>
          ) : null}
          {health.status === 'error' ? (
            <p className="error">{health.message}</p>
          ) : null}
        </article>

        <article className="panel">
          <h2>Discord SDK Status</h2>
          <p className={`status-chip status-${discord.status}`}>
            {discord.status === 'idle' ? 'Idle' : null}
            {discord.status === 'connecting' ? 'Connecting' : null}
            {discord.status === 'ready' ? 'Ready' : null}
            {discord.status === 'error' ? 'Error' : null}
          </p>
          {discord.status === 'idle' ? (
            <p>The Discord SDK bootstrap has not started yet.</p>
          ) : null}
          {discord.status === 'connecting' ? (
            <p>Creating the SDK instance and waiting for the Discord client handshake.</p>
          ) : null}
          {discord.status === 'ready' ? (
            <p>
              Discord Activity boot succeeded. The client handshake completed successfully.
            </p>
          ) : null}
          {discord.status === 'error' ? (
            <p className="error">{discord.message}</p>
          ) : null}
        </article>

        <article className="panel">
          <h2>Discord Auth</h2>
          <p className={`status-chip status-${auth.status}`}>
            {auth.status === 'idle' ? 'Idle' : null}
            {auth.status === 'authorizing' ? 'Authorizing' : null}
            {auth.status === 'exchanging_token' ? 'Exchanging Token' : null}
            {auth.status === 'authenticating' ? 'Authenticating' : null}
            {auth.status === 'authenticated' ? 'Authenticated' : null}
            {auth.status === 'error' ? 'Error' : null}
          </p>
          <p>
            {auth.status === 'idle'
              ? 'Ready to start Discord authorization once the SDK is ready.'
              : null}
            {auth.status === 'authorizing'
              ? 'Waiting for Discord to grant authorization.'
              : null}
            {auth.status === 'exchanging_token'
              ? 'Exchanging the authorization code on the backend.'
              : null}
            {auth.status === 'authenticating'
              ? 'Authenticating the Activity with the returned access token.'
              : null}
            {auth.status === 'authenticated'
              ? 'Discord authorization and authentication succeeded.'
              : null}
          </p>
          {auth.status === 'error' ? <p className="error">{auth.message}</p> : null}
          <button
            className="primary-button"
            disabled={discord.status !== 'ready' || auth.status === 'authorizing' || auth.status === 'exchanging_token' || auth.status === 'authenticating'}
            onClick={() => {
              void handleDiscordAuth();
            }}
            type="button"
          >
            Connect Discord
          </button>
        </article>
      </section>

      {auth.status === 'authenticated' ? (
        <CurrentUserCard auth={auth.result} />
      ) : (
        <section className="panel current-user-empty">
          <h2>Current User Card</h2>
          <p>
            Authenticate with Discord to render the polished current-user profile card.
          </p>
        </section>
      )}

      <section className="panel debug-panel">
        <h2>Debug Details</h2>
        <dl>
          <div>
            <dt>API Base URL</dt>
            <dd>{clientEnv.apiBaseUrl}</dd>
          </div>
          <div>
            <dt>Discord Client ID</dt>
            <dd>{clientEnv.discordClientId || 'Not set yet'}</dd>
          </div>
          <div>
            <dt>Discord Context Detected</dt>
            <dd>{isDiscordContextDetected ? 'Yes' : 'No'}</dd>
          </div>
          <div>
            <dt>Instance ID</dt>
            <dd>
              {discord.status === 'ready'
                ? discord.context.instanceId ?? 'Unavailable'
                : discord.status === 'error'
                  ? discord.context.instanceId ?? 'Unavailable'
                  : 'Unavailable'}
            </dd>
          </div>
          <div>
            <dt>Platform</dt>
            <dd>
              {discord.status === 'ready'
                ? discord.context.platform ?? 'Unavailable'
                : discord.status === 'error'
                  ? discord.context.platform ?? 'Unavailable'
                  : 'Unavailable'}
            </dd>
          </div>
          <div>
            <dt>Channel ID</dt>
            <dd>
              {discord.status === 'ready'
                ? discord.context.channelId ?? 'Unavailable'
                : discord.status === 'error'
                  ? discord.context.channelId ?? 'Unavailable'
                  : 'Unavailable'}
            </dd>
          </div>
          <div>
            <dt>Guild ID</dt>
            <dd>
              {discord.status === 'ready'
                ? discord.context.guildId ?? 'Unavailable'
                : discord.status === 'error'
                  ? discord.context.guildId ?? 'Unavailable'
                  : 'Unavailable'}
            </dd>
          </div>
          <div>
            <dt>Auth Scopes</dt>
            <dd>
              {auth.status === 'authenticated'
                ? auth.result.scopes.join(', ')
                : 'Unavailable'}
            </dd>
          </div>
          <div>
            <dt>Auth User</dt>
            <dd>
              {auth.status === 'authenticated'
                ? auth.result.user.globalName ?? auth.result.user.username
                : 'Unavailable'}
            </dd>
          </div>
        </dl>
      </section>

      <DebugConsole entries={debugEntries} />

      <section className="panel debug-panel">
        <h2>Authenticated User</h2>
        {auth.status !== 'authenticated' ? (
          <p>The authenticated user identity will appear here after a successful auth flow.</p>
        ) : (
          <dl>
            <div>
              <dt>User ID</dt>
              <dd>{auth.result.user.id}</dd>
            </div>
            <div>
              <dt>Username</dt>
              <dd>{auth.result.user.username}</dd>
            </div>
            <div>
              <dt>Global Name</dt>
              <dd>{auth.result.user.globalName ?? 'Unavailable'}</dd>
            </div>
            <div>
              <dt>Discriminator</dt>
              <dd>{auth.result.user.discriminator}</dd>
            </div>
            <div>
              <dt>Avatar Hash</dt>
              <dd>{auth.result.user.avatar ?? 'Unavailable'}</dd>
            </div>
            <div>
              <dt>Scopes</dt>
              <dd>{auth.result.scopes.join(', ')}</dd>
            </div>
            <div>
              <dt>Token Expires</dt>
              <dd>{auth.result.expires}</dd>
            </div>
          </dl>
        )}
      </section>
    </main>
  );
}

export default App;
