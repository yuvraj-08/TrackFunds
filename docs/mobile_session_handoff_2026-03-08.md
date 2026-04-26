# TrackFunds Mobile Session Handoff

## Session Date

2026-03-08

## Purpose

This document records the mobile-app decisions finalized in this
session, what was already done in the repo, what is still pending, and
the exact plan to resume Expo app implementation safely in the next
session.

---

## Product / UX Decisions Finalized

These decisions were explicitly confirmed before starting the Expo app:

- The product remains **mobile-first**.
- The backend is already deployed and should be used directly.
- We are **not** using a local API override for mobile.
- API base should point to the deployed Render backend:
  - `https://trackfunds.onrender.com`
- Auth for V1 is:
  - email + password
- Reset password flow for V1 should stay **inside the app**.
- The user asked for something “OTP-like”, but current backend behavior
  is still **token-based**, not OTP-based.
- Unauthorized actions in the app should be **hidden**, not shown as
  disabled.
- Deposits and withdrawals should be **separate flows**.
- Debt / ownership should be shown as **separate cards/views**.
- Offline mode is **not** in V1.
- SMS reading/import is a **later phase** feature.
- First release scope should include:
  - auth
  - accounts
  - full account CRUD
  - permissions-aware behavior
  - participants management
  - transactions
  - ownership summary
  - debt summary

---

## Hosting / API State Confirmed

The backend is live on Render and confirmed working.

Confirmed working:

- health endpoint
- Swagger
- database connectivity

Observed successful health response:

```json
{
  "status": "ok",
  "service": "trackfunds-api",
  "database": "connected",
  "timestamp": "2026-03-07T19:22:50.888Z"
}
```

Important reminder for mobile:

- API base URL should be:
  - `https://trackfunds.onrender.com`
- Not:
  - `https://trackfunds.onrender.com/api/v1/health`

---

## Web Search / Verification Done Before Mobile Decisions

The user explicitly asked that unclear or version-sensitive decisions
must be verified on the web first.

That rule was followed for mobile setup direction.

Verified direction:

- use official Expo current guidance
- Expo Router is the right navigation/auth structure
- `EXPO_PUBLIC_` env vars are the correct config path
- `expo-secure-store` is the right token persistence choice

Reason for this direction:

- it matches current official Expo guidance
- it fits a modern Expo Router app
- it works cleanly with a deployed REST backend

---

## What Was Actually Done In The Repo

### 1. Expo app scaffold was created

`apps/mobile` was scaffolded using the official Expo template via
`create-expo-app`.

What exists now in `apps/mobile`:

- Expo app folder structure
- Expo Router starter app
- TypeScript config
- starter assets
- starter components/hooks
- default Expo scripts

### 2. Automatic dependency install failed during scaffold

`create-expo-app` created the app successfully, but its automatic
`pnpm install` step failed because pnpm refused a non-interactive module
directory cleanup.

Important:

- scaffold itself succeeded
- dependency installation was then handled manually afterward

### 3. Workspace install was completed manually

The workspace dependencies were installed successfully with:

- `pnpm install --no-frozen-lockfile`

This updated the workspace lockfile and made `apps/mobile` usable.

### 4. Secure token storage dependency was added

Added:

- `expo-secure-store`

Reason:

- auth session persistence for access/refresh tokens

### 5. Existing mobile app was inspected

Current generated mobile template state was inspected:

- `apps/mobile/app/_layout.tsx`
- `apps/mobile/app/(tabs)/...`
- `apps/mobile/package.json`
- `apps/mobile/app.json`
- `apps/mobile/tsconfig.json`

Result:

- the template is still mostly default Expo starter content
- the real TrackFunds mobile screens were **not** implemented yet

---

## Important Technical Observation Before Resuming

There is one important mismatch between the desired mobile UX and the
current backend behavior:

### Reset password

Desired mobile direction:

- in-app reset password flow

Current backend behavior:

- token-based reset
- production API does **not** expose the raw reset token in response
- current email text sends a reset URL, not a clean OTP code

Implication:

- if the app wants a clean in-app reset experience, backend likely needs
  one of these improvements:

Option A:

- include the reset token explicitly in the email body so the user can
  copy it into the app

Option B:

- change backend reset to a shorter OTP-style flow

Current best practical path:

- start with token-entry in app
- optionally improve backend email content during mobile implementation

---

## Exact Implementation Plan For Next Session

This was the working implementation plan at the moment the session was
paused.

### Step 1. App foundation

Create the mobile app foundation around the deployed backend:

