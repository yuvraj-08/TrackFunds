# TrackFunds Backend Session Handoff

## Session Date

2026-03-07

## Purpose of This Document

This document records what was completed in the current backend session,
what decisions were made, what is now implemented, what was validated,
and what should be done next.

---

## Product Direction Confirmed in This Session

- The product remains mobile-first.
- Current implementation focus is backend-first.
- Web exists only as monorepo support and future expansion, not as the
  primary product surface.
- `account owner` means the user who created the account record.
- `account owner` is not the same as a system admin.
- Other participants can be given account-level permissions by the
  account owner.
- Debt tracking is a derived view from ledger data, not a separate
  manual feature.

---

## Monorepo / Repo State Confirmed

- The repo is being used as a monorepo starter kit.
- Branding was aligned to `TrackFunds`.
- The branch was renamed to `main`.
- The current backend stack uses:
  - NestJS for API
  - PostgreSQL for database
  - Drizzle ORM + `drizzle-kit`
  - pnpm workspaces + Turborepo

---

## Backend Architecture Direction Chosen

- Backend-first development was explicitly chosen before mobile UI work.
- Existing `backend` direction was reshaped into `apps/api`.
- Prisma was removed from the active backend plan.
- Drizzle was adopted instead of Prisma.

Reasoning:

- The difficult part of this product is ledger correctness, not UI.
- Mobile and future web will both depend on the same API and domain
  rules.
- A stable backend contract is needed before app screens are worth
  building.

---

## Environment Handling Completed

- Root `.env` support was wired.
- `apps/api/.env` support was also wired.
- App-level `.env` overrides root values when both exist.
- Prisma-style manual shell env setup is no longer required to run the
  API.
- `.env.example` was expanded to document the backend env shape.

Current documented env keys:

- `NEXT_PUBLIC_APP_NAME`
- `APP_BASE_URL`
- `PORT`
- `API_PREFIX`
- `CORS_ORIGIN`
- `DATABASE_URL`
- `JWT_SECRET`
- `THROTTLE_TTL`
- `THROTTLE_LIMIT`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `SMTP_SECURE`

---

## Database Work Completed

The Drizzle database package is now the active persistence layer.

Core schema present:

- `users`
- `accounts`
- `account_participants`
- `transactions`
- `password_reset_tokens`
- `refresh_tokens`

Migrations created in this session:

- [0001_needy_redwing.sql](/D:/SideKicks/TrackFunds/packages/database/drizzle/0001_needy_redwing.sql)
  - added password reset token storage
- [0002_daffy_stingray.sql](/D:/SideKicks/TrackFunds/packages/database/drizzle/0002_daffy_stingray.sql)
  - added refresh token session storage

Database actions completed:

- `pnpm db:generate`
- `pnpm db:migrate`
- migrations were applied successfully against the configured real
  database

---

## Auth / Session Work Completed

