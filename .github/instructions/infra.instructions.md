---
applyTo: "**/Dockerfile*,docker-compose*.yml,.github/workflows/**,next/bullmq/**,next/prisma/**"
---

# Infrastructure rules (zeva2 app repo)

Deployment config (Helm charts, values, network policies, Vault annotations) lives in
bcgov-c/tenant-gitops-ea8eab, not here.

## Dockerfiles

- Do not run as root; set a non-root `USER`.
- Minimise layers; use multi-stage builds.
- Pin base image versions (Node 22.x); no `latest`.
- `next` image: `npm install`, `prisma generate`, `npm run build`, start `npm run start`.
- `bullmq` image: `npm install`, `prisma generate`, start `npm run bullmq`.

## Environment variables

- Access env vars server-side only.
- Any new or changed env var requires a matching PR in bcgov-c/tenant-gitops-ea8eab
  (values-dev/test/prod.yaml and the chart template). Link that PR in the description.
- Also update `docker-compose.yml` and `s3.env` for local development.
- Never commit secrets. In deployed environments they come from Vault.

## GitHub Actions

- Pin third-party actions to a version or SHA; use least-privilege `permissions:`.
- Image tag/digest bumps in the gitops repo are CI-managed. Do not add manual steps for them.

## Database and queues

- Set the Prisma connection pool size explicitly when running multiple `next` or `bullmq` instances.
- Schema changes: note whether the deployment needs `pushSchemaToDB` or a migration.
- BullMQ jobs must be idempotent, with typed payloads.
