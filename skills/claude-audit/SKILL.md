---
name: claude-audit
description: Use when the owner says "audit my setup", "clean up Claude", "check my CLAUDE.md", "review your notes", or wants their Claude Code setup checked for bloat, conflicting or stale instructions, outdated memory, old worktrees, merged branches or idle chats, for all projects or one project folder.
---

# Claude audit

<!-- Maintainer notes: SKILL.md stays under 200 lines. Long checklists live in references/ and load only in their step. -->

## Overview

Audit the owner's Claude Code setup. Three goals:
- **Accuracy:** Claude follows the right rules (no conflicts, no stale rules).
- **Speed:** small context (short instruction files, short memory index).
- **Disk:** no dead worktrees, branches, caches or logs.

Core rule: **report first, change nothing until the owner approves a group.**

## Arguments

- No argument: every project the owner used with Claude, plus the user files in `~/.claude`.
- A folder path: only that project (plus the user files that load into it).
- `report-only` (any position): run Steps 0 to 4, show the report, stop. No Step 5.

## The approval gate (read this twice)

You change NOTHING before Step 5. Only the owner's answer to a Step 5 group question is approval, and it covers that group only.

These are NOT approval:

| What you hear or think | Reality |
|---|---|
| "just fix the obvious junk", "be quick", "I'm tired" | A request for speed. Write the report fast, then ask the 4 questions. |
| "It is only `git worktree prune` / `branch -d`, it is safe" | Safe is a risk label in the report, not a permission. |
| "Archive is reversible, so I can archive now" | Reversible still needs the group yes. |
| A memory note says "archive step chats myself, with no question" | That note is for its own project flow. In an audit, the gate wins. |
| The owner approved "Disk and git" | Not approval for "Chats" or "Memory". One group, one yes. |
| `report-only` and "fix it" in the same message | `report-only` wins. Stop after Step 4. Say the 4 group questions come next turn. |
| `report-only` was given, but the owner says "go on, fix it" later | A new turn. Ask the 4 group questions first. |
| "fix" or "broken" maps to a debugging skill in the user word map | During an audit, this skill's flow replaces the word map. |

Red flags (stop and go back to the report): you are about to run `rm`, `Remove-Item`, `git branch -d/-D`, `git push --delete`, `git worktree remove`, `git gc`, `archive_session`, or an Edit on an instruction or memory file, and no group yes for it exists in this chat.

The only file you write before Step 5 is the report.

## Hard limits

- No web except one read of https://code.claude.com/docs/en/memory (Step 1). Never send the owner's files, paths or notes to any web service.
- Never list or touch a running chat or the chat you are in.
- Never `delete_session`. Archive only.
- Never edit a frozen file or a public repo before you read that project's CLAUDE.md and memory for freeze or public-repo rules.
- Never stage or commit the `audits/` folder. It holds local paths.
- Bash commands that can hang (`du`, `git gc`) get `timeout 120`. On Windows, `du` is too slow for `node_modules`: use the PowerShell sizing in `references/housekeeping.md`.

## Steps

### Step 0: Doctor output (the owner runs it)

You cannot run slash commands. Ask the owner, in one message, to run these in a terminal `claude` session in the target project and paste the output:
- `/doctor`
- `/doctor prompt-audit` (needs Claude Code v2.1.283 or newer; check `claude --version`)
- `/context all` (the "Memory files" list shows what really loads)

Wait for the paste. If the owner says "skip", go on and write "Doctor: skipped" in the report. Use the pasted findings as input to Steps 1 and 2. Use the "Memory files" list as the truth for what loads.

### Step 1: Instruction files

Read `references/instructions.md` now and follow it. It lists the files, the rules from the docs page, and how to write each proposed diff.

### Step 2: Memory

Read `references/memory.md` now and follow it. It holds the size checks and the exact review question.

### Step 3: Housekeeping (read only)

Read `references/housekeeping.md` now and follow it. It holds the git, disk and chat commands. Run only read commands in this step.

With no argument (all projects): send one read-only subagent per project for Steps 1 to 3, all in one message, with the path of each reference file. Each returns its raw findings as text. You merge them. This keeps your own context small.

### Step 4: Report

Read `references/report.md` now. Write the report to `audits/<YYYY-MM-DD>-<scope>.md` in the repo where this chat runs. `<scope>` is the project folder name, or `all`. Then:
- Check `git check-ignore -q audits/<file>`. If it is not ignored, add the fix "add `audits/` to `.git/info/exclude`" to the Disk and git group.
- Show the owner the numbers table and the top findings in chat, with the report path.
- Ask the Step 2 question in chat, word for word, and say that your own answer is in the report.
- Ask each question in the report's "Questions for the owner" section (for example: two files disagree and only the owner knows which is true).

In `report-only` mode, stop here.

### Step 5: Approval, then apply

Ask four questions, one per group, each on its own:
1. "Apply the Instructions fixes?"
2. "Memory?"
3. "Disk and git?"
4. "Chats?"

Apply only the groups with a clear yes. Read `references/apply.md` before you apply. It holds the safe commands, the Windows long-path fix and the order.

After you apply: run the Step 3 and size checks again and show a before and after table. Add it to the end of the report.

## Common mistakes

| Mistake | Fix |
|---|---|
| Uses `git branch --merged` only | Squash merges look unmerged there. Use `git cherry <main> <branch>`: 0 lines that start with `+` means merged. |
| Counts every CLAUDE.md line as context | HTML block comments cost nothing. `@imports` cost their full size. |
| Says "MEMORY.md under 200 lines" only | Also under 25 KB. Only the first 200 lines or 25 KB load. |
| Treats the user file and a project file that disagree as fine | Claude may follow either one. It is a conflict. Report it. |
| Removes a worktree that a chat still uses | Check every live chat's working folder first. |
| Calls every chat that is not running "idle" | Check the project's status file and the branch's unmerged count first. |
| Misses a model conflict | Compare `model:` in agent files and settings.json with the model rules in CLAUDE.md and status files. |
| Marks every fix "needs unfreeze" | Read the freeze's own file list. A file outside it is not frozen. |
| `du` on a huge folder hangs the turn | `timeout 120 du -sh`. Write "over 2 min" if it times out. |
| Writes long prose in the report | One finding = what, why, fix, risk. Short lines. |