- session context/provider
- token persistence with `expo-secure-store`
- API client helper
- access token + refresh token handling
- app boot restore from storage

### Step 2. Routing / auth structure

Replace the starter Expo tabs with real TrackFunds routing:

- `app/index.tsx`
- `app/(auth)/...`
- `app/(app)/...`

Expected auth screens:

- login
- register
- forgot password
- reset password

Protected app structure:

- route guard based on stored session
- redirect unauthenticated users to auth flow

### Step 3. Accounts flow

Implement accounts using live backend endpoints:

- accounts list
- create account
- edit account
- delete account
- account detail

Behavior requirements:

- only show actions user is allowed to perform
- owner-only actions should stay hidden for non-owner users

### Step 4. Participants flow

Implement participants management:

- list participants
- add participant
- update participant permissions
- remove participant

Behavior requirements:

- hide participant-management actions unless allowed

### Step 5. Transactions flow

Implement separate flows:

- add deposit
- add withdrawal
- edit transaction
- delete transaction

Behavior requirements:

- deposits and withdrawals must feel like distinct actions
- permissions must be respected in UI

### Step 6. Derived views

Implement:

- ownership summary section/cards
- debt summary section/cards

### Step 7. Validation / repo integration

After implementation:

- run mobile lint
- run mobile typecheck
- add `dev:mobile` root script if needed
- add mobile env example
- update app branding from generic Expo defaults to TrackFunds

---

## Proposed Mobile Route Structure

This was the intended route direction before the session paused:

```text
app/
  _layout.tsx
  index.tsx
  (auth)/
    _layout.tsx
    login.tsx
    register.tsx
    forgot-password.tsx
    reset-password.tsx
  (app)/
    _layout.tsx
    accounts/
      index.tsx
      create.tsx
      [accountId]/
        index.tsx
        edit.tsx
        participants.tsx
        transactions/
          deposit.tsx
          withdrawal.tsx
          [transactionId].tsx
```

This is not yet implemented. It is the intended next-step layout.

---

## Proposed Internal Mobile Structure

Planned supporting files:

```text
apps/mobile/src/
  components/
  constants/
  hooks/
  lib/
  providers/
```

Expected responsibilities:

- `components/`
  - reusable UI pieces
- `constants/`
  - color/theme values
- `hooks/`
  - session hook(s)
- `lib/`
  - API client
  - env/config
  - secure storage
- `providers/`
  - session provider

---

## Proposed UI Direction

Planned UI direction for the mobile app:

- clean but not generic
- warm/off-white background
- strong green/earth accent palette
- intentional cards for sections
- clear separation between deposit and withdrawal actions
- permissions reflected by hiding actions completely

This was not implemented yet. It remains the intended visual direction.

---

## Current Repo State At Pause

What is true right now:

- `apps/mobile` exists
- Expo scaffold exists
- dependencies are installed
- `expo-secure-store` was added
- backend is deployed and usable
- real TrackFunds mobile auth, account, participant, and transaction routes now exist
- session provider is implemented
- mobile API layer is implemented against the deployed Render backend
- Expo Router routes are customized and protected

This means the next session should **resume from scaffolded Expo app +
installed dependencies**, not from a blank mobile folder.

---

## Suggested First Task For Next Session

Resume with:

1. remove the default Expo starter tab routes
2. create session provider + API client
3. wire auth routes and protected app layout

That is the correct first implementation slice before building account
CRUD and ledger screens.

---

## Short Resume Prompt For Next Session

If needed, the next session can be resumed with a prompt like:

`Continue implementing the Expo app from the current scaffold. Use docs/mobile_session_handoff_2026-03-08.md as the handoff. Start with session provider, API client, protected Expo Router auth flow, then accounts screens against the deployed Render backend.`

---

## Session Continuation

### Session Date

2026-03-09

### What Was Completed

- mobile linting was stabilized by replacing `expo lint` with a direct
  flat ESLint config in `apps/mobile/eslint.config.js`
- `apps/mobile/package.json` now runs lint with plain `eslint`
- mobile lint now passes
- mobile typecheck now passes
- participant adding was improved to use a proper user picker instead of
  manual raw user ID entry
- transaction detail route is no longer a placeholder
- transaction detail now supports:
  - loading a single transaction
  - editing amount, owner, spender, and note
  - delete action
  - hiding edit/delete actions when permissions do not allow them
- account detail screen was improved to:
  - use the shared `AppScreen` shell
  - show a clean open-transaction action for each ledger entry
  - remove the earlier encoding artifacts in copy
