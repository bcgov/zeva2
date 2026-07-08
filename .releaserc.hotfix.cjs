module.exports = {
  branches: [
    "main",
    {
      name: "hotfix/*",
      prerelease: "hotfix",
    },
  ],
  plugins: [
    [
      "@semantic-release/commit-analyzer",
      {
        releaseRules: [
          { breaking: true, release: "patch" },
          { type: "feat", release: "patch" },
          { type: "fix", release: "patch" },
          { type: "perf", release: "patch" },
          { type: "revert", release: "patch" },
        ],
      },
    ],
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/npm",
      {
        npmPublish: false,
      },
    ],
    [
      "@semantic-release/github",
      {
        successComment: false,
        failTitle: false,
        failComment: false,
        releasedLabels: false,
        addReleases: "bottom",
      },
    ],
    // Rewrites CHANGELOG.md as a single Markdown table (one row per change).
    // Runs before @semantic-release/git so the update is part of the release
    // commit. GitHub Release notes are unaffected (they keep the pretty format).
    "./scripts/changelog-table-plugin.cjs",
    // Must be last: commits CHANGELOG.md/package.json to the hotfix branch.
    // These changes then reach main through the automated hotfix -> main PR.
    [
      "@semantic-release/git",
      {
        assets: ["CHANGELOG.md", "package.json", "package-lock.json"],
        message:
          "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
      },
    ],
  ],
};
