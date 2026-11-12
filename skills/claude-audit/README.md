# claude-audit

A Claude Code skill that audits your Claude setup. It checks your instruction files, your memory notes, your git clutter and your old chats. It writes one report. It changes nothing until you say yes.

## Why

- **Accuracy.** Claude follows the right rules: no conflicts, no rules that point at files that are gone.
- **Speed.** Small context: short CLAUDE.md files, a short memory index.
- **Disk.** No dead worktrees, merged branches, caches or old logs.

## How to use

Say one of these in Claude Code:
- "audit my setup" (all projects and `~/.claude`)
- "audit my setup for C:\path\to\project" (one project)
- add "report-only" to stop after the report

## What it does

0. Asks you to run `/doctor`, `/doctor prompt-audit` and `/context all` and paste the output. You can say "skip".
1. **Instructions.** Checks every CLAUDE.md, CLAUDE.local.md, rule, agent, skill and output style against the [Claude Code memory docs](https://code.claude.com/docs/en/memory): size, vague rules, conflicts, stale names, rules that should be hooks. Proposes a short version as a diff.
2. **Memory.** Checks each MEMORY.md (under 200 lines and 25 KB) and marks every note as OK, outdated, duplicated or conflicting.
3. **Disk and git.** Lists worktrees and their size, merged and unmerged branches (`git cherry`, so squash merges count), stashes, caches, logs and `.git` size. Lists idle chats per project. It never touches a running chat.
4. **Report.** Writes `audits/<date>-<scope>.md`: a numbers table first, then each finding with its fix and risk.
5. **Apply.** Asks four questions: Instructions, Memory, Disk and git, Chats. It applies only the groups you approve, then shows before and after numbers.

## Safety

- No change before your yes, per group.
- Archives chats, never deletes them.
- Tags a branch before it deletes it on the remote.
- Reads one web page (the docs page above). It sends none of your data anywhere.
- The report holds local paths. Keep `audits/` out of git (`.git/info/exclude`).

## Install

Copy the `claude-audit` folder to `~/.claude/skills/`.
