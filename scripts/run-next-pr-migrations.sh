#!/usr/bin/env bash
set -euo pipefail

: "${MIGRATION_ZONE:?MIGRATION_ZONE is required}"
: "${MIGRATION_IMAGE_TAG:?MIGRATION_IMAGE_TAG is required}"
: "${MIGRATION_RUN_ID:?MIGRATION_RUN_ID is required}"

database_statefulset="zeva2-${MIGRATION_ZONE}-database"
job_name="zeva2-${MIGRATION_ZONE}-migrate-${MIGRATION_RUN_ID}"

if ! oc rollout status "statefulset/${database_statefulset}" --timeout=5m; then
  echo "::error::PR database StatefulSet ${database_statefulset} did not become ready."
  oc describe "statefulset/${database_statefulset}" || true
  oc get pods -l "deployment=${database_statefulset}" -o wide || true
  exit 1
fi

oc process --local -f openshift/next.pr-migrate.yml \
  -p "ZONE=${MIGRATION_ZONE}" \
  -p "IMAGE_TAG=${MIGRATION_IMAGE_TAG}" \
  -p "RUN_ID=${MIGRATION_RUN_ID}" |
  oc apply -f -

if ! oc wait --for=condition=complete --timeout=16m "job/${job_name}"; then
  echo "::error::Database migration Job ${job_name} did not complete successfully."
  oc logs "job/${job_name}" --all-containers=true || true
  oc describe "job/${job_name}" || true
  exit 1
fi
