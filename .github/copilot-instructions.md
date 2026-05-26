# Copilot Instructions for zeva2

## Project Overview

**zeva2** is a BC Government project replicating and modernizing the original ZEVA (Zero Emission Vehicle Rebate) system. It's a full-stack Next.js application with a PostgreSQL database, Redis queue system, and S3-compatible object storage.

Main areas:

- **home** — Dashboard and user home pages
- **zev-models** — ZEV model management
- **icbc** — Insurance Corporation of BC integration
- **compliance-reporting** — Compliance reporting features
- **administration** — Admin panel and user management
- **vehicle-suppliers** — Supplier management

## Quick Commands

### Development

```bash
cd next
npm run dev          # Start dev server with turbopack on port 3000
npm run bullmqDev    # Start background job worker in development mode
npm test             # Run Jest tests
npm run lint         # Run Next.js linter
npx prettier --write . # Format code
```

### Database

```bash
npm run generate-prisma-client    # Generate Prisma client
npm run format-prisma-schema      # Format schema.prisma
npm run migrate-dev               # Run Prisma migrations in development
npm run pull-old-db               # Pull schema from old zeva1 database
```

### Building & Deployment

```bash
npm run build        # Build Next.js production bundle
npm run start        # Start production server
npm run bullmq       # Start BullMQ worker in production mode
```

## Architecture & Key Conventions

### Project Structure

Each feature module in `app/` follows a consistent pattern:

```
app/[feature]/
├── page.tsx              # Page component
├── [dynamic]/[id]/       # Dynamic routes
└── lib/
    ├── data.ts          # Database queries (must use auth())
    ├── actions.ts       # Server actions ("use server")
    ├── components/      # Feature-specific components
    ├── services.ts      # Business logic
    ├── constants.ts     # Feature constants
    └── utils/           # Utilities
```

### Authentication with Auth.js

- **Auth provider**: Keycloak (next-auth)
- **Critical pattern**: All database reads must call `auth()` to get user info and condition access:

```typescript
import { getUserInfo } from "@/auth";

export const getSomeData = async () => {
  const { userIsGov, userOrgId } = await getUserInfo();
  // Verify user has access before querying database
  if (!userIsGov && !userOrgId) {
    return null;
  }
  return fetchFromDatabase(userOrgId);
};
```

- **Server actions**: Server actions (marked with `"use server"`) expose endpoints and must also verify `auth()` before processing
- **Middleware alone is insufficient**: Always check session as close to data fetching as possible, not just in middleware

### Prisma & Database