Implemented auth endpoints:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/logout-all`

Auth behavior now includes:

- password hashing with `scrypt`
- JWT access token issuance
- opaque refresh token issuance
- refresh token persistence in DB
- refresh token rotation
- logout for one session
- logout for all sessions
- password reset token issuance and consumption
- revocation of all refresh sessions on password reset

Important auth hardening completed:

- duplicate email registration now returns a clean conflict error
- refresh token rotation was audited and fixed to be atomic enough for
  practical use
- plaintext reset token logging was removed
- forgot-password in `production` now fails safely if SMTP is not
  configured

---

## Mail / Password Reset Work Completed

A mailer module was added.

Current behavior:

- If SMTP is configured, forgot-password sends an email.
- If SMTP is not configured in non-production, the backend does not
  email and reports `log-only`.
- In non-production, the forgot-password response includes:
  - `resetToken`
  - `resetUrl`
- In production, the raw reset token is not exposed in API responses.

Current limitation:

- There is no queue/retry infrastructure yet.
- Email delivery is direct and synchronous.

---

## Security / Hardening Completed

Security additions completed:

- global JWT auth guard
- global throttling guard
- Helmet integration
- CORS configuration via env
- global exception formatting
- request validation with `ValidationPipe`

Notes:

- `health` is public
- Swagger bearer auth is enabled
- public routes remain intentionally public:
  - auth register/login/forgot-password/reset-password/refresh/logout
  - health

---

## Accounts Module Work Completed

Implemented endpoints:

- `POST /api/v1/accounts`
- `GET /api/v1/accounts`
- `GET /api/v1/accounts/:accountId`
- `PATCH /api/v1/accounts/:accountId`
- `DELETE /api/v1/accounts/:accountId`
- `POST /api/v1/accounts/:accountId/participants`
- `GET /api/v1/accounts/:accountId/participants`
- `PATCH /api/v1/accounts/:accountId/participants/:participantId`
- `DELETE /api/v1/accounts/:accountId/participants/:participantId`
- `GET /api/v1/accounts/:accountId/ownership`
- `GET /api/v1/accounts/:accountId/debts`

Behavior implemented:

- account creator becomes the owner user
- account creator is auto-added as the first full-permission participant
- only visible accounts are listed for the current user
- account updates/deletes are owner-restricted
- participant management is permission-restricted
- account owner participant cannot be modified or removed
- invalid permission combinations are rejected
  - example: hidden participant with action permissions

List improvements:

- account listing now supports pagination
- account listing now supports name search

---

## Transactions Module Work Completed

Implemented endpoints:

- `POST /api/v1/accounts/:accountId/transactions`
- `GET /api/v1/accounts/:accountId/transactions`
- `GET /api/v1/accounts/:accountId/transactions/:transactionId`
- `PATCH /api/v1/accounts/:accountId/transactions/:transactionId`
- `DELETE /api/v1/accounts/:accountId/transactions/:transactionId`

Behavior implemented:

- transaction creation records:
  - account
  - owner user
  - spent-by user
  - recorded-by user
  - source
  - occurred at
- transaction list is visibility-protected
- transaction update is permission-protected
- transaction delete is permission-protected
- amount must be greater than zero
- update flow now enforces the same participant visibility rule as
  create flow

List improvements:

- transaction listing now supports pagination
- transaction listing now supports filters:
  - type
  - owner user
  - spent-by user

Derived views implemented:

- ownership summary
- debt summary

---

## Users / Supporting Work Completed

- insecure public `POST /users` route was removed from the controller
- user listing remains available as an authenticated route
- shared services and package references were adjusted so API build and
  typecheck consistently resolve internal workspace packages

---

## Review / Audit Work Completed

A manual backend audit was performed after implementation.

Issues found and fixed during the audit:

- refresh-token rotation race risk
- missing visibility enforcement in transaction update
- password-reset token leakage to logs when SMTP was missing

Current position after audit:

- backend is in a strong commit-worthy state
- backend is ready for Swagger testing
- backend is not claimed to be mathematically or operationally perfect
  until real request testing is done

---

## Validation Completed

Commands confirmed successfully in this session:

- `pnpm --filter api lint`
- `pnpm --filter api typecheck`
- `pnpm --filter api build`
- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm check`

Note:

- Full monorepo build passes.
- Earlier Windows sandbox `spawn EPERM` behavior for Next.js was worked
  around by rerunning the full build outside the sandbox when needed.

---

## How To Test Now

1. Run `pnpm.cmd dev:api`
2. Open `http://localhost:4000/docs`
3. Use auth register or login
4. Click Swagger `Authorize`
5. Test:
   - accounts
   - participants
   - transactions
   - ownership
   - debts
   - forgot password
   - reset password
   - refresh
   - logout
   - logout-all

Suggested Swagger sequence:

1. Register user A
2. Register user B
3. Login as user A
4. Create account
5. Add user B as participant
6. Add deposit and withdrawal transactions
7. Verify ownership and debt summaries
8. Test refresh/logout flow
9. Test forgot/reset password flow

---

## What Still Remains After This Session

These items were not claimed as complete:

- automated backend tests
- audit/activity history
- more advanced financial invariants and edge-case rules
- repayment-specific product flows if required by final business rules
- structured observability/logging stack
- queued email delivery / retries
- deeper RBAC beyond current account permissions

These are future improvements, not blockers for the current Swagger
testing phase.

---

## Recommended Next Step

Next immediate step:

- perform a real Swagger test pass and note every mismatch between the
  implemented backend behavior and expected app behavior

After Swagger testing:

- refine domain rules based on actual usage
- then start the mobile app against the stabilized API

---

## Suggested Commit Context

Commit message suggested during this session:

`feat: complete TrackFunds backend auth, ledger, and API hardening`
