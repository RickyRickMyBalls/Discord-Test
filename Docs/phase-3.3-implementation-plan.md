# Phase 3.3 Implementation Plan

## Purpose

Phase 3.3 is the final pre-Phase-4 cleanup from the code review.

Phase 3.2 added state-based guards, but React state updates are asynchronous. A very fast duplicate click can still enter the auth handler before the UI re-renders into an in-progress state. Phase 3.3 adds a synchronous ref lock so duplicate OAuth/token exchange calls are blocked immediately.

## What Phase 3.3 Accomplishes

- Adds an `authAttemptInFlightRef` lock around `authorizeAndAuthenticate()`.
- Clears the lock in `finally` so failures and cancellations can retry after cooldown.
- Keeps the existing authenticated/in-progress/cooldown checks.
- Changes the local API fallback from `localhost:3001` to `127.0.0.1:3001`.
- Updates the hero label from Phase 3.1 to Phase 3.3.

## What Phase 3.3 Is Not

Do not add:

- participant list rendering
- WebSockets
- timer sync
- new Discord scopes
- persistent token storage

## Acceptance Criteria

- Duplicate auth calls are blocked synchronously.
- Auth lock is released after success, failure, or cancellation.
- Successful auth still disables the button as `Connected`.
- Failed auth still uses the 5 second retry cooldown.
- Client and server builds pass.