- mobile API client now includes:
  - `getTransaction(accountId, transactionId)`

### Validation Completed

- `pnpm --filter mobile lint`
- `pnpm --filter mobile typecheck`

Both are passing.

### Repo-Level Note

Running root workspace validation after the mobile changes exposed two
issues outside the mobile app:

- `pnpm lint` currently fails in `apps/web` because ESLint hits a
  Windows `EPERM` read on a hoisted dependency in `node_modules`
- `pnpm typecheck` currently fails in `packages/database` because
  Drizzle module resolution is not currently healthy there

These are not caused by the new mobile work, but they do mean the whole
monorepo should not be treated as globally green until those two package
issues are rechecked.

### Actual Mobile State Now

Implemented routes now include:

- `/(auth)/login`
- `/(auth)/register`
- `/(auth)/forgot-password`
- `/(auth)/reset-password`
- `/(app)/accounts`
- `/(app)/accounts/create`
- `/(app)/accounts/[accountId]`
- `/(app)/accounts/[accountId]/edit`
- `/(app)/accounts/[accountId]/participants`
- `/(app)/accounts/[accountId]/transactions/deposit`
- `/(app)/accounts/[accountId]/transactions/withdrawal`
- `/(app)/accounts/[accountId]/transactions/[transactionId]`

Supporting mobile foundation already exists for:

- session restore
- secure token persistence
- refresh-token handling
- API client
- reusable buttons/cards/forms

### What Is Still Pending

The app is no longer at scaffold stage, but a few real product tasks are
still pending:

- test the mobile app against the live Render backend in Expo runtime
- verify full auth flows on-device
- improve forgot/reset UX if token entry feels too rough
- decide whether to add inline loading/skeleton states in more screens
- improve participant management UX further if needed
- add any remaining screen polish after real usage testing

### Recommended Next Task

Next session should start with a real Expo runtime check:

1. run the mobile app
2. sign up / sign in against the deployed API
3. create an account
4. add a participant
5. create deposit and withdrawal entries
6. open a transaction and test edit/delete
7. fix any runtime/API mismatches exposed by real device testing

---

## Session Continuation

### Session Date

2026-03-09 (later pass)

### Mobile UX Issues Addressed

The following issues from early device testing were handled in this
pass:

- auth screens are now centered more intentionally
- password fields now support eye-toggle visibility
- register placeholder display name was changed from `Yuvraj` to
  `John Doe`
- create-account action now uses loading/disabled button behavior
- mobile color direction moved away from green
- a real bottom tab navigation now exists

### New App Shell

Protected app navigation now includes bottom tabs:

- Home
- Accounts
- My Profile
- More

Home now acts as the first signed-in landing screen instead of dropping
the user directly into the old all-in-one accounts page.

### Invite Flow Correction

The old participant flow exposed global users, which is not acceptable
for the intended product behavior.

That wrong UX has been removed from the mobile app.

Current state:

- current participants can still be viewed and managed
- global user browsing is no longer shown
- invite-based participant onboarding is now the intended replacement
- backend support is still required for the real invite flow

### Technical Changes Added

- tab layout added under `app/(app)/(tabs)`
- shared accounts list screen extracted to `src/screens/accounts-screen.tsx`
- `PrimaryButton` now supports:
  - loading
  - disabled
- `FormField` now supports password visibility toggling
- auth redirects now land on the new Home tab
- mobile `tsconfig.json` now pins explicit type packages to avoid the
  temporary install artifact issue encountered during typecheck

### Validation Completed After These Fixes

- `pnpm --filter mobile lint`
- `pnpm --filter mobile typecheck`

Both are passing again after the tab/navigation changes.

### Latest Hotfix

After further device testing, shared app-screen safe area handling was
fixed to include both top and bottom insets:

- `AppScreen` now uses:
  - `edges={['top', 'bottom', 'left', 'right']}`

This prevents headers from hiding under the status/notification bar and
also keeps bottom content clear of device insets.

Validation rechecked after this hotfix:

- `pnpm --filter mobile lint`
- `pnpm --filter mobile typecheck`

### Home Stats Upgrade

The Home tab was upgraded with live metric cards sourced from backend
data, including refresh support.

Current Home card metrics:

- accounts
- participants (distinct)
- ledger entries in the last 30 days
- open debts

These stats are now computed from:

- `listAccounts`
- per-account `listTransactions`
- per-account `getDebts`

Validation rechecked after this upgrade:

- `pnpm --filter mobile lint`
- `pnpm --filter mobile typecheck`
