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

### Notes

- Current investigation focus:
  - Discord auth in the embedded Activity returns HTML instead of JSON for the token exchange path.
  - We suspect a Discord proxy, URL mapping, or cached routing mismatch.
  - Request logging was added so the next test can confirm whether `POST /api/token` reaches Render at all.
