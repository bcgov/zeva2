module.exports = {
  branches: [
    "main",
    {
      name: "hotfix/1.18.x",
      range: "1.18.x",
      channel: "hotfix",
    },
  ],

  plugins: [
    [
      "@semantic-release/commit-analyzer",
      {
        releaseRules: [
          { breaking: true, release: false },
          { type: "feat", release: false },
          { type: "fix", release: false },
          { type: "perf", release: false },
          { type: "revert", release: false },
        ],
      },
    ],
    "@semantic-release/release-notes-generator",
    ["@semantic-release/npm", { npmPublish: false }],
    ["@semantic-release/github"],
  ],
};
