Review the current branch's changes against main as a pull request code review.

## Steps

1. Run `git diff main...HEAD` to get all changes introduced by this branch.
2. Run `git log main...HEAD --oneline` to see the commits.
3. Read any changed files in full if the diff alone lacks context.

## Review Checklist

Evaluate the changes against these project-specific concerns:

### Architecture & Patterns
- Does new feature code follow the `[feature]/lib/data.ts` + `[feature]/lib/actions.ts` + `[feature]/lib/components/` structure?
- Are DB queries in `data.ts` (server-only) and mutations in `actions.ts` (server actions)?
- Is shared logic placed in `next/lib/` rather than duplicated across features?
- Are server and client component boundaries (`"use client"`) correctly placed — client components only where interactivity is needed?

### Auth & Security
- Is session authorization verified close to data-fetching (in `data.ts` or the server component), not just at the route level?
- Are server actions validating that the caller has the right role before mutating data?
- No sensitive values hardcoded or logged?

### Database (Prisma)
- Are queries efficient — no N+1 problems, using `include`/`select` appropriately?
- If the schema changed: was `generate-prisma-client` run and is the generated client committed/updated?
- Are new migrations backward-compatible?

### General Code Quality
- TypeScript types are explicit where inference isn't sufficient; no `any` unless justified
- No unnecessary `"use client"` directives
- Tailwind classes use the project's custom design tokens (colors, shadows) from `tailwind.config.ts` rather than arbitrary values

### Commits
- Do commit messages follow Conventional Commits (`feat:`, `fix:`, `ci:`, etc.)?

## Output Format

Summarize findings in these sections (omit sections with no issues):

**Summary** — one paragraph describing what the PR does

**Issues** — bugs, security concerns, or broken patterns (must fix)

**Suggestions** — improvements worth considering (nice to have)

**Looks Good** — notable things done well
