# TrackFunds Starter

Reusable monorepo starter for product work that needs a web app now and room to grow into more surfaces later.

## Included Today

- `apps/api`: NestJS API foundation for backend-first development
- `apps/web`: Next.js App Router web application
- `packages/config`: shared ESLint, Prettier, and TypeScript configuration
- `packages/database`: Drizzle schema package for PostgreSQL and shared data access
- `packages/types`: shared domain types
- `packages/utils`: shared utility functions
- `packages/ui-web`: shared React components for the web app

## Why This Shape

- `pnpm` workspaces keep dependency management simple and fast.
- Turborepo provides task orchestration and build ordering between apps and packages.
- The web app already consumes shared workspace packages, so adding future apps does not require restructuring later.

## Commands

- `pnpm dev:api`: run the backend API locally
- `pnpm dev:web`: run the web app locally
- `pnpm build`: build all packages and apps
- `pnpm lint`: lint all workspaces with configured tasks
- `pnpm typecheck`: run TypeScript checks across the workspace
- `pnpm format`: format the repo with Prettier
- `pnpm db:generate`: generate SQL migrations from the shared Drizzle schema
- `pnpm db:migrate`: apply pending Drizzle migrations to PostgreSQL

## Environment Files

- Put shared local variables in the repo root `.env`.
- Put API-only overrides in `apps/api/.env` if needed.
- Put database-package overrides in `packages/database/.env` if needed.
- Package-level `.env` values override root `.env` values for that package.

## Future Expansion

When you add `apps/mobile` or `apps/desktop`, keep them as new workspace packages instead of placeholder folders. That keeps the starter honest: if it exists in the repo, it should build or be documented.
