// Local semantic-release plugin: maintains CHANGELOG.md as a single Markdown table.
//
// Runs in the "prepare" lifecycle step (before @semantic-release/git) so the
// updated CHANGELOG.md is included in the release commit. It uses the full
// plugin `context` object (pure JS), so there is NO shell-escaping or command
// injection risk from commit messages — unlike passing notes through the shell.
//
// GitHub Releases are unaffected: @semantic-release/github still uses the
// original pretty `nextRelease.notes`. This plugin only rewrites CHANGELOG.md.

const fs = require("fs");
const path = require("path");

const CHANGELOG_FILE = "CHANGELOG.md";

// The fixed top-of-file header. New rows are inserted directly beneath it.
// Keep this in sync with the header used when the table changelog was seeded.
const HEADER = [
  "# Changelog",
  "",
  "All notable changes to this project are documented in this file.",
  "",
  "| Version | Date | Type | Change |",
  "| --- | --- | --- | --- |",
].join("\n");

// Map semantic-release note section titles to concise table "Type" labels.
const TYPE_LABELS = {
  Features: "✨ Feature",
  "Bug Fixes": "🐛 Fix",
  "Performance Improvements": "⚡ Perf",
  Reverts: "⏪ Revert",
  "BREAKING CHANGES": "💥 Breaking",
};

// Escape pipe characters so a change description can't break the table layout.
function escapeCell(text) {
  return text.replace(/\|/g, "\\|").trim();
}

// Parse the generated markdown notes into one table row per change bullet.
function buildRows(version, url, date, notes) {
  const rows = [];
  let type = null;
  for (const rawLine of notes.split("\n")) {
    const line = rawLine.replace(/\r$/, "");
    const section = line.match(/^#{2,4}\s+(.+?)\s*$/); // "### Features" etc.
    if (section) {
      const name = section[1].trim();
      type = TYPE_LABELS[name] || name;
      continue;
    }
    const item = line.match(/^\*\s+(.+)$/); // "* some change ([abc](url))"
    if (item && type) {
      rows.push(
        `| [${version}](${url}) | ${date} | ${type} | ${escapeCell(item[1])} |`,
      );
    }
  }
  return rows;
}

// Prefer the exact compare/tag URL embedded in the generated notes; otherwise
// fall back to a release-tag URL derived from the repository URL.
function deriveUrl(notes, context) {
  const linked = notes.match(
    /\]\((https?:\/\/[^)]+?)\)\s*\(\d{4}-\d{2}-\d{2}\)/,
  );
  if (linked) return linked[1];
  const repo = (
    context.options && context.options.repositoryUrl
      ? context.options.repositoryUrl
      : ""
  )
    .replace(/^git\+/, "")
    .replace(/\.git$/, "")
    .replace(/^git@github\.com:/, "https://github.com/");
  const tag =
    (context.nextRelease && context.nextRelease.gitTag) ||
    `v${context.nextRelease.version}`;
  return `${repo}/releases/tag/${tag}`;
}

function deriveDate(notes) {
  const m = notes.match(/\((\d{4}-\d{2}-\d{2})\)/);
  return m ? m[1] : new Date().toISOString().slice(0, 10);
}

async function prepare(pluginConfig, context) {
  const { nextRelease, cwd = process.cwd(), logger } = context;
  const notes = (nextRelease && nextRelease.notes) || "";
  if (!notes.trim()) {
    logger.log("changelog-table: no release notes; skipping CHANGELOG update.");
    return;
  }

  const version = nextRelease.version;
  const url = deriveUrl(notes, context);
  const date = deriveDate(notes);
  const rows = buildRows(version, url, date, notes);

  if (rows.length === 0) {
    logger.log("changelog-table: no rows parsed from notes; skipping.");
    return;
  }

  const file = path.resolve(cwd, CHANGELOG_FILE);
  const existing = fs.existsSync(file)
    ? fs.readFileSync(file, "utf8")
    : HEADER + "\n";

  // `after` = everything below our header (the existing data rows). If the
  // header isn't an exact match (e.g. first migration), salvage any existing
  // table data rows so no history is lost.
  let after;
  if (existing.startsWith(HEADER)) {
    after = existing.slice(HEADER.length);
  } else {
    const dataRows = existing
      .split("\n")
      .filter(
        (l) =>
          /^\|/.test(l) && !/^\|\s*-+/.test(l) && !/^\|\s*Version\s*\|/.test(l),
      );
    after = (dataRows.length ? "\n" + dataRows.join("\n") : "") + "\n";
  }

  const block = "\n" + rows.join("\n");
  let content = HEADER + block + after;
  if (!content.endsWith("\n")) content += "\n";
  fs.writeFileSync(file, content);

  logger.log(
    `changelog-table: added ${rows.length} row(s) for v${version} to ${CHANGELOG_FILE}.`,
  );
}

module.exports = { prepare };
