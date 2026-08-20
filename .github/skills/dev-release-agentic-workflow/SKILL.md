---
name: dev-release-agentic-workflow
description: Scaffold a GitHub Agentic Workflow (gh-aw) that PERFORMS the zeva2 Dev release end to end — run tests, run semantic-release versioning, build images in the OpenShift Tools namespace, tag them into Dev, and deploy — intended to eventually replace the deterministic .github/workflows/dev-release.yml. Use this when asked to create or update an agentic workflow that does (not just reports on) the dev release.
---

# Dev Release Agentic Workflow

Use this skill to scaffold a **GitHub Agentic Workflow** (via the `gh aw` CLI
extension) that **performs the zeva2 Dev release end to end**, with the goal of
eventually **replacing** the deterministic `.github/workflows/dev-release.yml`.
The output is a Markdown workflow source under `.github/workflows/*.md` that is
compiled to a `.lock.yml` with `gh aw compile`.

## Important architecture note (read first)

gh-aw agentic workflows run an AI agent **read-only**, and all writes happen
through **safe-outputs** (validated, permission-scoped jobs). Release work is
mostly **deterministic infrastructure** (running `semantic-release`, `oc login`,
`oc tag`, Helm deploy) that must run reliably and idempotently — that is a poor
fit for an agent "deciding" what to do at runtime.

The recommended pattern for an agentic workflow that performs the release is
therefore a **hybrid**:

- **Deterministic jobs/steps** (declared in the frontmatter `jobs:` / `steps:`
  and reused `uses:` templates) do the actual release work — tests,
  semantic-release, build, tag, deploy. These are the same steps as the current
  `dev-release.yml`.
- **The agent** handles the parts that benefit from reasoning: deciding whether
  a release is warranted, summarizing the version bump and changelog, triaging
  failures, and emitting a human-readable report via safe-outputs.

Do not try to have the agent run `oc` or `semantic-release` itself through
tool calls — keep those in deterministic jobs and let the agent orchestrate and
report around them.

## Background: what dev-release.yml does today

Replicate this behavior (see `.github/workflows/dev-release.yml`):

1. `run-jest-tests` — install deps, generate Prisma client, run Jest, upload
   coverage.
2. `install-oc` — reusable `install-oc-template.yaml`.
3. `release` — checkout with `RELEASE_TOKEN`, run `semantic-release` using
   `.releaserc.dev.cjs`; output `release_version`, `release_is_new`,
   `release_tag`. Commit types drive the bump (`feat:` minor, `fix:` patch,
   `BREAKING CHANGE` major).
4. `build-dev` — only if `release_is_new == 'true'`; reusable
   `build-template.yaml`, builds images in the `*-tools` namespace.
5. `tag-images-dev` — `oc tag` images from `*-tools` into `*-dev`.
6. `deploy-dev` — reusable `deploy-template.yaml` with `values-dev.yaml`.

Key secrets/inputs: `RELEASE_TOKEN`, `OPENSHIFT_SERVER`, `OPENSHIFT_TOKEN`,
`OPENSHIFT_NAMESPACE_PLATE` (used to derive `*-tools` and `*-dev`).

## Inputs to collect

Before generating the workflow, confirm:

- `trigger` — usually `push` to `main` plus `workflow_dispatch` (matching the
  current pipeline).