- **ORM**: Prisma with PostgreSQL adapter
- **Performance optimization**: `relationLoadStrategy: "join"` is configured globally in `prisma/schema.prisma` to improve query performance (see [Prisma performance guide](https://www.prisma.io/docs/orm/prisma-client/queries/query-optimization-performance))
- **Development workflow**: Uses `prisma db push` and `prisma db pull` during early development to avoid excess migrations; will transition to migrations later
- **Database logging**: Queries are logged during development — monitor for excessive queries or unnecessary data fetches
- **Multiple instances**: When running multiple `next` or `bullmq` service instances in production, manually set the Prisma connection pool size via environment variable (see [Prisma connection pooling](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections#recommended-connection-pool-size))
- **Old database**: `prismaOld/` contains the zeva1 schema for read-only access during migration; use `prisma generate --config prismaOld/prisma.config.ts` to generate the client

### Background Jobs with BullMQ

- **Queue system**: BullMQ + Redis for asynchronous job processing
- **Architecture**:
  - `next` service: Producer (enqueues jobs)
  - `bullmq` service: Consumer (processes jobs via worker specs)
- **Configuration**: See `next/bullmq/config.ts` for worker queue specs
- **Development**: Use `npm run bullmqDev` to run worker with hot reload
- **Monitoring**: Use Redis GUI tools like [Redis Insight](https://redis.io/insight/) to inspect queue messages

### Object Storage (S3)

- **Provider**: S3-compatible services (Minio locally, AWS S3 in production)
- **Local development**: Minio deployment requires `/etc/hosts` entry: `127.0.0.1 minio`
- **SDK**: AWS SDK v3 for S3 and presigned URLs

### Styling

- **Framework**: Tailwind CSS 4
- **Custom colors**: Defined in `next/tailwind.config.ts`
- **Formatting**: Prettier with Tailwind plugin (run `npx prettier --write .`)
- **Config**: `.prettierrc.json` and `postcss.config.mjs`

## TypeScript & Linting

- **TypeScript version**: 6.0
- **Strict mode enabled**: TypeScript runs in strict mode (`strict: true` in `tsconfig.json`)
- **Path alias**: Use `@/` to reference project root (e.g., `@/app/lib/data`)
- **Linter**: Next.js linter with Prettier plugin (`npm run lint`)
- **IDE**: Install TypeScript locally (`npm install` outside container) for VS Code IntelliSense

## Testing

- **Framework**: Jest
- **Coverage**: Enabled and output to `coverage/` directory
- **Command**: `npm test`
- **Note**: Coverage collection is currently configured; expand test coverage as needed

## Docker & Deployment

### Services (docker-compose.yml)

| Service  | Purpose               | Port      | Notes                     |
| -------- | --------------------- | --------- | ------------------------- |
| `db`     | PostgreSQL 17         | 5433      | Main application database |
| `redis`  | Redis cache/queue     | 6379      | BullMQ message broker     |
| `minio`  | S3-compatible storage | 9000/9001 | Local object storage      |
| `next`   | Next.js app server    | 3000      | Main application          |
| `bullmq` | Background worker     | —         | Job processor             |

### Build Steps

**For `next` service:**

1. Copy zeva2/next contents
2. Run `npm install`
3. Run `npx prisma generate && npx prisma generate --schema prisma/schemaOld.prisma`
4. Run `npm run build`
5. Expose port 3000
6. Set startup: `npm run start`

**For `bullmq` service:**

1. Copy zeva2/next contents
2. Run `npm install`
3. Run `npx prisma generate`
4. Set startup: `npm run bullmq`

### Deployment Checklist

- [ ] Run `npm run pushSchemaToDB` to create/update database tables (will be replaced with migrations)
- [ ] Set `DATABASE_URL`: `postgresql://{user}:{password}@{host}:{port}/{db}?schema={schema}`
- [ ] Set `DATABASE_URL_OLD` for read-only zeva1 access (may require network policy)
- [ ] Configure Prisma connection pool size for multiple instances
- [ ] Check environment variables in `docker-compose.yml` (AUTH**, DATABASE_URL*, CTHUB*_, S3\__)

## Key Environment Variables

- `AUTH_SECRET` — NextAuth session secret
- `AUTH_KEYCLOAK_*` — Keycloak provider configuration
- `DATABASE_URL` — PostgreSQL connection string
- `DATABASE_URL_OLD` — Legacy zeva database connection
- `START_WORKERS` — Enable/disable BullMQ worker in `next` container
- `TZ` — Timezone (set to `America/Vancouver`)
- `BEGINNING_OF_COMPLIANCE_YEAR`, `END_OF_COMPLIANCE_YEAR` — Compliance period dates
- S3 environment variables (see `s3.env`)

## Common Patterns & Tips

### Data Access Pattern

```typescript
// app/feature/lib/data.ts
import { auth } from "@/auth";
import { db } from "@/prisma/generated/client";

export const getFeatureData = async () => {
  const session = await auth();
  if (!session?.user?.id) return null;

  return db.model.findMany({
    where: { orgId: session.user.orgId }
    // Avoid N+1: specify relations needed
    include: { relatedData: true }
  });
};
```

### Server Action Pattern

```typescript
// app/feature/lib/actions.ts
"use server";

import { getUserInfo } from "@/auth";

export const updateFeature = async (id: string, data: unknown) => {
  const { userIsGov } = await getUserInfo();
  if (!userIsGov) {
    throw new Error("Unauthorized");
  }

  // Perform mutation
};
```

### Component Pattern

```typescript
// app/feature/page.tsx - Server component by default
import { getFeatureData } from "./lib/data";

export default async function Page() {
  const data = await getFeatureData();
  return <FeatureDisplay data={data} />;
}

// app/feature/lib/components/Interactive.tsx - Client component
"use client";

import { updateFeature } from "../actions";

export function InteractiveComponent() {
  // Client-side interactivity
}
```

### Watch for Performance Issues

- Check database logs during development for N+1 queries
- Use `include` and `select` in Prisma to fetch only needed relations
- Monitor BullMQ queues for job processing delays
- Profile Next.js build size with `npm run build`

## Version Info

- **Next.js**: 16.2
- **React**: 19
- **TypeScript**: 6.0
- **Node.js**: 22.13.1 (recommended for Docker)
- **Prisma**: 7.7
- **Auth.js**: 5.0.0-beta.30
- **Tailwind CSS**: 4.2

## Code Review Standards

When reviewing code or generating code for this project, always enforce these standards:

### Security (non-negotiable)

- Every database read **must** call `auth()` / `getUserInfo()` and gate access — middleware alone is insufficient.
- Every Server Action (`"use server"`) must verify the session before mutating data.
- API routes under `app/api/` must authenticate/authorise before processing requests.
- Never expose bound server-side arguments to client components without sanitisation.
- All user input must be validated (zod or equivalent) before use.
- Raw Prisma queries (`$queryRaw`, `$executeRaw`) must use parameterised placeholders.
- Environment variables must only be accessed server-side.

### Prisma / Database

- Avoid N+1 queries — use `include` or `select` with nested relations in a single query.
- Use `prisma.$transaction` when multiple writes must be atomic.
- Do not return more columns than needed — use `select` to limit the payload.

### Next.js App Router

- Default to Server Components; add `"use client"` only when interactivity or browser APIs are required.
- New route segments must have `loading.tsx` and `error.tsx` boundaries.
- Keep Server Actions in `/lib/actions/` files; keep data fetching in `/lib/data/` files.

### TypeScript

- Avoid `any`; use precise types or Prisma-generated types (`$inferSelect`, `$inferInput`).
- Justify every non-null assertion (`!`) with a comment.

### BullMQ Jobs

- Job payloads must be typed and validated before enqueuing.
- Jobs must be idempotent — safe to retry on failure.
- Failed jobs must be handled with error logging or a dead-letter strategy.

### Testing

- New features require Jest tests covering happy path and at least one failure case.
- Mock Prisma calls in unit tests; use a test database for integration tests.

### Style

- Extract magic strings and numbers to `/lib/constants/`.
- Remove dead code and console.log statements before committing.
- Run `npx prettier --write .` before submitting a PR.

### OpenShift / DevOps

- New environment variables must be added to the relevant OpenShift template under `openshift/templates/`.
- Dockerfile changes must minimise image layers and must not run the app as root.

## Additional Resources

- [Next.js Docs](https://nextjs.org/docs) — Framework documentation
- [Auth.js Docs](https://authjs.dev/) — Authentication configuration
- [Prisma Docs](https://www.prisma.io/docs/orm) — Database ORM
- [BullMQ Docs](https://docs.bullmq.io/) — Job queue system
- [Tailwind CSS Docs](https://tailwindcss.com/docs) — Styling utilities
- [zeva2 Developer Guide](../developer-guide.md) — Detailed development guidelines
