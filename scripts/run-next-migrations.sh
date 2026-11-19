#!/usr/bin/env bash
set -euo pipefail

: "${MIGRATION_ZONE:?MIGRATION_ZONE is required}"
: "${MIGRATION_IMAGE_TAG:?MIGRATION_IMAGE_TAG is required}"
: "${MIGRATION_RUN_ID:?MIGRATION_RUN_ID is required}"
: "${MIGRATION_VAULT_SECRET_PATH:?MIGRATION_VAULT_SECRET_PATH is required}"
: "${MIGRATION_VAULT_ROLE:?MIGRATION_VAULT_ROLE is required}"
: "${MIGRATION_VAULT_SERVICE_ACCOUNT:?MIGRATION_VAULT_SERVICE_ACCOUNT is required}"

job_name="zeva2-${MIGRATION_ZONE}-migrate-${MIGRATION_RUN_ID}"

oc process --local -f openshift/next.migrate.yml \
  -p "ZONE=${MIGRATION_ZONE}" \
  -p "IMAGE_TAG=${MIGRATION_IMAGE_TAG}" \
  -p "RUN_ID=${MIGRATION_RUN_ID}" \
  -p "VAULT_SECRET_PATH=${MIGRATION_VAULT_SECRET_PATH}" \
  -p "VAULT_ROLE=${MIGRATION_VAULT_ROLE}" \
  -p "VAULT_SERVICE_ACCOUNT=${MIGRATION_VAULT_SERVICE_ACCOUNT}" |
  oc apply -f -

if ! oc wait --for=condition=complete --timeout=16m "job/${job_name}"; then
  echo "::error::Database migration Job ${job_name} did not complete successfully."
  oc logs "job/${job_name}" --all-containers=true || true
  oc describe "job/${job_name}" || true
  exit 1
fi
