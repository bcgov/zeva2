#!/usr/bin/env bash
set -euo pipefail

: "${PR_NUMBER:?PR_NUMBER is required}"

if [[ ! "$PR_NUMBER" =~ ^[0-9]+$ ]]; then
  echo "::error::PR_NUMBER must contain only digits."
  exit 1
fi

deployment_name="zeva2-pr-${PR_NUMBER}-next"

if ! oc rollout status "deployment/${deployment_name}" --timeout=10m; then
  echo "::error::Next deployment ${deployment_name} did not become ready."
  oc describe "deployment/${deployment_name}" || true
  oc get pods -l "deployment=${deployment_name}" -o wide || true
  exit 1
fi

pod_name="$(oc get pods -l "deployment=${deployment_name}" -o json |
  jq -r '[.items[] | select(.status.phase == "Running") | select(any(.status.conditions[]?; .type == "Ready" and .status == "True"))][0].metadata.name // empty')"

if [[ -z "$pod_name" ]]; then
  echo "::error::No ready Next pod found for deployment ${deployment_name}."
  oc get pods -l "deployment=${deployment_name}" -o wide || true
  exit 1
fi

oc exec "$pod_name" -c next -- /bin/sh -c \
  '. /vault/secrets/database && NODE_ENV=production npm run seed'
