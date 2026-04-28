# Phase 3.1 Implementation Plan

## Purpose

Phase 3.1 makes Discord auth feel automatic.

Right now Phase 3 proves the full auth path works, but the user still has to click `Connect Discord`. For the real Activity experience, identity is required before shared presence or timers matter, so the app should start auth as soon as the Discord SDK is ready.

## What Phase 3.1 Must Accomplish

Phase 3.1 should:

- start the existing Discord auth flow automatically after SDK readiness
- run the automatic auth attempt only once per page load
- reuse the proven Phase 2/3 auth code path
- keep the current-user profile card behavior unchanged after success
- keep the manual `Connect Discord` button available as a retry fallback
- keep the debug console visible so auth timing and failures remain easy to inspect

## What Phase 3.1 Is Not

Do not include these yet:

- participant list rendering
- WebSocket presence
- shared timer state
- new Discord scopes
- Rich Presence writes
- backend auth changes unless an auto-auth bug reveals a specific need

Those belong to later phases.

## Recommended Implementation Goal

The single outcome we want is:

"When the Activity launches inside Discord, the user is automatically prompted to authorize, and successful auth renders the existing current-user profile card without requiring a manual button click."

## Expected User Experience

On launch:

1. The app boots the Discord SDK.
2. The app checks backend health.
3. When the SDK is ready, the app starts Discord authorization automatically.
4. The auth card shows a connecting/authenticating state.
5. If auth succeeds, the current-user profile card appears.
6. If auth fails or is cancelled, the `Connect Discord` button remains available for manual retry.

## Recommended State Rules

Add one small guard for auto-auth attempts.

Recommended behavior:

- auto-auth may start only when SDK status is `ready`
- auto-auth should not start if the user is already authenticated
- auto-auth should not start if auth is already in progress
- auto-auth should only run once per page load
- manual auth should still be allowed after a failed or cancelled auto-auth attempt

Recommended implementation:

- use a `useRef(false)` flag such as `hasAttemptedAutoAuthRef`
- trigger from a `useEffect` that watches SDK readiness and auth state
- call the same handler used by the manual button

## Current Code Map

The current implementation is already shaped well for Phase 3.1.

Relevant file:

- `client/src/App.tsx`

Existing state:

- `discord` tracks SDK boot state
- `auth` tracks auth state
- `debugEntries` stores the visible debug console events

Existing function to reuse:

- `handleDiscordAuth()`

Important current behavior:

- `handleDiscordAuth()` already checks that `discord.status === 'ready'`
- `handleDiscordAuth()` already updates progress states through `authorizeAndAuthenticate()`
- `handleDiscordAuth()` already logs success and failure details
- the manual `Connect Discord` button already calls `handleDiscordAuth()`

Phase 3.1 should avoid creating a second auth path. The automatic launch path should call the same handler.

## Implementation Steps

Recommended patch order:

1. Import `useRef` from React in `client/src/App.tsx`.
2. Add `const hasAttemptedAutoAuthRef = useRef(false);` near the existing state hooks.
3. Add a small `isAuthInProgress` boolean so the button disable logic and auto-auth guard can share it.
4. Add a `useEffect` that runs when `discord.status` or `auth.status` changes.
5. Inside that effect, return early unless:
   - `discord.status === 'ready'`
   - `auth.status === 'idle'`
   - `hasAttemptedAutoAuthRef.current === false`
6. Set `hasAttemptedAutoAuthRef.current = true` before starting auth.
7. Add a debug event such as `Discord auto-auth starting.`
8. Call `void handleDiscordAuth();`.
9. Update the auth card copy so idle state says auto-auth will start after SDK readiness.
10. Update the button label:
   - in progress: `Connecting...`
   - error: `Try Again`
   - authenticated: `Connected`
   - otherwise: `Connect Discord`

## Implementation Cautions

There are two easy footguns to avoid:

- Do not put `handleDiscordAuth` directly into the effect dependency list unless it is stabilized first. The simplest safe implementation is to define the effect after `handleDiscordAuth` and depend on the specific state values it reads.
- Set `hasAttemptedAutoAuthRef.current = true` before calling auth, not after, so React re-renders cannot trigger a duplicate authorization modal.

If the linter or compiler complains about dependencies, prefer a tiny extracted `isAuthInProgress` boolean over suppressing warnings.

## Manual Button Behavior

Keep the button because it is useful for:

- Discord popup cancellation
- temporary network failures
- expired auth code attempts
- development debugging

Recommended label behavior:

- idle: `Connect Discord`
- authorizing/exchanging/authenticating: `Connecting...`
- authenticated: keep disabled or leave available only if we intentionally support re-auth later
- error: `Try Again`

## Debug Console Expectations

The debug console should make auto-auth obvious.

Recommended events:

- `Discord auto-auth starting.`
- existing auth progress events:
  - `authorizing`
  - `exchanging_token`
  - `authenticating`
- existing success/failure events

Do not log access tokens or secrets.

## Files Likely To Change

Likely frontend-only:

- `client/src/App.tsx`

Optional if the button text becomes awkward inline:

- any existing auth/status UI component

Docs/changelog:

- `CHANGELOG.md`

No server changes are expected.

## Acceptance Criteria

Phase 3.1 is complete when all of these are true:

- launching the Activity automatically starts Discord auth after SDK readiness
- the auth flow is not repeatedly triggered in a loop
- successful auth still shows the current user's Discord name and avatar
- cancelling or failing auth leaves a visible manual retry button
- the debug console shows that auto-auth started
- no participant list or timer work has been added

## Manual Test Checklist

1. Start the local dev stack.
2. Start the Cloudflare tunnel to `http://127.0.0.1:5174`.
3. Update Discord Activity URL mappings to the current tunnel host.
4. Relaunch the Activity in Discord.
5. Confirm the auth modal appears without pressing `Connect Discord`.
6. Authorize the app.
7. Confirm the current-user profile card appears.
8. Relaunch and cancel auth once.
9. Confirm the manual retry button still works.

## Codex Implementation Prompt

Implement Phase 3.1 for `Discord-Test-Farding`. In `client/src/App.tsx`, auto-start the existing Discord auth flow once after the Embedded App SDK reaches `ready`, without changing the backend token exchange or adding new scopes. Reuse the existing `handleDiscordAuth()` path used by the manual `Connect Discord` button, add a `useRef` guard so auto-auth cannot repeat during one page load, keep the button as a fallback after errors or cancellation, update the button label for in-progress/error/authenticated states, and add a debug-console event showing when auto-auth starts. Update `CHANGELOG.md`. Do not implement participant list, WebSocket, or timer logic yet.
