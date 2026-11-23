#!/usr/bin/env bash
set -euo pipefail

: "${MIGRATION_ZONE:?MIGRATION_ZONE is required}"
: "${MIGRATION_IMAGE_TAG:?MIGRATION_IMAGE_TAG is required}"
: "${MIGRATION_RUN_ID:?MIGRATION_RUN_ID is required}"

if [[ ! "$MIGRATION_ZONE" =~ ^pr-[0-9]+$ ]]; then
  echo "::error::MIGRATION_ZONE must be a PR zone (pr-<number>)."
  exit 1
fi

database_statefulset="zeva2-${MIGRATION_ZONE}-database"
job_name="zeva2-${MIGRATION_ZONE}-migrate-${MIGRATION_RUN_ID}"

if ! oc rollout status "statefulset/${database_statefulset}" --timeout=5m; then
  echo "::error::PR database StatefulSet ${database_statefulset} did not become ready."
  oc describe "statefulset/${database_statefulset}" || true
  oc get pods -l "deployment=${database_statefulset}" -o wide || true
  exit 1
fi

database_pod="$(oc get pods -l "deployment=${database_statefulset}" -o jsonpath='{.items[0].metadata.name}')"
if [[ -z "$database_pod" ]]; then
  echo "::error::No pod found for PR database StatefulSet ${database_statefulset}."
  oc get pods -l "deployment=${database_statefulset}" -o wide || true
  exit 1
fi

database_name="$(oc exec "$database_pod" -- /bin/sh -c 'printf "%s" "$POSTGRES_DB"')"
database_user="$(oc exec "$database_pod" -- /bin/sh -c 'printf "%s" "$POSTGRES_USER"')"
if [[ ! "$database_name" =~ ^[A-Za-z0-9_]+$ || ! "$database_user" =~ ^[A-Za-z0-9_]+$ ]]; then
  echo "::error::The PR database name and user must contain only letters, digits, or underscores."
  exit 1
fi

echo "Resetting database ${database_name} in ${MIGRATION_ZONE} before migration."
oc exec "$database_pod" -- psql -U "$database_user" -d postgres \
  -v ON_ERROR_STOP=1 \
  -c "DROP DATABASE IF EXISTS \"${database_name}\" WITH (FORCE)" \
  -c "CREATE DATABASE \"${database_name}\" OWNER \"${database_user}\""

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
