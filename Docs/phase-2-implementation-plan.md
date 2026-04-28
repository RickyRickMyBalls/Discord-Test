# Phase 2 Implementation Plan

## Purpose

Phase 2 adds real Discord authorization to the Activity.

Its job is to prove that:

- the Activity can request authorization from the Discord client
- the backend can securely exchange the authorization code for an access token
- the Activity can authenticate with the Discord client using that access token
- the UI can show a clear success or failure state for auth

This is the main priority of the repo, so this phase should stay focused and explicit.

## What Phase 2 Must Accomplish

Phase 2 should give us:

- a working `authorize()` call in the client
- a working `POST /api/token` endpoint in the server
- a working `authenticate()` call in the client
- a visible auth state in the UI
- a basic current-user identity result from the authenticated payload

## What Phase 2 Is Not

Do not include these yet:

- participant list rendering
- session-wide identity display
- synced timer logic
- Rich Presence
- websocket state

Those belong to later phases.

## Official Discord Flow To Implement

Based on the current official Discord Activity docs as of April 28, 2026, the intended Activity auth flow is:

1. Call `discordSdk.commands.authorize()` in the Activity
2. Receive an authorization `code`
3. Send that code to the backend
4. Exchange the code server-side with Discord’s OAuth2 token endpoint
5. Return the `access_token` to the client
6. Call `discordSdk.commands.authenticate({ access_token })`
7. Use the returned authenticated payload in the UI

Important details from the current docs:

- `authenticate()` itself requires no additional scopes
- the embedded Activity guide still uses `https://127.0.0.1` as the placeholder redirect URI
- the Embedded App SDK handles redirecting the user back into the Activity after `authorize()`
- the sample guide uses `prompt: "none"` in the authorize command

Primary sources:

- https://docs.discord.com/developers/activities/building-an-activity
- https://docs.discord.com/developers/developer-tools/embedded-app-sdk
- https://docs.discord.com/developers/platform/oauth2-and-permissions
- https://docs.discord.com/developers/topics/oauth2

## Discord Developer Portal Requirements

Before testing Phase 2, the Discord application must be configured correctly.

Required settings:

- Activities enabled
- Activity URL Mapping configured to the public tunnel URL
- OAuth2 redirect URI includes `https://127.0.0.1`
- app client ID copied into the client env
- app client secret copied into the server env

## Recommended OAuth Scope Set

For this phase, keep scopes minimal.

Recommended scopes:

- `identify`

Why only `identify`:

- it is enough to prove user auth
- it returns basic user identity data
- it keeps the prompt smaller and the implementation easier to reason about

Do not add `guilds`, `rpc.activities.write`, or other scopes yet unless a new requirement appears.

## Expected User Experience

On the first launch where the user has not yet granted consent:

1. User launches the Activity
2. Activity boots the SDK
3. User activates the auth flow or the app starts it automatically
4. Discord prompts the user to authorize the app
5. User approves
6. Activity completes backend token exchange
7. Activity authenticates with Discord
8. UI shows authenticated state

On later launches, Discord may skip the prompt if consent is already on file.

## Recommended Implementation Goal

The single outcome we want is:

"A user opens the Activity in Discord, the app completes Discord authorization and authentication successfully, and the UI shows the authenticated user identity from the auth payload."

## Client Code Changes Expected

Phase 2 will mostly touch these files:

- `client/src/App.tsx`
- `client/src/discord/auth.ts`
- `client/src/discord/sdk.ts`
- `client/src/lib/api.ts`
- `client/src/lib/env.ts`
- `client/.env.example`
- `README.md`

## Server Code Changes Expected

Phase 2 should touch:

- `server/src/routes/auth.ts`
- `server/src/lib/discord.ts`
- `server/src/lib/env.ts`
- `server/.env.example`
- possibly `server/src/app.ts` if route wiring changes

## Recommended Responsibilities By File

### `client/src/discord/sdk.ts`

Keep SDK boot concerns here only.

Responsibilities:

- create SDK instance
- ensure `ready()` was completed
- expose SDK instance for auth helpers

Do not bury OAuth logic here if it makes the module messy.

### `client/src/discord/auth.ts`

This should become the client-side auth orchestration module.

Responsibilities:

- call `discordSdk.commands.authorize()`
- send the returned code to the backend
- receive `access_token`
- call `discordSdk.commands.authenticate()`
- normalize the result for the UI

### `server/src/routes/auth.ts`

This should expose the Activity token exchange endpoint.

Responsibilities:

- validate request body
- receive `{ code }`
- call the token exchange helper
- return a minimal success payload
- return useful error responses without leaking secrets

