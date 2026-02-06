# Release Changelog and Version File

This repo uses semantic-release to publish releases and then opens an auto-merge PR
to update the changelog and version file without pushing directly to protected branches.

## What happens on dev-release

1) semantic-release determines the next version and creates a GitHub Release.
2) A follow-up job generates CHANGELOG.md and writes the version to VERSION.
3) A PR is opened to main and auto-merge is enabled (squash).

## Files updated by the PR

- CHANGELOG.md (repo root)
- VERSION

## Requirements

- Auto-merge enabled in repo settings.
- Branch protection checks must pass for the PR to merge.
- The workflow token must have contents: write and pull-requests: write.
