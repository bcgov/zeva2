# Zeva2 Branching Model

## Git Branching Strategy

Zeva2 adopted the [Gitflow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow) as strategy for managing Git branches

## Git Versioning Tool

Zeva2 adopted [GitVersion](https://gitversion.net/docs/reference/configuration) as the versioning tool as it fully supports Gitglow branching strategy.

# Zeva2 Pipelines

This repository contains automated workflows located in the `.github/workflows` directory. Below is an overview of the workflows:

## Workflows Overview

**1. autio-versioning.yaml**

- This workflow is used to test the versioing process. It is disabled by default and only enabled when needed.

**2. build-template.yaml**

- This is templat workflow called my main work flow to build Zeva2 images on Openshift.

**3. cron-cleanup-workflow-runs.yaml**

- This a workflow used to cleanup the workflow runs according to the settings inside.

**4. deploy-template.yaml**

- This workflow is a template workflow used deploy Zeva2 images to teh target environment.

**5. dev-ci.yaml**

- This is the development pipeline to build and deploy Zeva2 applications to dev environment.
- Every commit on the develop branch will trigger this pipeline.

**6. hotfix-ci.yaml**

- This pipeline is used to build and deploy hotfixs to prod environment.
- Every commit on the hotfix branch will trigger this pipeline.

**7. pr-build.yaml**

- This is the pull request build and deployment pipeline.
- Every pull request labeled with build targeting on develop or release/\* will trigger this pipeline

**8. pr-teardown.yaml**

- This pipeline will tear down the pull request build on dev environment
- Remove the build lable on any pull request targeting on develop or release/\* will trigger this pipeline

**9. prod-ci.yaml**

- This is the prod pipeline to build and deploy Zeva2 applications to prod environment
- The commits on main branch will trigger this pipeline

**10. test-ci.yaml**

- This is the test pipeline to build and deploy Zeva2 applications to test environment
- The commits on release/\* branches will trigger this pipeline

# GitFlow Branching Strategy demo

## Zeva2 Continuous Delivery Diagram

![alt text](CICD-diagram.png)

## Zeva2 Branching Model

Zeva2 versioning is fully automatic and only updates major and minor versions. Branch naming converion is:

- develop
- main
- release/\*
- hotfix/\*

![Zeva2 Branch Model](Zeva2-Branching.png)

# Zeva2 Release Process

- Create branch release/x.x.x from the tip of develop branch.

- The release branch will be triggered for the above release branch and deploy it Test environment.

- For the changes for the release need to be added to the release branch

- When the release branch passes the test on Test environment, create the pull request to merge the release branch to main.

- Revew the pull request and approve it.

- Approve the pull request, it will trigger the prod-ci workflow.

- The prod-ci workflow will deploy to Prod environment and create tag x.x.x
