# Phase 4 Implementation Plan

## Purpose

Phase 4 displays everyone currently connected to the same Discord Activity instance.

This phase should use Discord's Activity participant APIs directly. It should not add WebSockets yet. WebSockets belong to Phase 5 when we need custom shared timer state.

## What Phase 4 Must Accomplish

- Load the initial participant list after the Discord SDK is ready.
- Subscribe to Discord participant updates.
- Render all connected participants with display name, username, and avatar.
- Reuse the existing Discord avatar/display-name helper rules where possible.
- Keep current-user auth and profile card behavior unchanged.
- Keep debug events for participant load/update/failure.

## Discord SDK APIs To Use

Use the installed SDK methods and event names:

- `discordSdk.commands.getInstanceConnectedParticipants()`
- `discordSdk.subscribe('ACTIVITY_INSTANCE_PARTICIPANTS_UPDATE', listener)`
- `discordSdk.unsubscribe('ACTIVITY_INSTANCE_PARTICIPANTS_UPDATE', listener)`

The installed SDK also exposes `getActivityInstanceConnectedParticipants()`, but `getInstanceConnectedParticipants()` is an alias and matches the current roadmap wording.

## Participant Data Shape

Discord participant objects include:

- `id: string`
- `username: string`
- `discriminator: string`
- `avatar?: string | null`
- `global_name?: string | null`
- `nickname?: string`
- `bot: boolean`
- `flags: number`

For UI display:

1. Prefer `nickname` if present.
2. Otherwise prefer `global_name`.
3. Otherwise use `username`.

For secondary text:

- Show `@username`.

For avatars:

- Use the same CDN formatting as the current-user profile card.
- Fall back to Discord default avatars when `avatar` is missing or an image fails.

## Recommended Frontend Shape

New helper/type module:

- `client/src/discord/participants.ts`

Responsibilities:

- define a normalized participant type compatible with the current avatar helpers
- convert SDK participant payloads into normalized participants
- sort participants deterministically by display name, then username, then ID
- dedupe participants by `id`

New UI component:

- `client/src/features/participants/ParticipantsList.tsx`

Responsibilities:

- render loading, ready, empty, and error states
- render participant avatar/name rows
- show a count such as `3 connected`
- include a small current-user marker if participant ID equals authenticated user ID

Main app changes:

- add participant state in `client/src/App.tsx`
- load participants when `discord.status === 'ready'`
- subscribe/unsubscribe in a `useEffect`
- pass authenticated user ID to the list when available
- keep all participant work client-side

## Participant State

Recommended state union:

```ts
type ParticipantsState =
  | { status: 'idle' | 'loading' }
  | { status: 'ready'; participants: NormalizedParticipant[] }
  | { status: 'error'; message: string };
```

Initial behavior:

- Start as `idle`.
- Move to `loading` once SDK is ready.
- Move to `ready` after `getInstanceConnectedParticipants()`.
- Update `ready.participants` whenever the update event fires.
- Move to `error` only if initial load or subscription setup fails.

## Debug Console Expectations

Add safe debug events:

- `Loading connected participants.`
- `Connected participants loaded.`
- `Connected participants updated.`
- `Connected participants subscription failed.`

Do not log access tokens.

Logging participant IDs/names is acceptable during local development, but keep it compact.

## What Phase 4 Is Not

Do not include:

- WebSocket server
- shared timer
- persistence
- database
- new auth scopes
- Rich Presence
- custom backend participant tracking

## Acceptance Criteria

- After Activity launch, the UI shows a participant list panel.
- The list renders each connected participant's name and avatar.
- The current user is visibly included.
- The list updates when another user joins or leaves the same Activity instance.
- No duplicate participants render.
- If participant loading fails, the UI shows a clear error and the debug console records it.
- Client and server builds pass.

## Manual Test Checklist

1. Start local dev with `npm run dev`.
2. Start Cloudflare with `cloudflared tunnel --url http://127.0.0.1:5174`.
3. Update Discord Activity URL mappings to the current tunnel host.
4. Launch the Activity.
5. Confirm auto-auth still succeeds.
6. Confirm the participants panel shows the current user.
7. Invite or have a second user join the same Activity instance.
8. Confirm both users see the same participant list.
9. Have one user leave.
10. Confirm the list updates without refresh.

## Codex Implementation Prompt

Implement Phase 4 for `Discord-Test-Farding`. Add a client-side connected participants feature using the Discord Embedded App SDK. After SDK readiness, call `discordSdk.commands.getInstanceConnectedParticipants()` to load the initial list, then subscribe to `ACTIVITY_INSTANCE_PARTICIPANTS_UPDATE` and update the list whenever Discord sends participant updates. Normalize participant payloads into a small frontend type, dedupe by user ID, sort deterministically, reuse existing Discord display-name/avatar fallback helpers where possible, and render a `ParticipantsList` panel with loading, ready, empty, and error states. Mark the authenticated current user when their ID appears. Keep auth behavior unchanged, do not add WebSockets/timer/backend participant tracking, update docs/changelog, and verify client/server builds.
