# Changelog

## 2026-04-28

### Added

- Created the initial project vision and phased implementation plan in `Docs/`.
- Set up the Phase 0 client/server workspace with:
  - `Vite + React + TypeScript` client
  - `Node + Express + TypeScript` server
  - backend `/health` endpoint
  - shared root scripts and env examples

### Added

- Implemented Phase 1 Discord Activity boot:
  - installed `@discord/embedded-app-sdk`
  - added SDK readiness handling
  - added UI states for `idle`, `connecting`, `ready`, and `error`

### Added

- Implemented Phase 2 Discord auth flow:
  - `authorize()`
  - backend `/api/token` exchange
  - `authenticate()`
  - frontend auth status UI

### Added

- Implemented Phase 3 current-user profile card:
  - display name helper using `globalName` first
  - Discord avatar URL formatting and fallback handling
  - reusable current-user card component

### Changed

- Updated the Render deployment shape to a one-service setup by serving `client/dist` from Express.
- Updated the client to use same-origin API calls when running inside the Discord Activity iframe.
- Switched Discord auth testing to use an explicit consent prompt.

### Added

- Added lightweight HTTP request logging in the Express app to diagnose Discord proxy and URL mapping behavior during auth.
- Added secret-safe Discord OAuth failure logging so Render logs can show token exchange status, redirect URI, and Discord error details without exposing the client secret.
- Added an in-app debug console that records boot, health, and auth events directly in the Activity UI and surfaces safe backend OAuth debug details.
- Added explicit handling for Discord OAuth token exchange rate limits, including retry timing and safe response previews in the debug data.
- Added a Vite dev proxy for `/api` and `/health` so a single local Cloudflare tunnel can load the frontend while still reaching the local Express backend.
- Made server env loading workspace-safe by explicitly reading `server/.env` during local dev while still allowing deployed environment variables to take priority.
- Pinned Vite local dev to port `5174` with `strictPort` so Cloudflare tunnel commands and Discord URL mappings stay predictable.
- Pinned Vite local dev to IPv4 `127.0.0.1` so Cloudflare does not bounce between IPv4 and IPv6 localhost behavior on Windows.
- Added a secret-safe backend startup log for Discord OAuth config so `invalid_client` issues can be diagnosed without printing secrets.

### Notes

- Current investigation focus:
  - Discord auth in the embedded Activity now reaches `POST /api/token`, but the backend returns `500`.
  - Render logs confirmed the request path is correct, so the remaining issue is inside the OAuth token exchange with Discord.
  - The next test should reveal Discord’s token endpoint error details directly in Render logs.
