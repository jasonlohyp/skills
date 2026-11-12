# Step 1: Instruction files

## Source of the rules

Read https://code.claude.com/docs/en/memory once with WebFetch. It is the only web read in this skill. Send no local data with it. If the page says something new that conflicts with the list below, the page wins. Write the change in the report under "Docs changes".

## Files to check

User level (load in every project):
- `~/.claude/CLAUDE.md`
- `~/.claude/rules/*.md`
- `~/.claude/agents/*.md`, `~/.claude/skills/*/SKILL.md`, `~/.claude/output-styles/*.md`, `~/.claude/commands/*.md`

Project level, for each project folder:
- `CLAUDE.md`, `.claude/CLAUDE.md`, `CLAUDE.local.md`, `AGENTS.md`
- every `CLAUDE.md` in a subfolder (skip `node_modules`, `.git`, `.claude/worktrees`)
- `.claude/rules/*.md`, `.claude/agents/*.md`, `.claude/skills/*/SKILL.md`, `.claude/output-styles/*.md`, `.claude/commands/*.md`
- `.claude/settings.json` and `.claude/settings.local.json`: hooks (which rules are already hooks), `model`, and `permissions` entries that name a script, branch or tool that is gone

Find the project folders: each folder in `~/.claude/projects/` has `.jsonl` chat files. The `"cwd"` field in a file gives the real path:

```bash
for d in ~/.claude/projects/*/; do
  f=$(ls -t "$d"*.jsonl 2>/dev/null | head -1); [ -n "$f" ] || continue
  grep -m1 -o '"cwd":"[^"]*"' "$f" | head -1
done | sort -u
```

Skip paths under `.claude/worktrees/` (worktrees of a project) and temp or scratch paths. A path that no longer exists is a Disk finding, not an instruction finding.

Measure each file: `wc -l -c <file>`. For a CLAUDE.md, also add the size of each `@path` import (imports load in full, up to 4 hops deep). HTML block comments (`<!-- -->`) do not load, so subtract them from the context count.

## Checks for each CLAUDE.md, CLAUDE.local.md and rule file

| # | Check | Problem type |
|---|---|---|
| 1 | Over 200 lines (count imports too) | Speed |
| 2 | A fact that only some sessions need | Speed |
| 3 | A multi-step procedure (more than about 5 steps, or a "how to do X" section) | Speed. Fix: move it to a skill. |
| 4 | Rules for one part of the code (one folder, one file type) | Speed. Fix: a `.claude/rules/<name>.md` with `paths:` frontmatter. |
| 5 | Vague rule ("test your changes", "write clean code") | Accuracy. Fix: name the exact command or limit. |
| 6 | Long paragraphs (more than 3 sentences in one block) | Accuracy. Fix: headers and bullets. |
| 7 | Facts Claude can read from the code (folder maps, dependency lists, file lists) | Speed. Fix: delete. |
| 8 | A rule that must always run ("always run X before commit", "never edit Y") | Accuracy. Fix: a hook in settings.json (PreToolUse, Stop, etc.). |
| 9 | A conflict with another file: user vs project, CLAUDE.md vs rule, CLAUDE.md vs agent or skill, project vs memory, CLAUDE.md vs the project's status or decisions file. Always compare the model: `model:` in each agent's frontmatter, `model` in settings.json, and every model rule in text. | Accuracy. Claude may pick either one. If only the owner knows which side is true, add a question to "Questions for the owner". |
| 10 | Stale reference: a file, folder, script, npm script, command, skill, agent, tool or model name that does not exist | Accuracy |
| 11 | Maintainer notes (history, "why we changed this") written as plain text | Speed. Fix: move into an HTML comment. |
| 12 | Duplicate: the same rule in two files | Speed and accuracy |

## How to check stale references (check 10)

- Paths: for each path-like string (has `/` or a file extension), test it from the project root: `test -e <path>`.
- npm scripts: compare `npm run <x>` with the `scripts` keys in `package.json`.
- Skills: compare with folder names in `~/.claude/skills/`, `.claude/skills/` and the skills list in your own system prompt (plugin skills).
- Agents: compare with `.claude/agents/*.md` and `~/.claude/agents/*.md`.
- Models: flag any old model name. Compare with the model family names in your own system prompt.
- Commands: a slash command must exist as a built-in, a skill, or a file in `commands/`.

## Agents, skills and output styles

Check them for checks 5, 9, 10 and 12 only. Also:
- A skill `description` over 1024 characters, or one that summarizes the workflow instead of saying when to use it. Descriptions load in every session.
- A SKILL.md over 500 lines with no `references/` split.

## Frozen and public files

Before you propose a diff, read the project CLAUDE.md and memory for a freeze rule ("frozen", "freeze", "change only after"). Write down the exact files the freeze names. Only those files get the fix risk "needs unfreeze". A fix in a file outside the list (often settings.json) keeps its normal risk. If the freeze prefers checks over prose ("a check goes into a script"), prefer hook and permission fixes. In a public repo, the diff must hold no real names, emails or local paths.

## Output for each file

```
### <path> (<lines> lines, <KB> KB, imports +<n> lines)
Problems:
- [Accuracy|Speed] <what>. Fix: <fix>. Risk: <safe|reversible|destructive|needs unfreeze>.
Proposed short version:
```diff
- old line
+ new line
```
```

Keep each diff to the changed lines with 1 line of context. If a file needs a full rewrite, show the new outline (headers and one line per section) instead of the full text.
