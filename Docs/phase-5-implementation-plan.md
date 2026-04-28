# Phase 5 Implementation Plan

## Purpose

Phase 5 adds one synced timer shared by everyone in the same Discord Activity session.

Phase 4 used Discord SDK participant APIs because Discord owns participant presence. Phase 5 needs our backend because the timer is app-owned shared state.

## What Phase 5 Must Accomplish

- Add a WebSocket server to the existing Express backend.
- Group WebSocket clients by Discord Activity `instanceId`.
- Create one `sessionStartEpochMs` per session.
- Send the same `sessionStartEpochMs` to every client in that session.
- Render an elapsed timer in the frontend from the shared start timestamp.
- Give late joiners the existing timer start time, not a new timer.
- Clean up session memory when the last client disconnects.

## Package And Server Shape

Add backend dependency:

- `ws`

Add backend dev dependency:

- `@types/ws`

Change backend entrypoint:

- `server/src/index.ts` should create a Node HTTP server from the Express app.
- Attach the WebSocket server to that HTTP server.
- Call `server.listen(serverEnv.port, ...)` instead of `app.listen(...)`.

Recommended new backend module:

- `server/src/realtime/timerServer.ts`

Responsibilities:

- create and attach a WebSocket server
- parse timer join messages
- track sessions in memory
- broadcast timer state to session clients
- remove clients/sessions on disconnect

## Session Key

Use Discord Activity `instanceId` as the timer session key.

Why:

- It identifies the current Activity instance.
- It matches the scope where participants are connected together.
- It avoids cross-channel timer leakage.

If `instanceId` is unavailable, the frontend should not open the timer socket and should show a clear "waiting for Discord session" state.

## WebSocket URL

Frontend should derive the WebSocket URL from the current page origin:

- `https:` page -> `wss://current-host/ws`
- `http:` page -> `ws://current-host/ws`

This keeps Render, Cloudflare tunnel, and Discord Activity URL mappings aligned without extra env vars.

## WebSocket Message Shapes

Client to server:

```ts
type TimerClientMessage = {
  type: 'join_timer_session';
  sessionId: string;
  userId: string;
};
```

Server to client:

```ts
type TimerServerMessage =
  | {
      type: 'timer_state';
      sessionId: string;
      sessionStartEpochMs: number;
      serverNowEpochMs: number;
    }
  | {
      type: 'timer_error';
      message: string;
    };
```

Validation:

- `sessionId` must be a non-empty string.
- `userId` must be a non-empty string.
- Invalid or malformed messages receive `timer_error`.

## Timer Behavior

On first valid join for a session:

- create `sessionStartEpochMs = Date.now()`
- add the socket to that session
- send `timer_state` to all clients in that session

On later joins for the same session:

- reuse the existing `sessionStartEpochMs`
- send the same `timer_state`

On disconnect:

- remove the socket from its session
- if no sockets remain, delete that session from memory

Do not add pause/reset controls in Phase 5.

## Frontend Shape

Recommended new client module:

- `client/src/realtime/timerSocket.ts`

Responsibilities:

- derive WebSocket URL
- connect to `/ws`
- send `join_timer_session`
- parse `timer_state` and `timer_error`
- expose callbacks for open/message/error/close

Recommended new UI component:

- `client/src/features/timer/SessionTimer.tsx`

Responsibilities:

- render connection status
- render elapsed timer as `HH:MM:SS`
- show a clear error if timer sync fails

Main app changes:

- add timer state in `client/src/App.tsx`
- connect only after Discord SDK is ready and auth is authenticated
- use `discord.context.instanceId` as `sessionId`
- use authenticated user ID as `userId`
- disconnect on unmount/session change

## Timer State

Recommended state union:

```ts
type TimerState =
  | { status: 'idle' | 'connecting' }
  | { status: 'synced'; sessionStartEpochMs: number; serverNowEpochMs: number; syncedAtEpochMs: number }
  | { status: 'error'; message: string };
```

For display:

- estimate current elapsed time with:
  - `Date.now() - syncedAtEpochMs + (serverNowEpochMs - sessionStartEpochMs)`
- update the visible display once per second with a frontend interval

## Debug Console Expectations

Add safe debug events:

- `Connecting synced timer socket.`
- `Synced timer connected.`
- `Synced timer state received.`
- `Synced timer socket closed.`
- `Synced timer error.`

Do not log access tokens.

## What Phase 5 Is Not

Do not include:

- timer pause/reset controls
- database persistence
- reconnect backoff beyond basic reconnect-on-refresh
- participant tracking over WebSocket
- Rich Presence
- new Discord scopes

## Acceptance Criteria

- One user sees a running timer after auth.
- A second user joining the same Activity sees the same elapsed timer.
- A late joiner does not start from zero.
- Refreshing one client rejoins the existing session timer while another client remains connected.
- When everyone leaves, the in-memory session is removed.
- Client and server builds pass.

## Manual Test Checklist

1. Start local dev with `npm run dev`.
2. Start Cloudflare with `cloudflared tunnel --url http://127.0.0.1:5174`.
3. Update Discord Activity URL mappings to the current tunnel host.
4. Launch the Activity with one account.
5. Confirm auth, participants, and timer render.
6. Join with a second account.
7. Confirm both accounts show nearly the same timer value.
8. Refresh one account while the other remains connected.
9. Confirm the refreshed account rejoins the existing timer.
10. Leave with all accounts and confirm no server crash.

## Codex Implementation Prompt

Implement Phase 5 for `Discord-Test-Farding`. Add a backend WebSocket timer server using `ws`, attach it to the existing Express HTTP server at `/ws`, and keep timer session state in memory keyed by Discord Activity `instanceId`. The client should connect after SDK readiness and successful auth, send `{ type: 'join_timer_session', sessionId, userId }`, receive `{ type: 'timer_state', sessionStartEpochMs, serverNowEpochMs }`, and render an elapsed `HH:MM:SS` session timer. Reuse the current page origin to derive the WebSocket URL so Cloudflare/Render mappings keep working. Do not add pause/reset, persistence, participant tracking over WebSocket, Rich Presence, or new Discord scopes. Update docs/changelog and verify client/server builds.
