module.exports = {
  branches: ["main"],
  plugins: [
    "@semantic-release/commit-analyzer",
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
        prerelease: true,
      },
    ],
    // Must be last: commits the files updated above (CHANGELOG.md, package.json)
    // back to the branch. The [skip ci] marker prevents this commit from
    // re-triggering the Dev Release workflow.
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
