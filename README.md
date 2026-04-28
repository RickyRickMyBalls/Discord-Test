# Discord Test Farding

Minimal Discord Activity starter focused on proving three things cleanly:

- Discord authorization works end to end
- participant names and avatars can render in-session
- a shared timer can stay synced for everyone in the Activity

Current status:

- Phase 0 complete: client/server scaffold
- Phase 1 complete: Embedded App SDK boot path and `discordSdk.ready()` UI state
- Phase 2 complete: Discord `authorize()` -> backend token exchange -> `authenticate()`

## Stack

- `client/`: Vite + React + TypeScript
- `server/`: Node + Express + TypeScript

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment examples:

```bash
copy client\\.env.example client\\.env
copy server\\.env.example server\\.env
```

3. Start both apps:

```bash
npm run dev
```

If you only want the Activity frontend while testing SDK boot:

```bash
npm run dev:client
```

## Local URLs

- Client: `http://localhost:5173`
- Server: `http://localhost:3001`
- Health: `http://localhost:3001/health`

## Discord Activity Test Steps

1. Create `client/.env` from `client/.env.example` and set `VITE_DISCORD_CLIENT_ID`.
2. Create `server/.env` from `server/.env.example` and set:

- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `DISCORD_REDIRECT_URI=https://127.0.0.1`

3. In the Discord Developer Portal, add `https://127.0.0.1` under `OAuth2 -> Redirects`.
4. Start both apps locally with `npm run dev`.
5. Start a public tunnel to the client URL.

Example with `cloudflared`:

```bash
cloudflared tunnel --url http://localhost:5173
```

6. Copy the generated HTTPS URL.
7. In the Discord Developer Portal for your app:

- enable Developer Mode on your Discord account
- go to `Activities -> URL Mappings`
- map `/` to the tunnel target
- go to `Activities -> Settings`
- enable Activities

8. Open Discord and launch the app from the App Launcher.
9. Confirm the Activity UI shows Discord SDK status as `Ready`.
10. Click `Connect Discord`.
11. Approve the authorization prompt if Discord asks for consent.
12. Confirm the auth panel reaches `Authenticated` and the user identity appears on screen.

If you open the app in a normal browser instead, it should stay stable and show an SDK error explaining that the Discord Activity query params are missing.

## Current Scaffold

This repo currently includes:

- a client/server workspace setup
- a backend health endpoint
- a frontend health check
- a real Embedded App SDK boot path
- a real Discord auth flow using `identify`

Participant rendering and the synced timer are intentionally not implemented yet.
