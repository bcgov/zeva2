# ZEVA2 AI Coding Agent Instructions

## Project Overview

ZEVA2 (Zero Emission Vehicles Reporting System) is a full-stack Next.js 16 application with a PostgreSQL database, BullMQ job queue, and multi-tenant organization/role-based access control. The system tracks ZEV credits, vehicle compliance data, and credit transfers between suppliers and government.

## Architecture

### Tech Stack

- **Framework**: Next.js 16 (App Router, SSR)
- **Database**: PostgreSQL + Prisma 7.7 ORM with query optimization (`relationLoadStrategy: "join"`)
- **Auth**: Auth.js 5.0 (Keycloak provider for BCEID/IDIR)
- **Async Jobs**: BullMQ 5.73 + Redis (producer: Next.js, consumer: separate bullmq service)
- **Storage**: S3-compatible (Minio locally, AWS in production)
- **Styling**: Tailwind CSS 4.2

### Key Services

1. **Next.js app** (`next/`): Server components, API routes, auth callbacks, SSR
2. **BullMQ worker** (`next/bullmq/`): Async job handler (email, ICBC processing)
3. **Prisma** (`next/prisma/`): Two database configs—new schema and legacy migration schema
4. **Old ZEVA DB**: Read-only connection for data migration during seed

## Critical Patterns

### Authentication & Authorization

- **Always call `getUserInfo()`** in server components/actions that access protected data
  ```typescript
  const { userIsGov, userOrgId, userRoles } = await getUserInfo();
  ```
- Returns: `userId`, `userIsGov`, `userOrgId`, `userRoles`, `userOrgName`, `userIdToken`, `userName`
- Gov users have roles: `ADMINISTRATOR`, `DIRECTOR`, `ZEVA_IDIR_USER`, `ZEVA_IDIR_USER_READ_ONLY`
- Supplier users have roles: `ORGANIZATION_ADMINISTRATOR`, `SIGNING_AUTHORITY`, `ZEVA_BCEID_USER`
- **Authorization must be validated near data access**, not just in middleware
- Use `userIsGov` to mask sensitive names (show "Government of BC" instead of individual names in supplier views)

### Project Structure

Each feature (e.g., `vehicle-suppliers/`, `zev-unit-activities/`) follows:

```
feature/
├── page.tsx              # Page component
├── [id]/                 # Dynamic route
│   ├── page.tsx
│   └── layout.tsx
├── lib/
│   ├── data.ts           # Data fetching (always calls getUserInfo)
│   ├── actions.ts        # Server actions (use "use server")
│   ├── components/       # Client components
│   ├── services/         # Business logic
│   └── utils.ts          # Utilities
└── new/                  # Create form
    └── page.tsx
```

### Database Queries

- **Use `relationLoadStrategy: "join"`** (configured globally)—enabled in Prisma config
- **Avoid N+1**: Use `include` for related data, check logs for excessive queries
- Use `omit` to exclude sensitive fields (e.g., `idpSub` when returning users)
- Query logging is enabled in dev—monitor for performance
- Multiple Next.js/BullMQ instances may need manual connection pool sizing via env var

### Server Actions & Data Mutations

- Define in `actions.ts` with `"use server"` directive
- **Always validate auth inside the action**, not just in the component
- Arguments bound to actions are exposed to clients—don't pass sensitive context server-side only
- Pattern: fetch user info → validate role/org → execute mutation
  ```typescript
  export async function myAction(formData: FormData) {
    "use server";
    const { userOrgId, userRoles } = await getUserInfo();
    if (!userRoles.includes(Role.ORGANIZATION_ADMINISTRATOR)) return null;
    // mutate database...
  }
  ```

### BullMQ Async Jobs

- **Producer**: Server actions enqueue jobs (e.g., email notifications)
- **Consumer**: Separate `bullmq` service processes jobs with workers
- Job handlers in `bullmq/handlers/` (e.g., `email.ts`, `icbc.ts`)
- Job data types defined in handlers; queues configured in `bullmq/config.ts`
- Redis GUI (Redis Insight) useful for debugging job queues locally

