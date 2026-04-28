# Discord Test Farding Vision and Phases

## Goal

Build a brand-new Discord Activity from scratch with one main priority:

1. Discord authorization must work reliably.
2. Every participant in the Activity session should be able to see each participant's Discord display name and profile picture inside the Activity UI.
3. Every participant in the same Activity session should see the same synced timer.

This project should stay intentionally small. We are not trying to rebuild `sync sesh`. We are building the smallest clean Activity that proves the core Discord identity and shared-session behavior work.

## Product Vision

The app is a minimal Discord Activity that opens inside Discord and shows:

- A simple session header
- A list of everyone currently connected to the Activity
- Each person's Discord name
- Each person's Discord avatar
- A single shared timer for the session

The first working version should feel more like a technical proof than a polished product. If the identity display and synced timer both work, the app is successful.

## Success Criteria

The project is successful when all of these are true:

- A user can launch the Activity inside Discord.
- The Activity completes Discord auth without manual hacks.
- The Activity can identify the current user.
- The Activity can list connected participants in the current Activity instance.
- The UI displays participant names consistently.
- The UI displays participant avatars consistently.
- Two or more users in the same Activity session see the same shared timer value, allowing for normal network delay.
- When a user joins or leaves, the participant list updates correctly.

## Non-Goals

These are explicitly out of scope for the first build:

- Reusing code or architecture from `sync sesh`
- Fancy UI or animation
- Persistent accounts beyond Discord auth
- Database-backed history
- Chat
- Matchmaking
- Voice features
- Production hardening beyond what is needed to prove the concept

## Technical Direction

We should keep the architecture as small and explicit as possible:

- Frontend: Discord Activity web app
- Discord SDK: `@discord/embedded-app-sdk`
- Auth: Discord `authorize -> backend token exchange -> authenticate`
- Participant identity: Discord Activity participant APIs and events
- Shared timer sync: tiny realtime backend with WebSockets

## Core Decisions

### Identity Display

Inside the Activity UI, participant identity should come from the Discord Activity SDK participant data, not from trying to fetch every user's profile through OAuth.

Why:

- It is simpler.
- It is session-aware.
- It directly matches the people connected to the Activity instance.
- The SDK participant payload already includes the fields we care about for display.

### Auth

We still want real Discord auth because it is one of the main goals of this repo.

Why:

- It proves the Activity is correctly wired to Discord.
- It gives us a clean foundation for future features.
- It allows current-user identity checks and future Rich Presence updates.

### Synced Timer

The timer should come from shared server state, not from each client starting a local timer.

Why:

- A local timer can drift or start at different moments.
- Shared server state gives us one source of truth for the session start time.
- The implementation can stay small if we only sync one value: `sessionStartEpochMs`.

## Risks We Are Designing Around

- Discord auth can fail if redirect URIs, scopes, or backend token exchange are misconfigured.
- Activity networking is sandboxed and proxied, so external networking must follow Discord Activity rules.
- Participant list behavior may differ slightly across desktop, web, and mobile clients.
- Avatar rendering can fail if URL formatting is wrong or a user has no custom avatar.
- Shared timer behavior can become inconsistent if we do not define a stable session key.

## Proposed App Shape

### Screen 1

Single-screen Activity UI:

- App title
- Auth status
- Current user card
- Session timer
- Participants list
- Small debug panel during development

### Data Model

Minimal shared state:

- `sessionId`
- `sessionStartEpochMs`

Local client state:

- `authState`
- `currentUser`
- `participants`
- `connectionState`

## Phased Build Plan

Each phase should be small enough for Codex to implement and verify in one step.

### Phase 0: Repo Foundation

Goal:

Create a clean starter project and write down the basic project structure.

Deliverables:

- Initialize the repo
- Add a minimal frontend and backend structure
- Add environment variable examples
- Add a short README with local run steps

Done when:

- The project installs successfully
- The app can start locally without Discord-specific functionality yet

### Phase 1: Discord Activity Boot

Goal:

Get a bare Activity to load inside Discord and complete `discordSdk.ready()`.

Deliverables:

- Install and initialize `@discord/embedded-app-sdk`
- Render a simple "SDK ready" state in the UI
- Confirm the app launches inside Discord

Done when:

- The Activity opens inside Discord
- The UI confirms SDK readiness

### Phase 2: Discord Auth End-to-End

Goal:

Implement the clean authorization flow and authenticate the user successfully.

Deliverables:

- Frontend `authorize()` call
- Backend token exchange endpoint
- Frontend `authenticate()` call
- UI state for auth success and failure

