# Phase 1 Implementation Plan

## Purpose

Phase 1 is the first real Discord integration step.

Its only job is to prove that:

- the app can launch as a Discord Activity
- the frontend can connect to the Discord client through the Embedded App SDK
- the UI can confirm `discordSdk.ready()` succeeded

This phase is intentionally narrower than auth. We are not requesting OAuth scopes or exchanging tokens yet.

## What Phase 1 Must Accomplish

Phase 1 should give us:

- `@discord/embedded-app-sdk` installed in the client
- a real SDK bootstrap path in the frontend
- a visible loading, success, and error state for SDK boot
- the ability to open the app inside Discord and see that the SDK handshake succeeded

## What Phase 1 Is Not

Do not include these yet:

- `authorize()`
- backend token exchange
- `authenticate()`
- profile fetch logic
- participant rendering
- synced timer logic

If any of those start showing up in implementation, the phase is too broad.

## Official Discord Setup Required First

Before implementation can be tested in Discord, the Discord app itself must be configured correctly.

Based on the official Discord docs as of April 28, 2026, Phase 1 requires:

- Discord Developer Mode enabled on the testing account
- Activities enabled in the app’s Activity settings
- a public URL mapping under Activities -> URL Mappings
- launching through the default Entry Point command named `Launch`

Discord’s current docs also state that:

- enabling Activities automatically creates the default `Launch` Entry Point command
- the Activity should be reachable through a public URL mapping
- Activities run as web apps inside an iframe and communicate through the Embedded App SDK

Sources:

- https://docs.discord.com/developers/activities/building-an-activity
- https://docs.discord.com/developers/activities
- https://docs.discord.com/developers/developer-tools/embedded-app-sdk
- https://docs.discord.com/developers/activities/development-guides/networking

## Recommended Local Testing Setup

For local development, we should expose the client app through a public tunnel.

Recommended approach:

- keep the Vite client on `http://localhost:5173`
- use `cloudflared` or `ngrok` to create a public HTTPS URL
- map `/` in Discord Activity URL Mappings to that tunnel target

Example flow:

1. Run the client locally
2. Start a tunnel to the client port
3. Copy the generated public URL
4. Add it to Discord Activity URL Mappings with prefix `/`
5. Launch the Activity from Discord’s App Launcher

Important note:

For Phase 1, the frontend is the only piece Discord must load directly. The Express server can stay local for now because auth is not being exercised yet.

## Implementation Goal

The single outcome we want is:

"When the Activity opens inside Discord, the app initializes the Embedded App SDK, waits for `discordSdk.ready()`, and renders a visible success state."

## Client Code Changes Expected

Phase 1 should mostly touch the client.

### Files likely to change

- `client/package.json`
- `client/src/App.tsx`
- `client/src/discord/sdk.ts`
- `client/src/lib/env.ts`
- `client/.env.example`
- `README.md`

### Files that should probably not change much

- `server/src/routes/auth.ts`
- `server/src/lib/discord.ts`

Server auth files already exist as placeholders and should stay untouched in this phase unless a tiny README update is needed.

## Recommended Client Design

The SDK bootstrap should be isolated behind a small wrapper.

Suggested responsibility split:

- `client/src/discord/sdk.ts`
  - create the SDK instance
  - expose an async `setupDiscordSdk()` helper
  - call `ready()`
  - return useful status info

- `client/src/App.tsx`
  - call the SDK setup on mount
  - display one of three UI states:
    - waiting for Discord
    - Discord SDK ready
    - Discord SDK failed

## Environment Variables Needed

Phase 1 needs only the client Discord application ID on the frontend.

### Required client env

```env
VITE_DISCORD_CLIENT_ID=your_discord_application_id
```

### Existing client env still useful

```env
VITE_API_BASE_URL=http://localhost:3001
```

Even though the API base URL is not central to this phase, we should keep it because it is already part of the scaffold and will be used again in Phase 2.

## UI Behavior For Phase 1

The UI should clearly communicate SDK boot state.

Recommended sections:

- app title
- backend health panel
- Discord SDK status panel
- short debug details panel

### SDK status states

Recommended messaging:

- `Idle`
  - app loaded but SDK bootstrap has not started yet
- `Connecting`
  - SDK instance created and waiting on `ready()`
- `Ready`
  - `discordSdk.ready()` resolved successfully
- `Error`
  - SDK bootstrap failed and we show the error message

### Debug details worth showing

Useful but minimal details:

- whether `VITE_DISCORD_CLIENT_ID` is present
- whether the app appears to be running inside Discord
- any boot error message

## Recommended Implementation Pattern

The implementation should follow this shape:

1. Install `@discord/embedded-app-sdk` in `client/`
2. Replace the placeholder in `client/src/discord/sdk.ts` with a real SDK bootstrap helper
3. On app mount, attempt SDK setup
4. Render status updates while awaiting `ready()`
5. Preserve the backend health card from Phase 0
6. Keep auth placeholder UI present but clearly marked as "next phase"

## Guardrails

To keep Phase 1 clean:

- do not call `authorize()`
- do not require the backend for SDK readiness
- do not fetch Discord user data
- do not add more scopes or OAuth settings than needed for Phase 1
- do not start participant or timer work

## Recommended Error Cases To Handle

We should expect at least these conditions:

- missing `VITE_DISCORD_CLIENT_ID`
- app opened in a normal browser instead of Discord
- SDK ready handshake failure

The UI should not crash in any of these cases. It should show an understandable state instead.

## Acceptance Criteria

Phase 1 is complete when all of these are true:

- the client has `@discord/embedded-app-sdk` installed
- the app creates a Discord SDK instance using the configured client ID
- the app calls `discordSdk.ready()`
- the UI shows loading, success, and failure states for SDK boot
- the Activity can be launched from Discord’s App Launcher
- when launched inside Discord, the UI visibly confirms SDK readiness
- no auth logic has been implemented yet

## Manual Test Checklist

Use this checklist when Phase 1 is implemented:

1. Run the local client
2. Start the public tunnel
3. Confirm the URL Mapping in the Discord developer portal points `/` to the tunnel target
4. Confirm Activities are enabled for the Discord application
5. Open Discord
6. Launch the app from the App Launcher in a test server, DM, or group DM where supported
7. Confirm the Activity iframe loads
8. Confirm the UI shows the SDK ready state
9. Open the same URL in a normal browser and confirm the app handles non-Discord context without crashing

## Likely Documentation Updates

Once Phase 1 is implemented, the README should include:

- how to start the client
- how to start the tunnel
- where to configure the Activity URL mapping
- how to verify the SDK ready state in Discord

## Codex Implementation Prompt

This is the implementation prompt we should be able to hand to Codex next:

Implement Phase 1 for `Discord-Test-Farding`. Install `@discord/embedded-app-sdk` in the client, replace the Phase 0 Discord SDK placeholder with a real bootstrap helper that creates the SDK instance and awaits `discordSdk.ready()`, and update the frontend UI to show clear Discord SDK boot states: idle, connecting, ready, and error. Keep the backend health check visible, do not implement OAuth or participant logic yet, and update the README with the local tunnel and Discord Activity launch steps needed to test SDK readiness.
