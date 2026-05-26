When reviewing pull requests for this repository, enforce the following standards:

## Security (non-negotiable)
- Every database read must call `auth()` or `getUserInfo()` and gate access based on the returned session — middleware alone is insufficient.
- Every Server Action (`"use server"`) must verify the session before mutating data.
- API routes under `app/api/` must authenticate and authorise before processing requests.
- Never expose bound server-side arguments to client components without sanitisation.
- All user input must be validated (zod or equivalent) before use.
- Raw Prisma queries (`$queryRaw`, `$executeRaw`) must use parameterised placeholders — never string interpolation.
- Environment variables must only be accessed server-side.

## Prisma / Database
- Avoid N+1 queries — use `include` or `select` with nested relations in a single query instead of looping and querying.
- Use `prisma.$transaction` when multiple writes must be atomic.
- Do not return more columns than needed — use `select` to limit the payload.

## Next.js App Router
- Default to Server Components; add `"use client"` only when interactivity or browser APIs are required.
- New route segments must include `loading.tsx` and `error.tsx` boundaries.
- Keep Server Actions in `/lib/actions/` files and data fetching in `/lib/data/` files.

## TypeScript
- Avoid `any`; use precise types or Prisma-generated types (`$inferSelect`, `$inferInput`).
- Every non-null assertion (`!`) must have a comment explaining why it is safe.

## BullMQ Jobs
- Job payloads must be typed and validated before enqueuing.
- Jobs must be idempotent — safe to retry on failure without side effects.
- Failed jobs must be handled with error logging or a dead-letter strategy.

## Testing
- New features require Jest tests covering the happy path and at least one failure case.
- Prisma calls must be mocked in unit tests.

## Code Style
- Magic strings and numbers must be extracted to `/lib/constants/`.
- Remove all dead code and `console.log` statements before merging.

## OpenShift / DevOps
- New environment variables must be added to the relevant OpenShift template under `openshift/templates/`.
- Dockerfile changes must minimise image layers and must not run the application as root.
