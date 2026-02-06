module.exports = {
  branches: ["main"],
  plugins: [
    "@semantic-release/commit-analyzer",
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
        prerelease: true,
      },
    ],
  ],
};