### `server/src/lib/discord.ts`

This should hold the actual Discord OAuth token exchange logic.

Responsibilities:

- send the server-side POST request to Discord’s token endpoint
- use `application/x-www-form-urlencoded`
- include `client_id`, `client_secret`, `grant_type`, `code`, and `redirect_uri`
- parse the response
- throw safe errors on failure

## Environment Variables Needed

### Client `.env`

Required:

```env
VITE_DISCORD_CLIENT_ID=your_discord_application_id
VITE_API_BASE_URL=http://localhost:3001
```

### Server `.env`

Required:

```env
PORT=3001
CLIENT_URL=http://localhost:5173
DISCORD_CLIENT_ID=your_discord_application_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_REDIRECT_URI=https://127.0.0.1
```

Note:

The placeholder redirect URI is intentional for Activities and matches the official Discord guide.

## API Contract To Implement

Recommended request:

`POST /api/token`

```json
{
  "code": "oauth_authorization_code"
}
```

Recommended success response:

```json
{
  "access_token": "discord_access_token"
}
```

Recommended error response shape:

```json
{
  "ok": false,
  "message": "Human-readable error message"
}
```

Keep the response minimal. Do not expose the client secret, refresh token, or raw Discord error bodies unless intentionally sanitized.

## Recommended UI Behavior

Phase 2 should expand the existing status UI.

Suggested auth states:

- `idle`
- `authorizing`
- `exchanging_token`
- `authenticating`
- `authenticated`
- `error`

Suggested UI output:

- a button to begin auth, or an automatic auth attempt after SDK ready
- current auth state label
- authenticated user summary when successful
- readable error message when it fails

## Current User Data To Show In Phase 2

Keep it minimal and grounded in the authenticated payload:

- user ID
- username
- global name if present
- granted scopes

Do not implement avatar formatting yet unless it falls out naturally from the authenticated payload display. The main goal of this phase is auth, not profile presentation polish.

## Recommended Implementation Pattern

Implement Phase 2 in this order:

1. Replace the client auth placeholder with a real auth helper
2. Implement the server token exchange helper
3. Implement `POST /api/token`
4. Add auth state to the frontend UI
5. Trigger auth only after SDK ready
6. Show authenticated user data in the UI
7. Update README with the Discord portal and env setup details

## Guardrails

To keep Phase 2 clean:

- do not fetch `/users/@me` separately unless it becomes necessary
- do not add participant rendering
- do not add timer state
- do not store tokens persistently
- do not expose secrets in client code
- do not move the token exchange into the frontend

## Error Cases To Handle

We should plan for at least these failures:

- missing client ID
- missing client secret
- user closes or declines the auth prompt
- backend `/api/token` returns an error
- Discord token endpoint rejects the code
- `authenticate()` returns null or fails
- app opened outside Discord

The UI should surface these clearly without crashing.

## Acceptance Criteria

Phase 2 is complete when all of these are true:

- the client can call `authorize()` successfully inside Discord
- the backend can exchange the returned code for an access token
- the client can call `authenticate()` with the access token
- the UI shows authenticated state on success
- the UI shows a readable error on failure
- the app displays basic authenticated user identity data
- no participant list or timer logic has been added yet

## Manual Test Checklist

1. Set `client/.env`
2. Set `server/.env`
3. Start both apps with `npm run dev`
4. Start the public tunnel for the client
5. Confirm the Activity URL Mapping points to the tunnel target
6. Confirm `https://127.0.0.1` is present in OAuth2 redirects
7. Launch the Activity in Discord
8. Confirm the SDK ready state appears
9. Trigger the auth flow
10. Approve the Discord authorization prompt if shown
11. Confirm the UI reaches authenticated state
12. Confirm the UI displays authenticated user identity data

## README Updates Likely Needed

When Phase 2 is implemented, the README should document:

- required client and server env vars
- the OAuth2 redirect URI value
- how to run both apps together
- how to test authorization in Discord
- what successful authentication looks like in the UI

## Codex Implementation Prompt

This is the implementation prompt we should be able to hand to Codex next:

Implement Phase 2 for `Discord-Test-Farding`. Replace the client auth placeholder with a real Discord Activity auth flow that runs only after SDK readiness: call `discordSdk.commands.authorize()` with the minimal `identify` scope, send the returned code to a backend `POST /api/token` endpoint, exchange it server-side against Discord’s OAuth2 token endpoint using the configured client secret and redirect URI, then call `discordSdk.commands.authenticate()` with the returned access token. Update the UI to show clear auth states and display the authenticated user identity result, keep the backend health status visible, and do not implement participant or timer logic yet.
