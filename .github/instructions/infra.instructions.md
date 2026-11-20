---
description: "Use when changing Zeva2 Dockerfiles, package installation, Prisma, local infrastructure, OpenShift templates, or deployment workflows."
applyTo: ["next/Dockerfile*", "next/package*.json", "next/prisma/**", "next/prismaOld/**", "openshift/**", ".github/workflows/**", "docker-compose.yml"]
---

# Zeva2 Infrastructure Guidelines

## Application and dependencies

- The application and its npm dependencies live in `next/`. Run app commands from that directory; the root `package.json` is not the app manifest.
- Keep `next/package.json` and `next/package-lock.json` synchronized. Use `npm ci` for clean installs and CI/image builds; commit lockfile changes with manifest changes.
- Current OpenShift Dockerfiles use Node `26.13.1`. Check the Dockerfiles and CI before changing the runtime version; older developer documentation may not reflect deployment builds.
- Check `next/package.json` for supported scripts before adding or documenting commands. Prisma scripts include generating both clients, development migrations, and deploying migrations.

## Containers and secrets

- OpenShift images are built from the `next/` context using `next/Dockerfile-Openshift` and `next/Dockerfile-Bullmq-Openshift`. Keep `next/.dockerignore` aligned with what the images need, and avoid sending local dependencies or generated artifacts in the build context.
- The Next.js image uses separate dependency, build, and runtime stages. Keep the built Next.js output and `public` assets, both generated Prisma clients, the main Prisma schema/config/migrations, and the `app/`, `lib/`, `types/`, and `tsconfig.json` files needed by the seed command in the runtime image; omit dev dependencies and unrelated source.
- The Next.js runtime install uses `npm ci --ignore-scripts`; preserve the Prisma engines copied from the dependency stage because the migration and seed commands need them.
- The Next.js image generates both Prisma clients and builds the app. Its startup loads Vault-injected files from `/vault/secrets` and starts Next.js; database migrations run once in the dedicated OpenShift Job before app deployment.
- The BullMQ image installs production dependencies, generates the main Prisma client, sources service-specific Vault files with `/bin/sh`, and runs the TypeScript worker with `tsx`. Keep `tsx`, `prisma`, and worker runtime imports in `dependencies`; fail startup on secret-loading errors and `exec` the worker command.
- Both image entrypoints use `/bin/sh`, and the Vault templates emit POSIX `export` statements. Keep sourced files POSIX-compatible; do not install Bash unless a runtime command requires it.
- Run OpenShift workloads as non-root without setting a fixed `runAsUser` or `fsGroup`; namespace SCCs assign IDs from namespace-specific ranges. Make image-writable paths group-owned by GID 0 with group permissions, and avoid mounts that mask those prepared paths unless volume ownership is handled by the namespace SCC.
- Never add secret values to image layers, Git-tracked manifests, or workflow parameters. Deployed secrets are injected through Vault.
- Coordinate Prisma migrations so multiple application replicas cannot race to apply schema changes. Preserve connection-pool sizing when changing replica counts.

## OpenShift and workflows

- Runtime deployments use parameterized OpenShift `Template` manifests under `openshift/`; deployment automation is in `.github/workflows/`. Update the relevant template, workflow parameters, and trigger paths together.
- PR migrations use `openshift/next.pr-migrate.yml` through `scripts/run-next-pr-migrations.sh` and the PR database Secret created by `openshift/database.pr-deploy.yml`. Merge/release migrations use `openshift/next.migrate.yml` through `scripts/run-next-migrations.sh` and the Vault-backed Crunchy database. Keep each one-shot migration step before its application rollout.
- PR workflows build the `next` and `bullmq` packages with PR-number and commit-SHA tags, deploy preview resources, and run health/readiness checks. Run `NODE_ENV=production npm run seed` manually in a Next.js pod when PR database seeding is needed; do not seed automatically during deployment. Verify those checks when changing service names, replicas, ports, or health endpoints.
- Release deployment promotes the PR-built images to the `prod` tag rather than rebuilding them. Keep image package names and tags consistent across build, verification, deploy, and promotion steps.
- Deploy through the existing GitHub Actions workflows and BC Gov OpenShift actions; do not introduce workstation deployment steps.
- Keep shared actions pinned to published commit SHAs with version comments. Do not use `@main`.

## Local development and validation

- `docker-compose.yml` provides the local app infrastructure, including PostgreSQL, Redis, MinIO, Next.js, and BullMQ. Preserve its service relationships and environment-file conventions when changing local setup.
- For app changes, use the relevant commands from `next/`, such as `npm ci`, `npm run build`, `npm run lint`, and `npm test`. Run Prisma generation or migration checks when changing Prisma schemas or migrations.
- Validate changed OpenShift templates with `oc process --local` when available, and validate workflow YAML and trigger behavior when editing deployment automation.
