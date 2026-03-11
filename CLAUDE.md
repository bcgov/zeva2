# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands are run from the `next/` directory unless noted.

```bash
# Development
npm run dev           # Start Next.js dev server (Turbopack)
npm run bullmqDev     # Start BullMQ workers (run alongside dev server)

# Build & Production
npm run build
npm run start
npm run bullmq        # Start BullMQ workers in production

# Linting & Formatting
npm run lint          # ESLint
# Prettier auto-formats on save; run manually via: npx prettier --write .

# Testing
npm test                                  # Run all Jest tests
npm test -- path/to/test.spec.ts         # Run a single test file
npm test -- --watch                       # Watch mode

# Database
npm run generate-prisma-client            # Regenerate Prisma client after schema changes
npm run migrate-dev                       # Run Prisma migrations (dev)
npm run seed                              # Seed the database
npm run format-prisma-schema
```

## Architecture

This is a **Next.js 16 App Router** application for ZEVA 2 (Zero-Emission Vehicle Accountability), a BC government system. All application code lives in `next/`.

### Tech Stack
- **Framework**: Next.js 16 (App Router) with React 19, TypeScript 5
- **Auth**: Auth.js (NextAuth 5) with Keycloak provider (`next/auth.ts`, middleware at `next/proxy.ts`)
- **Database**: PostgreSQL 17 via Prisma 7 (`next/prisma/`). Prisma client generated to `next/prisma/generated/`. Separate read-only connection to legacy ZEVA DB via `next/prismaOld/` and `next/lib/prismaOld.ts`.
- **Job Queue**: BullMQ 5 with Redis 7 (`next/bullmq/`). Workers handle email notifications, ICBC file ingestion, and scheduled tasks.
- **Storage**: S3-compatible (AWS SDK); Minio used locally.
- **Styling**: Tailwind CSS 3 with BC government design tokens (primary blue/gold palette defined in `next/tailwind.config.ts`)

### Code Organization Pattern

Each feature lives in `next/app/[feature]/` and follows this internal structure:

```
[feature]/
  page.tsx            # Server component (entry point)
  lib/
    data.ts           # DB queries (server-only, uses Prisma)
    actions.ts        # Server actions (mutations)
    components/       # UI components for this feature
    utils/            # Feature-specific utilities
```

Shared cross-feature code lives in:
- `next/lib/data/` — shared DB queries
- `next/lib/utils/` — shared utilities
- `next/lib/prisma.ts` — Prisma client singleton

### Data Flow
1. Server components call `lib/data.ts` functions to fetch data from Prisma
2. Client components call server actions in `lib/actions.ts` for mutations
3. BullMQ workers run as a separate process and communicate via Redis; the main app enqueues jobs
4. `next/instrumentation-node.ts` bootstraps S3 bucket creation and the job scheduler on server startup

### Authentication & Authorization
- Auth.js with Keycloak provider handles SSO
- Sessions are 8 hours; JWT callbacks enrich the token with user roles
- Route protection is handled by the middleware in `next/proxy.ts`
- Always verify session authorization close to the data-fetching layer (see `developer-guide.md`)

### Commit Convention
Commits must follow Conventional Commits (`feat:`, `fix:`, `ci:`, etc.) — enforced by commitlint via Husky. Semantic Release uses this for automated versioning.

### Local Dev Requirements
- Add `127.0.0.1 minio` to `/etc/hosts` (needed for presigned S3 URLs)
- Start infrastructure with `docker-compose up db redis minio` from repo root
- Set required env vars: `AUTH_SECRET`, `AUTH_KEYCLOAK_ID`, `AUTH_KEYCLOAK_ISSUER`, `DATABASE_URL`, `DATABASE_URL_OLD`, `REDIS_HOST`, `S3_BUCKET_NAME`, `S3_ENDPOINT`, `BEGINNING_OF_COMPLIANCE_YEAR`, `END_OF_COMPLIANCE_YEAR`
- Set `START_WORKERS=false` when running the Next.js server in dev (BullMQ runs separately via `npm run bullmqDev`)

See `developer-guide.md` for detailed explanations of each technology and patterns.