### Database Schema & Enums

- Enums stored in Prisma schema (e.g., `Role`, `ModelYear`, `SupplierClass`, `ZevClass`)
- Enum strings are prefixed (e.g., `ModelYear.MY_2024` not `2024`)—Prisma doesn't allow numeric enum names
- `ModelYear` must be in ascending lexicographical AND logical order
- Generated enums at `prisma/generated/enums` and models at `prisma/generated/models`

### Data Seed & Migration

- Seed script at `prisma/seed.ts`—runs via `npm run seed` command
- Legacy data migration from zeva1: `prismaOld` connects to old DB, maps IDs to new schema
- Seed processes in `prisma/seedProcesses/` (organizations, users, volumes, vehicles, etc.)
- Uses Prisma transactions for consistency

## Conventions

### File Naming

- Client components: keep `.tsx` for server components, use clear separation with client-side logic
- Server files/utilities: name without suffix (e.g., `data.ts`, `services.ts`, not `server.ts`)
- Actions: `actions.ts` for server mutations

### Environment Variables

- `DATABASE_URL`: PostgreSQL connection string for new schema
- `DATABASE_URL_OLD`: Read-only connection to legacy ZEVA database
- `SEND_NOTIFICATION_EMAILS`: Set to `"true"` to enable email job processing
- `AUTH_KEYCLOAK_*`: Keycloak provider config
- `REDIS_*`: BullMQ/Redis connection
- `AWS_*` or local `MINIO_*`: S3 storage config
- Format: `postgresql://user:pass@host:5432/db?schema=public`

### Formatting & Linting

- Format code: `npm run format-prisma-schema` (Prisma) and `npx prettier --write .` (source)
- Lint: `npm run lint` (ESLint via Next.js)
- TypeScript: Install outside container for IDE intellisense (`npm install` in `/next/`)

## Typical Workflows

### Adding a new feature

1. Define database schema in `prisma/schema.prisma`
2. Run `npm run generate-prisma-client` to generate types
3. Create feature folder with structure above
4. Implement `lib/data.ts` calling `getUserInfo()` for auth
5. Write server actions in `lib/actions.ts`
6. Build UI in `lib/components/`
7. Test with Jest (`npm run test`)

### Debugging data access

1. Check dev logs: BullMQ and Prisma queries are logged
2. Use Redis Insight for job inspection
3. Call `getUserInfo()` in components to verify session/roles
4. Use `omit`/`select` to verify data shape matches expectations

### Handling multi-org data

- Always filter by `userOrgId` in queries
- Government users access all orgs; supplier users access only their own
- Mask government user identities in supplier-facing views
- Use role checks for fine-grained permissions (e.g., `SIGNING_AUTHORITY`)

## Key Files to Reference

- [auth.ts](../next/auth.ts): Auth setup, `getUserInfo()` export
- [app/layout.tsx](../next/app/layout.tsx): Root layout with auth check
- [prisma/schema.prisma](../next/prisma/schema.prisma): Full database schema
- [bullmq/config.ts](../next/bullmq/config.ts): Job queue configuration
- [lib/data/user.ts](../next/lib/data/user.ts): User lookup functions
- [app/administration/lib/data.ts](../next/app/administration/lib/data.ts): Example auth + data pattern
- [app/vehicle-suppliers/lib/actions.ts](../next/app/vehicle-suppliers/lib/actions.ts): Example server actions with validation

## Common Pitfalls

- **Forgetting `getUserInfo()` in data functions**: Auth bypass risk
- **Exposing `idpSub` in API responses**: Security issue—use `omit`
- **Not validating inside actions**: Client-side role checks are insufficient
- **N+1 queries**: Carefully use `include`; check dev logs
- **Missing org filtering**: Suppliers may access data from other orgs
- **Minio hostname**: Add `127.0.0.1 minio` to `/etc/hosts` for local presigned URLs to work
