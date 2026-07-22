---
on:
  schedule:
    # 10:00 PM PST (UTC-8), Monday-Friday.
    # PST is UTC-8, so 22:00 PST = 06:00 UTC the next day,
    # and Mon-Fri PST maps to Tue-Sat UTC (cron days 2-6).
    - cron: "0 6 * * 2-6"

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

## Formatting rules

- Put **each issue, pull request, or discussion on its own line** as a separate
  Markdown list item (`- `). Never combine multiple issues or PRs into a single
  line or paragraph.
- When several related items belong together, use a nested bullet list (one item
  per line) instead of running them together with slashes or commas.
- Reference each item with its title and number so it renders as a link (for
  example `- ZEVA 2 - Add ... #549`).
- Use short section headings (e.g. `### Open Issues`, `### Blockers`,
  `### Progress`) and keep prose to one or two sentences per item.

