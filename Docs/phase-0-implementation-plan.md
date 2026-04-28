# Phase 0 Implementation Plan

## Purpose

Phase 0 exists to prepare the repo for Phase 1 and Phase 2 without mixing in Discord-specific debugging too early.

By the end of Phase 0, we should have a clean client/server project skeleton that:

- runs locally
- is easy to configure
- already has the places where Discord boot and auth code will go next

This is not the phase where we prove Discord works. This is the phase where we remove setup noise so the Discord work can be implemented cleanly.

## What Phase 0 Must Accomplish

Phase 0 should give us:

- a frontend app that can render a basic page
- a backend app that can serve health/debug endpoints
- shared environment configuration
- local scripts that start the project easily
- a folder structure that naturally supports Discord SDK boot and OAuth token exchange

## Recommended Stack

Keep the stack minimal and conventional:

- Frontend: `Vite + React + TypeScript`
- Backend: `Node.js + Express + TypeScript`
- Package manager: `npm`
- Realtime later: `ws` or `socket.io`, but not needed in Phase 0

Why this stack:

- It matches Discord’s web-app model well.
- It is simple to scaffold and debug.
- It gives us an obvious place for the OAuth token exchange server.
- It is easy for Codex to extend phase by phase.

## Repo Shape

Recommended folder structure:

```text
Discord-Test-Farding/
  client/
    src/
    public/
    index.html
    package.json
    tsconfig.json
    vite.config.ts
    .env.example
  server/
    src/
    package.json
    tsconfig.json
    .env.example
  Docs/
    vision-and-phases.md
    phase-0-implementation-plan.md
  .gitignore
  package.json
  README.md
```

## Root Responsibilities

The root of the repo should do only a few things:

- describe the project
- provide shared scripts
- document setup

The root `package.json` should mainly provide convenience commands such as:

- `install:all`
- `dev`
- `dev:client`
- `dev:server`
- `build`

## Client Responsibilities

The `client/` app should be prepared for later Discord Activity work.

In Phase 0 it only needs:

- a React app shell
- a simple status page
- a small API call to the backend health endpoint
- a clean location for future Discord SDK setup

Suggested future-friendly `client/src/` shape:

```text
client/src/
  main.tsx
  App.tsx
  styles.css
  lib/
    api.ts
    env.ts
  features/
    health/
  discord/
    sdk.ts
    auth.ts
```

Notes:

- `discord/sdk.ts` can exist as an empty placeholder or very light wrapper in Phase 0.
- `discord/auth.ts` can also exist as a placeholder so Phase 2 has a clear home.

## Server Responsibilities

The `server/` app should be prepared for later auth work.

In Phase 0 it only needs:

- an Express server
- a health endpoint
- JSON parsing
- basic CORS or local dev config if needed
- a clean location for future Discord OAuth exchange logic

Suggested future-friendly `server/src/` shape:

```text
server/src/
  index.ts
  app.ts
  routes/
    health.ts
    auth.ts
  lib/
    env.ts
    discord.ts
```

Notes:

- `routes/auth.ts` can be a placeholder in Phase 0.
- `lib/discord.ts` can be reserved for token exchange helpers in Phase 2.

## Environment Variables To Prepare Now

We should define env names now even if some are unused until later.

### Root-level concepts

These do not necessarily need a root `.env`, but they should be documented:

- client runs on one local port
- server runs on one local port
- Discord app credentials live on the server side

### Client `.env.example`

Recommended variables:

```env
VITE_API_BASE_URL=http://localhost:3001
VITE_DISCORD_CLIENT_ID=your_discord_application_id
```

### Server `.env.example`

Recommended variables:

```env
PORT=3001
CLIENT_URL=http://localhost:5173
DISCORD_CLIENT_ID=your_discord_application_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_REDIRECT_URI=https://127.0.0.1
```

Why define these now:

- `VITE_DISCORD_CLIENT_ID` will be needed in Phase 1.
- `DISCORD_CLIENT_SECRET` and `DISCORD_REDIRECT_URI` will be needed in Phase 2.
- `VITE_API_BASE_URL` and `CLIENT_URL` keep client/server connection explicit.

## What The UI Should Show In Phase 0

The frontend does not need Discord features yet.

It should show:

- project title
- frontend status
- backend health status
- placeholder text for future Discord SDK state
- placeholder text for future auth state

This gives us a visible sanity check before any Discord integration begins.

## What The Server Should Expose In Phase 0

Minimum endpoints:

- `GET /health`

Recommended response:

```json
{
  "ok": true,
  "service": "discord-test-farding-server"
}
```

Optional later endpoint placeholders:

- `POST /api/token`

In Phase 0, this does not need to work yet. It only needs an obvious home in the codebase.

## Scripts To Prepare

At minimum, we want:

- root `dev` to run client and server together
- root `build` to build both apps
- per-app `dev` scripts
- per-app `build` scripts

Suggested script behavior:

- root `dev` starts both services in parallel
- client `dev` runs Vite
- server `dev` runs the TypeScript server with watch mode

## Files Phase 0 Should Create

This is the minimum useful file set:

- `package.json` at repo root
- `.gitignore`
- `README.md`
- `client/package.json`
- `client/tsconfig.json`
- `client/vite.config.ts`
- `client/.env.example`
- `client/index.html`
- `client/src/main.tsx`
- `client/src/App.tsx`
- `client/src/styles.css`
- `client/src/lib/api.ts`
- `client/src/lib/env.ts`
- `server/package.json`
- `server/tsconfig.json`
- `server/.env.example`
- `server/src/index.ts`
- `server/src/app.ts`
- `server/src/routes/health.ts`
- `server/src/routes/auth.ts`
- `server/src/lib/env.ts`
- `server/src/lib/discord.ts`

## What We Should Not Do In Phase 0

Avoid these until the next phases:

- installing and wiring the Discord SDK
- implementing `authorize()`
- exchanging OAuth codes for tokens
- rendering real user profile data
- implementing participant lists
- implementing the synced timer

That discipline matters. If Phase 0 starts including real Discord logic, we lose the point of the phased approach.

## Acceptance Criteria

Phase 0 is complete when all of these are true:

- the repo has the client/server structure above
- `npm install` works for the project setup we choose
- local dev scripts start both apps
- the frontend loads in a browser
- the frontend successfully reaches the backend health endpoint
- the README explains how to run the project locally
- env examples exist for both client and server
- the codebase has obvious placeholders for Phase 1 and Phase 2 work

## Immediate Next Task After Phase 0

The next implementation task should be:

Build Phase 1 by wiring `@discord/embedded-app-sdk`, calling `discordSdk.ready()`, and rendering an SDK-ready state inside the Activity.

That means Phase 0 should be considered good only if it makes that next step easy.

## Codex Implementation Prompt

This is the exact implementation prompt we should be able to hand to Codex after planning:

Set up Phase 0 for `Discord-Test-Farding` as a clean client/server TypeScript skeleton using `Vite + React` for the client and `Node + Express` for the server. Add root scripts to run both apps, create client and server `.env.example` files, add a backend `/health` endpoint, make the frontend show backend health status, and include placeholder files for future Discord SDK boot and auth code. Do not implement Discord SDK or OAuth logic yet.
