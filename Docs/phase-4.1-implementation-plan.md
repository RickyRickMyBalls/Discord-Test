# Phase 4.1 Implementation Plan

## Purpose

Phase 4.1 reduces repeated Discord authorization prompts now that auth and participant rendering work.

During debugging, the app intentionally used `prompt: 'consent'` so the Discord authorization modal always appeared. That helped prove the flow, but a normal Discord Activity should avoid asking users to consent every launch when Discord already has consent saved.

## What Phase 4.1 Must Accomplish

- Try silent authorization first with `prompt: 'none'`.
- If silent authorization fails, retry once with `prompt: 'consent'`.
- Keep the existing backend token exchange and `authenticate()` flow unchanged.
- Keep the Phase 3.3 anti-spam guards.
- Keep tokens in memory only.
- Add debug events that make the auth path obvious.

## Recommended Auth Flow

1. Auto-auth starts after SDK readiness, same as today.
2. Client calls `authorize()` with:
   - `prompt: 'none'`
   - `scope: ['identify']`
3. If Discord returns a code, continue with backend token exchange and `authenticate()`.
4. If silent auth fails, log the failure safely and call `authorize()` once more with:
   - `prompt: 'consent'`
   - `scope: ['identify']`
5. If consent auth succeeds, continue normally.
6. If consent auth fails, show the existing error state and retry cooldown.

## Debug Console Expectations

Add safe debug events:

- `Trying silent Discord authorization.`
- `Silent Discord authorization succeeded.`
- `Silent Discord authorization failed; falling back to consent prompt.`
- `Trying consent Discord authorization.`

Do not log access tokens, auth codes, or secrets.

## Files Likely To Change

- `client/src/discord/auth.ts`
- `client/src/App.tsx`
- `CHANGELOG.md`

Optional:

- `README.md`, if the test instructions should mention that consent may not appear every launch after first approval.

## What Phase 4.1 Is Not

Do not add:

- persistent token storage
- refresh token handling
- localStorage/sessionStorage auth cache
- new Discord scopes
- participant changes
- WebSocket/timer work

## Acceptance Criteria

- Returning users usually do not see the consent modal.
- First-time users or users who revoked consent still get the consent modal fallback.
- The app still authenticates and renders the current-user card.
- The participant list still loads after auth.
- Duplicate auth attempts remain blocked.
- Client and server builds pass.

## Manual Test Checklist

1. Launch the Activity with an already-authorized Discord account.
2. Confirm auth completes without requiring the consent modal, if Discord allows silent auth.
3. Revoke app authorization in Discord user settings or test with a fresh account.
4. Relaunch the Activity.
5. Confirm silent auth fails and the consent modal appears as fallback.
6. Approve consent.
7. Confirm current user and participants still render.

## Codex Implementation Prompt

Implement Phase 4.1 for `Discord-Test-Farding`. Update the client auth helper so it tries Discord `authorize()` with `prompt: 'none'` first, then falls back once to `prompt: 'consent'` only if silent authorization fails. Preserve the existing backend token exchange and `authenticate()` behavior, keep the Phase 3.3 anti-spam guards, do not store access tokens outside memory, and add safe debug progress events so the Debug Console shows whether silent auth or consent fallback was used. Update changelog/docs as needed and verify client/server builds.
