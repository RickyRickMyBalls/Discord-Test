# Phase 3.2 Implementation Plan

## Purpose

Phase 3.2 hardens the working Discord auth flow before shared presence adds more moving parts.

The main risk this phase addresses is repeated OAuth/token exchange calls during development or from impatient clicks. We want auth to happen once, stay in memory, and expose a safe retry path only after a short cooldown.

## What Phase 3.2 Accomplishes

- Skips auth if the user is already authenticated.
- Skips auth if authorization or token exchange is already in progress.
- Adds a 5 second retry cooldown after auth failure.
- Keeps the Discord access token only in React memory.
- Keeps `prompt: 'consent'` documented as a local testing choice.
- Makes the debug console collapsible.
- Clarifies backend startup logging so no secret value is printed.
- Updates local docs and examples to use `127.0.0.1:5174`.

## What Phase 3.2 Is Not

Do not include:

- participant list rendering
- WebSockets
- synced timer state
- new Discord scopes
- Rich Presence
- persistent auth storage

## Acceptance Criteria

- Auto-auth starts only once per page load.
- Repeated clicks during auth do not create duplicate token exchange calls.
- After successful auth, the button is disabled as `Connected`.
- After failed auth, retry is blocked briefly and then available again.
- The debug console can be collapsed.
- Client and server builds pass.

## Manual Test Checklist

1. Start `npm run dev`.
2. Start Cloudflare with `cloudflared tunnel --url http://127.0.0.1:5174`.
3. Relaunch the Activity.
4. Confirm auth starts automatically.
5. Click the auth button repeatedly during auth and confirm no duplicate `/api/token` calls.
6. Cancel auth and confirm retry cooldown behavior.
7. Complete auth and confirm the button shows `Connected`.