- `agent_role` — what the agent adds on top of the deterministic steps
  (e.g. "summarize the release and changelog", "triage failures and open an
  issue", "post deploy status").
- `output` — safe-output for the agent's report: `create-issue` (default) or
  `add-comment`; assign to a GitHub username for email notification.
- `replace_existing` — whether this workflow will replace `dev-release.yml`
  (if so, plan to delete `dev-release.yml` in the same PR once validated).

## Rules and guidance

1. **Hybrid design.** Put release-critical work in deterministic frontmatter
   `jobs:` (reusing the existing `*-template.yaml` reusable workflows). Use the
   agent + `safe-outputs` for summary/triage only.
2. **Reuse existing templates.** Call `install-oc-template.yaml`,
   `build-template.yaml`, and `deploy-template.yaml` via `uses:` rather than
   re-implementing `oc`/build logic.
3. **Guard the build/deploy** on `release_is_new == 'true'`, exactly like today,
   so no images are built when semantic-release makes no new tag.
4. **Secrets.** Reference the same secrets (`RELEASE_TOKEN`, `OPENSHIFT_*`,
   `OPENSHIFT_NAMESPACE_PLATE`). The agent itself stays read-only; deterministic
   jobs get the permissions/secrets they need.
5. **Least-privilege agent.** The agent job uses read-only `permissions` plus
   `copilot-requests: write`, and writes only via `safe-outputs`.
6. **Notification via assignment.** For "email", set
   `safe-outputs.create-issue.assignees: [<github-username>]`.
7. **Conventional Commits.** Commit with `chore(ci): ...`.
8. **Always compile.** Run `gh aw compile`, resolve errors/warnings, and commit
   both the `.md` and generated `.lock.yml`.
9. **Cutover safely.** Keep `dev-release.yml` until the agentic workflow has
   proven itself on `workflow_dispatch`; then remove `dev-release.yml` in the
   same PR that promotes the new one to run on `push: main`.

## Workflow template (hybrid: deterministic jobs + agent report)

Create `.github/workflows/dev-release-agentic.md`. The frontmatter carries the
deterministic release jobs (mirroring `dev-release.yml`); the Markdown body is
the agent prompt that runs after them and reports via safe-outputs.

```markdown
---
on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  actions: read
  issues: read
  copilot-requests: write

network: defaults

concurrency:
  group: dev-release-agentic-${{ github.ref }}
  cancel-in-progress: true

tools:
  github:
    toolsets: [default]

safe-outputs:
  create-issue:
    title-prefix: "[dev-release] "
    labels: [release, automation]
    assignees: [<github-username>]
    close-older-issues: true

# Deterministic release jobs run before the agent. These mirror
# dev-release.yml and do the real work; the agent job (added by gh-aw)
# depends on them and summarizes the outcome.
jobs:
  run-jest-tests:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./next
    steps:
      - uses: actions/checkout@v6.0.2
      - uses: actions/setup-node@v6.3.0
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: ./next/package-lock.json
      - run: npm install
      - run: npm run generate-prisma-client
      - run: npm run test

  install-oc:
    needs: run-jest-tests
    uses: ./.github/workflows/install-oc-template.yaml

  release:
    needs: run-jest-tests
    runs-on: ubuntu-latest
    outputs:
      release_version: ${{ steps.release_version.outputs.version }}
      release_is_new: ${{ steps.release_version.outputs.is_new }}
      release_tag: ${{ steps.release_version.outputs.tag }}
    steps:
      - uses: actions/checkout@v6.0.2
        with:
          fetch-depth: 0
          token: ${{ secrets.RELEASE_TOKEN }}
          persist-credentials: true
      - uses: actions/setup-node@v6.3.0
        with:
          node-version: "22"
          cache: "npm"
          cache-dependency-path: ./package-lock.json
      - run: npm install
      - id: prev_tag
        run: |
          git fetch --tags
          echo "tag=$(git describe --tags --abbrev=0 2>/dev/null || true)" >> "$GITHUB_OUTPUT"
      - run: cp .releaserc.dev.cjs .releaserc.cjs
      - name: Run semantic-release for dev
        env:
          GITHUB_TOKEN: ${{ secrets.RELEASE_TOKEN }}
          GIT_AUTHOR_NAME: Zelda Team
          GIT_AUTHOR_EMAIL: kuan.fan@gov.bc.ca
          GIT_COMMITTER_NAME: Zelda Team
          GIT_COMMITTER_EMAIL: kuan.fan@gov.bc.ca
          HUSKY: 0
        run: npx semantic-release
      - id: release_version
        run: |
          git fetch --tags
          NEW_TAG=$(git describe --tags --abbrev=0 2>/dev/null || true)
          PREV_TAG="${{ steps.prev_tag.outputs.tag }}"
          if [ -n "$NEW_TAG" ] && [ "$NEW_TAG" != "$PREV_TAG" ]; then
            echo "is_new=true" >> "$GITHUB_OUTPUT"
          else
            echo "is_new=false" >> "$GITHUB_OUTPUT"
          fi
          echo "version=${NEW_TAG#v}" >> "$GITHUB_OUTPUT"
          echo "tag=$NEW_TAG" >> "$GITHUB_OUTPUT"

  build-dev:
    needs: [install-oc, release]
    if: needs.release.outputs.release_is_new == 'true'
    uses: ./.github/workflows/build-template.yaml
    with:
      git_ref: ${{ needs.release.outputs.release_tag }}
      version: ${{ needs.release.outputs.release_version }}
    secrets:
      tools-namespace: ${{ secrets.OPENSHIFT_NAMESPACE_PLATE }}-tools
      openshift-server: ${{ secrets.OPENSHIFT_SERVER }}
      openshift-token: ${{ secrets.OPENSHIFT_TOKEN }}

  tag-images-dev:
    needs: [release, build-dev]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/cache@v5.0.4
        with:
          path: /usr/local/bin/oc
          key: oc-cli-${{ runner.os }}
      - run: |
          oc login --server="${{ secrets.OPENSHIFT_SERVER }}" --token="${{ secrets.OPENSHIFT_TOKEN }}" --insecure-skip-tls-verify=true
          TOOLS="${{ secrets.OPENSHIFT_NAMESPACE_PLATE }}-tools"
          DEV="${{ secrets.OPENSHIFT_NAMESPACE_PLATE }}-dev"
          V="${{ needs.release.outputs.release_version }}"
          oc tag $TOOLS/zeva2-next:$V $DEV/zeva2-next:$V --reference-policy=local
          oc tag $TOOLS/zeva2-bullmq:$V $DEV/zeva2-bullmq:$V --reference-policy=local

  deploy-dev:
    needs: [release, tag-images-dev]
    uses: ./.github/workflows/deploy-template.yaml
    with:
      git_ref: ${{ github.ref_name }}
      version: ${{ needs.release.outputs.release_version }}
      values_file: values-dev.yaml

---

# Dev Release — Agentic Orchestration & Report

The deterministic release jobs above have run (tests → semantic-release →
build → tag → deploy to OpenShift Dev). Review their outcome and produce a
concise report.

Create a GitHub issue summarizing:

- Whether a **new version** was released (and the version/tag), or why not.
- Test, build, tag, and deploy **status** for this run.
- Any **failures** with the failing job and a link to the run.
- The relevant **changelog / notable commits** since the previous tag.

## Formatting rules

- One issue, PR, or run link per Markdown list item.
- Never join multiple links with "and", commas, or dashes.
- Keep it concise.

If the release succeeded with nothing noteworthy, call the `noop` tool with a
short message instead of creating an issue.
```

## Compile and commit

```bash
gh aw compile
git add .github/workflows/dev-release-agentic.md .github/workflows/dev-release-agentic.lock.yml
git commit -m "chore(ci): add agentic dev release workflow"
```

When ready to cut over (after validating via `workflow_dispatch`), remove the
old pipeline in the same PR:

```bash
git rm .github/workflows/dev-release.yml
git commit -m "chore(ci): replace dev-release.yml with agentic dev release"
```

## Common pitfalls

- **Making the agent do the deploy.** Keep `oc`/build/deploy in deterministic
  jobs; the agent orchestrates and reports, it does not run infrastructure
  commands.
- **Dropping the `release_is_new` guard.** Without it, builds run on every push
  even when no new tag is cut.
- **Missing secrets/permissions on deterministic jobs.** They still need
  `RELEASE_TOKEN` and `OPENSHIFT_*`; the agent stays read-only.
- **Removing `dev-release.yml` too early.** Validate the agentic workflow first,
  then delete the old one in the same cutover PR.
- **Forgetting to compile.** The `.lock.yml` is what runs; always
  `gh aw compile` and commit both files.
- **Two workflows on `push: main` at once.** While both exist, keep the new one
  on `workflow_dispatch` only to avoid double releases.
