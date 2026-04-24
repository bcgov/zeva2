module.exports = {
  branches: [
    "main",

    // Explicit maintenance declaration
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
          { breaking: true, release: "patch" },
          { type: "feat", release: "patch" },
          { type: "fix", release: "patch" },
          { type: "perf", release: "patch" },
          { type: "revert", release: "patch" },
        ],
      },
    ],
    "@semantic-release/release-notes-generator",
    ["@semantic-release/npm", { npmPublish: false }],
    ["@semantic-release/github"],
  ],
};
