# claude-audit

A Claude Code skill that audits your Claude setup. It checks your instruction files, your memory notes, your git clutter, your old chats and your old artifacts. It writes one report. It changes nothing until you say yes.

## Why

- **Accuracy.** Claude follows the right rules: no conflicts, no rules that point at files that are gone.
- **Speed.** Small context: short CLAUDE.md files, a short memory index.
- **Clutter.** No dead worktrees, merged branches, caches, old logs, idle chats or forgotten artifacts.

## How to use

Say one of these in Claude Code:
- "audit my setup" (all projects, `~/.claude` and all your artifacts)
- "audit my setup for C:\path\to\project" (one project)
- add "report-only" to stop after the report

## What it does

1. **Instructions.** Checks every CLAUDE.md, CLAUDE.local.md, rule, agent, skill and output style against the [Claude Code memory docs](https://code.claude.com/docs/en/memory): size, vague rules, conflicts, stale names, rules that should be hooks. Proposes a short version as a diff.
2. **Memory.** Checks each MEMORY.md (under 200 lines and 25 KB) and marks every note as OK, outdated, duplicated or conflicting.
3. **Housekeeping.** Lists worktrees and their size, merged and unmerged branches (`git cherry`, so squash merges count), stashes, caches, logs and `.git` size. Lists idle chats per project. It never touches a running chat. Lists your artifacts and marks the old and unnamed ones.
4. **Report.** Shows a summary in chat. Writes the full report to a temp folder, so you never clean it up and it never lands in a repo.
5. **Apply.** Asks one question per group: Instructions, Memory, Disk and git, Chats, Artifacts. It applies only the groups you approve, then shows before and after numbers.

Tip: for a second opinion, run `/doctor` yourself in a terminal `claude` session. The audit does not need it.

## Safety

- No change before your yes, per group.
- Archives chats, never deletes them.
- Tags a branch before it deletes it on the remote.
- Deletes only the artifacts you pick by number, and saves a copy of each first.
- Reads one web page (the docs page above) and your own artifact list. It publishes nothing unless you ask.

## Install

Copy the `claude-audit` folder to `~/.claude/skills/`.
