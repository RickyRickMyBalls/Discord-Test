# Agents

This file is the repo-level instruction sheet for Codex and other agents working in `Discord-Test-Farding`.

## Project Context

This repository is a small Discord Activity project built from scratch to prove three core behaviors:

- Discord authorization works end to end
- Discord user identity can be shown cleanly in the Activity UI
- session state can later be shared across all participants

The stack is:

- `client/`: `Vite + React + TypeScript`
- `server/`: `Node + Express + TypeScript`
- deployment target: one Render Web Service

## Default Workflow

- Read the relevant docs in `Docs/` before changing code for a new phase.
- Keep changes scoped to the current phase or debugging task.
- Prefer existing project patterns over adding new abstractions.
- Do not touch unrelated files or revert user work.
- If the user is debugging a live Discord/Render issue, prioritize observability and the smallest safe fix.

## Phase Rule

This repo is being built in small phases. Respect those boundaries.

Current planning docs:

- `Docs/vision-and-phases.md`
- `Docs/phase-0-implementation-plan.md`
- `Docs/phase-1-implementation-plan.md`
- `Docs/phase-2-implementation-plan.md`
- `Docs/phase-3-implementation-plan.md`

When implementing a phase:

- finish the current phase cleanly before starting the next
- do not mix participant list logic into current-user work
- do not mix timer logic into auth or profile work
- do not skip verification when a phase changes runtime behavior

## Current Architecture Rule

The current production shape is one Render service.

That means:

- Express must serve `client/dist`
- `/api/*` routes must remain server-handled
- Activity frontend requests inside Discord should prefer same-origin paths
- Render config and Discord URL mappings are part of the effective runtime behavior

When debugging Discord Activity networking:

- consider Discord URL mappings and proxy behavior first
- consider Render env and deployment state second
- consider frontend fetch paths third
- add logging before guessing if the route path is unclear

## Changelog Rule

If an agent makes code changes, it must update `CHANGELOG.md` in the same turn.

The changelog in this repo is intentionally lightweight:

- append to the current date section if the work fits
- add a new dated section if needed
- summarize what changed in plain English
- mention debugging direction when the work is diagnostic

Docs-only changes do not require a changelog update unless the docs affect project workflow or the user asks for it.

## Verification Rule

For implementation work, run the narrowest useful verification command.

Default verification for normal app changes:

```powershell
npm.cmd run build
```

For deployment or runtime routing changes, also prefer a targeted smoke test when practical, such as:

- hit `/health`
- hit `/`
- confirm expected HTML or JSON shape

If verification is skipped or blocked, say why in the final response.

## Render Rule

When changing deployment-sensitive code:

- assume Render builds from the repo root
- keep `Root Directory` blank unless the user explicitly changes hosting strategy
- preserve compatibility with:
  - build command: `npm install; npm run build`
  - start command: `node server/dist/index.js`

Do not silently introduce a new deployment model without telling the user.

## Discord Activity Rule

When changing embedded auth or networking behavior:

- be careful with absolute URLs versus same-origin relative URLs
- remember Discord Activity requests go through Discord proxy behavior
- do not assume browser behavior outside Discord matches embedded behavior
- if OAuth or proxy behavior is unclear, add server request logging before broad refactors

## Files To Treat Carefully

- `client/src/discord/*`
  These files define SDK boot, auth, and Discord-specific client behavior.

- `server/src/app.ts`
  This controls route order, static hosting, and request logging.

- `server/src/routes/auth.ts`
  This is the critical auth exchange endpoint.

- `CHANGELOG.md`
  Keep it current whenever code changes land.

- `Docs/*`
  These are the planning source of truth for phase boundaries.

## What Not To Do

- Do not reintroduce `sync sesh` assumptions or architecture into this repo.
- Do not add participant session logic before the user asks for Phase 4 work.
- Do not add synced timer state before the user asks for that phase.
- Do not expose secrets in client code or logs.
- Do not remove diagnostic logging during an active production debugging thread unless replaced with something equally useful.
