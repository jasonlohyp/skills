# Step 2: Memory

Auto memory lives in `~/.claude/projects/<project>/memory/`. `<project>` is the project path with `:`, `\` and `/` changed to `-` (for example `C--work-app`). Worktrees of one repo share the main project's memory.

## Size checks for each MEMORY.md

```bash
wc -l -c ~/.claude/projects/*/memory/MEMORY.md
```

- Under 200 lines AND under 25 KB (25600 bytes). Only that much loads at session start. Lines after the cut are lost to Claude.
- One line per memory: `- [Title](file.md) — hook`. No memory content in MEMORY.md itself.
- Use `wc -l` as the truth for the count. A shell loop with a glob can print MEMORY.md twice; that is not a duplicate line.
- Each line links to a file that exists. Each `.md` file in the folder (except MEMORY.md) has a line.
- Topic files load only when Claude opens them. A long topic file costs nothing until read, but a stale one can mislead.

## The review question

In chat, ask the owner exactly:

> "Review your notes. List anything outdated, duplicated or conflicting. Wait for my OK before changing anything."

Then answer it yourself, for every memory file, in the report. Read each file in full. For each one, give one of: OK, Outdated, Duplicated, Conflicting. Use these tests:

| Label | Test |
|---|---|
| Outdated | The note names a file, folder, script, flag, setting, branch, model, date-bound fact ("valid to <date>") or rule that is gone or past. Check each name with `test -e`, `grep`, or the project files. |
| Duplicated | Two memory files hold the same fact, OR the fact is already in a CLAUDE.md, rule file or project doc. A note that says "the rule is in X; this note holds only the why" is not a duplicate if it adds a real why. |
| Conflicting | Two notes disagree, OR a note and a CLAUDE.md (user or project) disagree, OR a note tells Claude to act without asking where a CLAUDE.md says to ask (or the reverse). |

Also check:
- A memory that applies to all projects but sits in one project folder. Fix: move the fact to `~/.claude/CLAUDE.md` (it does not load elsewhere now).
- Memory folders for projects whose folder no longer exists. Disk finding.

## Output

```
### <project> memory (<n> files, MEMORY.md <lines> lines / <KB> KB)
| File | Verdict | Why | Fix | Risk |
|---|---|---|---|---|
```

Fixes are proposals only. Memory edits wait for the "Memory?" yes.
