---
on:
  schedule:
    # PAT for ea8eab-create-pr expires quarterly on the 22nd.
    # Remind on the 18th of Oct, Jan, Apr, Jul (4 days before expiry).
    # 16:00 UTC ~= 8-9 AM Pacific.
    - cron: "0 16 18 1,4,7,10 *"
  # Allow manual runs for testing.
  workflow_dispatch:

permissions:
  contents: read
  issues: read
  copilot-requests: write

network: defaults

safe-outputs:
  create-issue:
    title-prefix: "[PAT reminder] "
    labels: [maintenance, reminder]
    assignees: [kuanfandevops]
    close-older-issues: true

---

# Quarterly PAT Regeneration Reminder

The GitHub Personal Access Token (PAT) used by **`ea8eab-create-pr`** expires
every three months (on the 22nd). This workflow runs a few days beforehand to
remind the maintainer to regenerate it before it lapses.

Create a GitHub issue that reminds the maintainer to regenerate the PAT. Because
the issue is assigned, GitHub will email the assignee a notification.

The issue must include:

- A clear title indicating the `ea8eab-create-pr` PAT needs regeneration.
- The approximate expiry date (the 22nd of the current month).
- A short checklist:
  - [ ] Generate a new PAT with the same scopes as the current `ea8eab-create-pr` token.
  - [ ] Update the secret/credential store that holds the token.
  - [ ] Verify the `ea8eab-create-pr` automation still works after rotation.
  - [ ] Close this issue once the token has been rotated.
- A one-line note that this is an automated quarterly reminder.

Keep the issue concise. Do not perform any other actions.

If for some reason no issue should be created, call the `noop` tool with a short
explanation instead.