Done when:

- A user can launch the Activity and authenticate successfully
- The app can display a basic current-user identity result from authenticated data

### Phase 3: Current User Profile Card

Goal:

Display the current user's Discord display name and avatar in the UI.

Deliverables:

- Resolve the best display name to show
- Format the current user's avatar URL correctly
- Render a current-user profile card

Done when:

- The current user sees their name and avatar in the Activity

### Phase 3.1: Auto-Start Discord Auth

Goal:

Start Discord authorization automatically when the Activity launches, while keeping the manual button as a fallback.

Deliverables:

- Trigger the existing auth flow once after the Discord SDK is ready
- Show a clear "connecting/authenticating" state during automatic auth
- Prevent repeated automatic auth attempts during one page load
- Keep the `Connect Discord` button available if auto-auth fails or the user cancels

Done when:

- A user can launch the Activity and be prompted to authorize without first clicking a button
- Successful auto-auth still displays the current user's name and avatar
- Failed or cancelled auto-auth leaves the user with a manual retry path

### Phase 3.2: Auth Hardening and Activity Cleanup

Goal:

Harden the proven auth flow before adding shared session presence.

Deliverables:

- Prevent duplicate auth attempts while auth is in progress or already complete
- Add a short retry cooldown after auth failures
- Keep Discord tokens in memory only
- Make the debug console collapsible so the main Activity UI has room
- Align local docs and examples with the working `127.0.0.1:5174` Cloudflare flow

Done when:

- Auto-auth cannot loop or spam token exchange
- Manual retry still works after failures
- Successful auth cannot trigger another OAuth request
- Local setup docs match the current development workflow

### Phase 3.3: Final Pre-Presence Auth Cleanup

Goal:

Close the last small auth and localhost cleanup gaps found in the pre-Phase-4 code review.

Deliverables:

- Add a synchronous in-flight auth lock so rapid clicks cannot enter auth before React state updates
- Align the local API fallback with the `127.0.0.1:5174` development setup
- Update the UI phase label to reflect the latest auth-hardening milestone

Done when:

- Auth cannot be double-started even within one render tick
- Local browser fallback uses `127.0.0.1:3001`
- The app is ready to move into participant/session work

### Phase 4: Session Participant List

Goal:

Display all currently connected session participants with names and avatars.

Deliverables:

- Call `getInstanceConnectedParticipants()`
- Subscribe to `ACTIVITY_INSTANCE_PARTICIPANTS_UPDATE`
- Render the participant list
- Handle join and leave updates cleanly

Done when:

- Multiple users in one Activity instance can see the same participant list
- The list updates when someone joins or leaves
- No WebSocket or synced timer logic has been added yet

### Phase 5: Shared Session Timer

Goal:

Make all users in the same session see the same timer.

Deliverables:

- Define a stable session identifier
- Add a tiny WebSocket server
- Store or create `sessionStartEpochMs`
- Broadcast the shared timer state to connected clients
- Render the synced timer in the UI

Done when:

- Two or more users in the same session see the same timer start point
- A later joiner sees the existing timer, not a fresh one

### Phase 6: Join/Leave Robustness

Goal:

Make the participant list and timer behavior resilient during normal session changes.

Deliverables:

- Reconnect handling
- Clear loading and disconnected states
- Safe handling for empty sessions
- No duplicate participant rendering

Done when:

- Refreshes, reconnects, and normal join/leave flows behave predictably

### Phase 7: Optional Rich Presence

Goal:

Optionally push a custom synced timer or status to each user's Discord profile presence.

Deliverables:

- Add `rpc.activities.write` scope
- Call `setActivity()`
- Set presence details and timestamps

Done when:

- The user's Discord profile shows custom Activity presence data

Note:

This is optional because it is separate from showing names and avatars inside the Activity UI.

## Recommended Implementation Order

We should implement phases in this order:

1. Phase 0
2. Phase 1
3. Phase 2
4. Phase 3
5. Phase 3.1
6. Phase 3.2
7. Phase 3.3
8. Phase 4
9. Phase 5
10. Phase 6
11. Phase 7

## Definition of "Small Enough for Codex"

A phase is small enough if:

- It has one clear technical goal
- It changes a limited part of the stack
- It has a visible success condition
- It can be tested right after implementation

If a phase starts to feel vague or broad, split it before implementing.

## First Build Target

The first meaningful milestone is:

"A Discord Activity that authenticates the current user, shows the current user's name and avatar, shows all connected participants' names and avatars, and displays one synced timer shared by the session."

That should be our north star for this repo.
