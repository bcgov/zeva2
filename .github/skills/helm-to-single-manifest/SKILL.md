---
name: helm-to-single-manifest
description: 'Transform Helm-based OpenShift deployments to single manifest deployments.'
---
# Context

This skill helps transform Helm-based OpenShift deployments into single manifest deployments by creating one template per component and ensuring all environment-specific values are carried over.
  - The two helm charts located under tenant-gitops-ea8eab/zeva2 are `next` and `bullmq`.
  - Each chart should be transformed into a corresponding single manifest template.
  - The resulting single manifest templates should be placed under zeva2/openshift folder
  - Ensure that all environment-specific values from the Helm charts are included in the single manifest templates.
  - This ensures that the single manifest templates are consistent with the environment-specific configurations defined in the Helm charts.
  - The skill ensures that the transformation from Helm charts to single manifest templates preserves the deployment configurations and environment-specific settings accurately.
  - The skill is particularly useful for teams looking to simplify their OpenShift deployment process by reducing the complexity introduced by Helm charts.
# Instructions
  - Create one template per component (e.g., `next.deploy.yml`, `bullmq.deploy.yml`).
  - Use `apiVersion: template.openshift.io/v1`, `kind: Template`.
  - Declare standard parameters:
    - `NAME` (application module name, e.g. `myapp`)
    - `COMPONENT` (component name, e.g. `backend`)
    - `ZONE` (deployment zone: `pr-123`, `dev`, `test`, `prod`)
    - `IMAGE_TAG` (image tag or digest)
    - `REGISTRY` (default: `ghcr.io`)
    - `ORG_NAME` (default: `bcgov`)
    - `DOMAIN` (default: `apps.silver.devops.gov.bc.ca`)
    - `NAMESPACE_PLATE` (OpenShift namespace license plate)
    - `VAULT_SECRET_PATH` (Vault secret path, e.g., `namespaceplate-nonprod/dev`, `namespaceplate-nonprod/test`, `namespaceplate-prod`)
    - `VAULT_ROLE` (Vault Kubernetes auth role, e.g. `namespaceplate-nonprod`, `namespaceplate-prod`)
  - Services connection:
    - refer to database.deploy.yml for database connection details.
    - refer to redis.deploy.yml for Redis connection details.
  - Declare modern Kubernetes `Deployment` resources:
    - Rolling update strategy: `maxUnavailable: 1`, `maxSurge: 1`.
    - Container image: `${REGISTRY}/${ORG_NAME}/${NAME}/${COMPONENT}:${IMAGE_TAG}`.
    - Liveness, readiness, and startup probes pointing to application health endpoints.
  - Make sure run helm template command based on values-prod.yaml to generate the manifests for production environment before transform the helm chart into single manifest templates.
  - Disgard metadata.lables in the helm chart and replace them with the following structure:
    (ensure proper indentation under the resource definition)
      metadata:
      name: ${NAME}-${ZONE}-${COMPONENT}
      labels:
        app: ${NAME}-${ZONE}
        deployment: ${NAME}-${ZONE}-${COMPONENT}
  - For Route, please use host: ${NAME}-${ZONE}-${COMPONENT}.${DOMAIN}

