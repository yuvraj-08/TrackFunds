# TrackFunds Starter

Reusable monorepo starter for product work that needs a web app now and room to grow into more surfaces later.

## Included Today

- `apps/web`: Next.js App Router web application
- `packages/config`: shared ESLint, Prettier, and TypeScript configuration
- `packages/types`: shared domain types
- `packages/utils`: shared utility functions
- `packages/ui-web`: shared React components for the web app

## Why This Shape

- `pnpm` workspaces keep dependency management simple and fast.
- Turborepo provides task orchestration and build ordering between apps and packages.
- The web app already consumes shared workspace packages, so adding future apps does not require restructuring later.

## Commands

- `pnpm dev:web`: run the web app locally
- `pnpm build`: build all packages and apps
- `pnpm lint`: lint all workspaces with configured tasks
- `pnpm typecheck`: run TypeScript checks across the workspace
- `pnpm format`: format the repo with Prettier

## Future Expansion

When you add `apps/backend`, `apps/mobile`, or `apps/desktop`, keep them as new workspace packages instead of placeholder folders. That keeps the starter honest: if it exists in the repo, it should build or be documented.
