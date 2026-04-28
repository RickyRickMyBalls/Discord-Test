# Phase 3 Implementation Plan

## Purpose

Phase 3 turns the authenticated user data into a real profile card inside the Activity UI.

Its job is to prove that:

- the authenticated Discord user can be displayed cleanly
- the correct display name is chosen
- the user’s profile image can be rendered correctly
- fallback behavior works when the user has no custom avatar

This phase is intentionally smaller than the participant list phase. We are only rendering the current authenticated user.

## What Phase 3 Must Accomplish

Phase 3 should give us:

- a reusable current-user profile card in the frontend
- a display-name selection rule
- Discord avatar URL formatting
- default avatar fallback handling
- a cleaner authenticated UI than the raw Phase 2 debug output

## What Phase 3 Is Not

Do not include these yet:

- connected participant list rendering
- participant join/leave updates
- shared timer logic
- Rich Presence updates
- websocket work

Those belong to later phases.

## Recommended Implementation Goal

The single outcome we want is:

"After authentication succeeds, the Activity displays the current user as a polished Discord profile card with the correct name and avatar."

## Source Of Truth For The User Data

For this phase, the current user should come from the already-authenticated payload returned by:

- `discordSdk.commands.authenticate()`

Do not introduce extra API requests if the existing auth payload already contains what we need.

The current client auth module already captures these fields:

- `id`
- `username`
- `globalName`
- `avatar`

That is enough to build the profile card.

## Display Name Rule

Phase 3 should establish one explicit naming rule and use it consistently.

Recommended rule:

1. Use `globalName` if present
2. Otherwise use `username`

Why:

- `global_name` is the user-facing display identity in modern Discord
- `username` is still the best stable fallback

Recommended additional UI detail:

- show `username` as secondary text if `globalName` exists

Example:

- primary: `Sean`
- secondary: `@rickyrickmyballs`

## Avatar Rule

We need a deterministic way to render profile images.

Recommended rule:

1. If the user has a custom avatar hash, build the CDN URL from user ID + avatar hash
2. Otherwise, render the Discord default avatar

This phase should centralize that logic in a helper function so later participant cards can reuse it.

## Discord Avatar URL Formatting

Recommended helper responsibilities:

- accept user ID
- accept avatar hash or null
- optionally detect animated avatars
- return a usable image URL
- return a default avatar URL when needed

Recommended output behavior:

- custom avatar:
  - `https://cdn.discordapp.com/avatars/{userId}/{avatarHash}.png?size=128`
- animated avatar:
  - use `.gif` when the hash starts with `a_`
- default avatar fallback:
  - use Discord’s embed avatar set

Important note:

The default avatar fallback should be handled intentionally rather than leaving a broken image.

## Recommended Frontend Structure

Phase 3 should stay entirely in the client.

### Files likely to change

- `client/src/App.tsx`
- `client/src/discord/auth.ts`
- `client/src/styles.css`

### New files likely worth adding

- `client/src/discord/user.ts`
- `client/src/features/profile/CurrentUserCard.tsx`

Optional if you want a lightweight component split:

- `client/src/features/profile/types.ts`

## Recommended Responsibilities By File

### `client/src/discord/user.ts`

Suggested helpers:

- `getDiscordDisplayName(user)`
- `getDiscordUsernameLabel(user)`
- `getDiscordAvatarUrl(user)`

Why:

- keeps Discord-specific formatting rules out of the main UI
- makes later participant rendering easier

### `client/src/features/profile/CurrentUserCard.tsx`

Suggested responsibilities:

- render current user avatar
- render primary and secondary identity text
- render a few small metadata rows if useful

This component should be presentation-focused, not auth-focused.

### `client/src/App.tsx`

Suggested responsibilities:

- keep boot/auth orchestration
- decide when to show the profile card
- pass authenticated user data into the profile component

## Recommended UI Behavior

After auth succeeds:

- show the current user card prominently
- keep the lower-level debug section available
- stop relying on raw text dumps as the main identity presentation

Recommended card contents:

- avatar image
- primary display name
- secondary username label
- small “Authenticated” badge or status

Optional debug details below the card:

- user ID
- avatar hash
- granted scopes
- token expiry

## Accessibility And Fallbacks

Phase 3 should handle:

- missing `globalName`
- missing avatar hash
- broken avatar image load

Recommended image fallback behavior:

- compute a default Discord avatar URL up front when no custom avatar exists
- optionally switch to the default avatar if the custom image fails to load

## Recommended Implementation Pattern

Implement Phase 3 in this order:

1. Add a small Discord user formatting helper module
2. Add a current-user profile component
3. Move profile rendering out of the raw auth debug section
4. Keep debug info available but secondary
5. Verify fallback behavior with missing avatar or missing global name cases

## Guardrails

To keep Phase 3 clean:

- do not call participant APIs yet
- do not subscribe to participant events
- do not add shared timer work
- do not expand scopes beyond what Phase 2 already needs
- do not move current-user rendering into the server

## Acceptance Criteria

Phase 3 is complete when all of these are true:

- after successful auth, the current user is displayed as a profile card
- the UI chooses `globalName` first and `username` second
- the UI renders a valid avatar image when a custom avatar exists
- the UI falls back safely when no custom avatar exists
- the raw debug output is no longer the primary identity presentation
- no participant list or timer logic has been added yet

## Manual Test Checklist

1. Launch the Activity in Discord
2. Confirm SDK ready state
3. Complete the auth flow
4. Confirm the user card appears
5. Confirm the displayed name uses `globalName` when available
6. Confirm the username is still visible as secondary text when useful
7. Confirm the avatar renders
8. Confirm the UI still behaves if the user has no custom avatar

## README Updates Likely Needed

When Phase 3 is implemented, the README may need:

- a short note that the app now shows the authenticated current user profile card
- a screenshot later, if desired

## Codex Implementation Prompt

This is the implementation prompt we should be able to hand to Codex next:

Implement Phase 3 for `Discord-Test-Farding`. Use the authenticated user payload already returned by the existing Discord auth flow to render a polished current-user profile card in the Activity UI. Add a small helper module that chooses the display name using `globalName` first and `username` second, formats Discord avatar URLs from user ID and avatar hash, and falls back safely when no custom avatar exists. Update the frontend so the user card becomes the main authenticated view, keep the debug details secondary, and do not implement participant or timer logic yet.
