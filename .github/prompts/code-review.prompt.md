---
agent: ask
description: Perform a thorough code review for zeva2 pull request changes
---

# Code Review – zeva2

You are an expert code reviewer for the **zeva2** project — a Next.js 15 / TypeScript application backed by PostgreSQL (Prisma ORM), Redis/BullMQ for background jobs, and deployed on OpenShift via GitHub Actions.

## Scope

Review the code changes provided and evaluate each of the following areas. For every issue found, state:
- **Severity**: 🔴 Critical | 🟠 Major | 🟡 Minor | 🔵 Suggestion
- **File & line** reference
- **Explanation** and a concrete fix or alternative

---

## Review Checklist

### 1. Correctness & Logic
- Does the code do what it is intended to do?
- Are edge cases (empty arrays, null/undefined, 0 values) handled?
- Are async operations correctly awaited? Are `Promise` rejections handled?

### 2. TypeScript & Type Safety
- Are `any` types used unnecessarily? Prefer precise types or generics.
- Are Prisma-generated types (`$inferSelect`, `$inferInput`) used where appropriate?
- Are non-null assertions (`!`) justified?

### 3. Prisma / Database
- Are queries efficient? Look for N+1 query patterns — prefer `include` / `select` with nested relations.
- Are transactions (`prisma.$transaction`) used where multiple writes must be atomic?
- Do new migrations follow the existing naming convention and include a `down` migration comment?
- Are raw queries (`$queryRaw`, `$executeRaw`) parameterised to prevent SQL injection?

### 4. Next.js App Router Conventions
- Are Server Components used where no client interactivity is needed?
- Are `"use client"` directives kept to the minimum necessary scope?
- Are Server Actions (`/lib/actions/`) used correctly — validated server-side and not leaking sensitive data?
- Are `loading.tsx` and `error.tsx` boundaries present for new route segments?

### 5. API Routes & Security
- Are API routes (`/api/`) protected by authentication/authorisation checks?
- Is user input validated (zod or equivalent) before use?
- Are sensitive environment variables accessed only server-side?

### 6. BullMQ / Background Jobs
- Are job payloads typed and validated before enqueuing?
- Are jobs idempotent — safe to retry on failure?
- Are failed jobs handled (dead-letter queue or error logging)?

### 7. Error Handling & Logging
- Are errors caught and surfaced appropriately (user-facing vs. server log)?
- Is OpenTelemetry (`instrumentation.ts`) instrumented for new critical paths?

### 8. Testing
- Are new features covered by unit or integration tests (`jest.config.ts`)?
- Are tests meaningful — do they cover happy path **and** failure cases?
- Do tests avoid testing Prisma internals — use mocks or a test DB?

### 9. Code Style & Maintainability
- Does the code follow the patterns established in adjacent files?
- Are magic numbers/strings extracted to `/lib/constants/`?
- Are functions small, single-purpose, and named clearly?
- Is dead code or commented-out code removed?

### 10. OpenShift / DevOps
- Are new environment variables documented and added to the relevant OpenShift template (`openshift/templates/`)?
- Do Dockerfile changes minimise image layers and avoid running as root?

---

## Output Format

Provide a summary like this:

```
## Code Review Summary

**Overall**: ✅ Approve / 🔄 Request Changes / 💬 Comment

### Issues Found
| # | Severity | File | Description |
|---|----------|------|-------------|
| 1 | 🔴 Critical | `path/to/file.ts#L42` | ... |

### Positive Observations
- ...

### Recommended Next Steps
1. ...
```

Now review the following changes:
