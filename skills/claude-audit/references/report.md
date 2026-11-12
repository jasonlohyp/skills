# Step 4: Report

File: `claude-audit-<YYYY-MM-DD>-<scope>.md` in the temp folder named in SKILL.md Step 4 (scratchpad, else `$TEMP` or `/tmp`). Never in a project folder. Plain short English: short words, short sentences, active voice.

## Shape (in this order)

```markdown
# Claude audit: <scope>, <YYYY-MM-DD>

Mode: <full | report-only>. Claude Code <version>.

## Numbers
| What | Now | Target |
|---|---|---|
| ~/.claude/CLAUDE.md lines (+ imports) | n | under 200 |
| <project> CLAUDE.md lines (+ imports) | n | under 200 |
| <project> MEMORY.md | n lines / n KB | under 200 lines and 25 KB |
| Worktrees (count / GB / unused) | n / n GB / n | 0 unused |
| Branches merged, not deleted (local / remote) | n / n | 0 |
| Unmerged branches | n | — |
| Stashes | n | 0 |
| Caches and logs (MB) | n | — |
| .git size / gc gain | n / yes-no | — |
| Open chats (idle / keep) | n / n | — |
| Artifacts (all / old / unnamed) | n / n / n | — |

## Top 5
1. <one line each: the finding with the most impact first>

## Questions for the owner
1. <only facts that only the owner knows, for example which of two conflicting files is true. Omit the section if none.>

## Instructions
<one block per file, from references/instructions.md>

## Memory
Question asked: "Review your notes. List anything outdated, duplicated or conflicting. Wait for my OK before changing anything."
<one table per project, from references/memory.md>

## Disk and git
<tables per project, from references/housekeeping.md>

## Chats
<idle chats per project: title, last date, worktree, proposed action>

## Artifacts
<one numbered table of candidates: #, title, URL, last updated, labels (old / unnamed / project active), proposed action. Then one line: "<n> other artifacts: keep." Note that the list has no last-opened date, so "old" is a guess.>

## Fixes by group
### Instructions
- [ ] <fix> — <risk>
### Memory
- [ ] ...
### Disk and git
- [ ] ...
### Chats
- [ ] ...
### Artifacts
- [ ] Delete <title> (<URL>) — destructive (a copy is saved first)
```

## Each finding

One line or a short block with four parts:
- **What:** the fact, with the number or path.
- **Why:** accuracy, speed or disk, in a few words.
- **Fix:** the exact change or command.
- **Risk:** safe (no data lost), reversible (can be undone, say how), destructive (data is gone), or needs unfreeze.

Example:
`- 31 worktrees, 18.4 GB, 27 used by no chat. Why: disk. Fix: git worktree remove for the 27, then git worktree prune. Risk: reversible (branches stay).`

## Rules

- Put numbers first. No long prose.
- Name exact paths and commands.
- Do not repeat the same finding in two sections. Point to it.
- The report holds local paths and memory notes. Keep it in the temp folder. Never commit or publish it unless the owner asks.
