---
on: daily

permissions:
  contents: read
  issues: read
  pull-requests: read
  copilot-requests: write

network: defaults

tools:
  github:
    toolsets: [default]

safe-outputs:
  create-issue:

---
# Daily Repo Status Report

Review recent activity in the repository, including issues, pull requests, discussions, and code changes.

Create a GitHub issue summarizing what changed in the last 24 hours (merged pull requests, closed issues, and new discussions), any blockers or open questions mentioned in comments, progress toward visible goals, and recommended next steps for maintainers.

Keep the summary concise. Adjust the level of detail based on how much activity occurred.
