# Release Changelog and Version File

This repo uses semantic-release to publish releases and keeps release notes in GitHub
Releases. It does not commit changelog or version files back to main.

## What happens on dev-release

1) semantic-release determines the next version and creates a GitHub Release.
2) The release notes serve as the changelog.

## Files updated by the PR

- GitHub Releases (release notes)

## Requirements

- No repo commits are made by the release process.
