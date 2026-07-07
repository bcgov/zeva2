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
      "@semantic-release/changelog",
      {
        changelogFile: "CHANGELOG.md",
        changelogTitle:
          "# Changelog\n\nAll notable changes to this project are documented in this file.",
      },
    ],
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
