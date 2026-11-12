# Step 3: Housekeeping (read only)

Run only the read commands below. Use Git Bash syntax. Put `timeout 120` before `du`. Record every number: the report needs before and after values.

## Sizing on Windows

`du` takes over 2 minutes on a folder with `node_modules`. Use a list-only robocopy from the PowerShell tool instead (not Git Bash: Bash turns `/L` into a path). `/L` copies nothing, and the target folder is never created:

```powershell
$r = robocopy "<folder>" "C:\__list_only__" /L /E /NJH /NFL /NDL /NC /NS /XJ /R:0 /W:0 /BYTES
($r | Select-String 'Bytes :').ToString()
```

The first number after `Bytes :` is the total size. Set the tool timeout to about 90 s per folder, or run a batch in the background.

## Git repos

For each project folder that is a git repo (`git -C <p> rev-parse --git-dir`):

Find the main branch: `git -C <p> symbolic-ref --short refs/remotes/origin/HEAD` (strip `origin/`), else `main`, else `master`. Call it `<main>` below.

### Worktrees

```bash
git -C <p> worktree list --porcelain
git -C <p> worktree prune --dry-run -v      # entries whose folder is gone
```

For each worktree (not the main folder):
- Size: `timeout 120 du -sh <wt>` (write "over 2 min" on timeout).
- Dirty: `git -C <wt> status --porcelain | wc -l`.
- Unmerged work: `git -C <p> cherry <main> <wt-branch> | grep -c '^+'`.
- In use: a worktree is in use when any non-archived chat has its `cwd` inside it (see Chats below). Do not compare with archived chats.

Also list folders in `<p>/.claude/worktrees/` that are not in `git worktree list`. These are orphan folders. Size them too.

- A worktree can sit inside another worktree (for example `<wt>/.gauntlet/...`). Do not add its size to the total twice.
- Match chats and Claude data folders to a worktree by its folder path, not by its branch name. They often differ.

### Branches

```bash
git -C <p> for-each-ref --format='%(refname:short) %(committerdate:short)' refs/heads refs/remotes
```

For each branch except `<main>`, `HEAD` and `origin/<main>`:
- `git -C <p> cherry <main> <branch> | grep -c '^+'`. 0 means merged (squash merges included).
- Merged branches: one list (local and remote apart).
- Unmerged branches: a separate list with the last commit date and the "+" count.
- Mark a branch that a worktree has checked out. It cannot be deleted before its worktree goes.

Do not run `git fetch` here. Write the date of the last fetch instead: the time of `<p>/.git/FETCH_HEAD`.

### Stashes, caches, logs

```bash
git -C <p> stash list --format='%gd %cs %s'
git -C <p> status --ignored --porcelain=v1 | grep '^!!' | grep '/$'   # ignored folders
ls -la <p>/*.log 2>/dev/null
```

- Size each ignored folder with `timeout 120 du -sh`. Report ones over 50 MB.
- Mark build folders the app needs (`node_modules`, `.expo`, `ios`, `android`, `.venv`) as "needed, keep". Mark tool caches (`.gauntlet/`, `coverage/`, `.cache/`, `dist/`, `*.tsbuildinfo`) as "cache, can go".
- Loose log files: `*.log` in each project root, and in the parent folder that holds the projects. Size and date each one.

### .git size

```bash
timeout 120 du -sh <p>/.git
git -C <p> count-objects -vH
```

`git gc` helps when `count` (loose objects) is over 1000, `packs` is over 20, or `garbage` is over 0. Else write "gc: no gain".

## Claude data folders

- `~/.claude/projects/<dir>` for a path that no longer exists (old worktrees, deleted projects). Dead worktrees often show up only here, as `<project>--claude-worktrees-*` folders. Size each. These hold old chat transcripts: deleting them is destructive.
- Read `cleanupPeriodDays` in `~/.claude/settings.json` (not set means the default). Claude Code removes old transcripts after that many days by itself. Default fix: leave them for that clean-up. Propose a zip only for folders that it will not reach soon.
- Do not touch `~/.claude/projects/<dir>/memory/` here. That is Step 2.

## Chats

Load the session tools with ToolSearch if needed. Then:

```
mcp__ccd_session_mgmt__list_sessions  { include_archived: false, limit: 200 }
```

The result can be too large for one read and gets saved to a file. Then filter that JSON file with a short script by `cwd` (the project path and its `.claude/worktrees/` paths). Keep only the fields below. For each chat:
- Drop it from the report if `isRunning` is true. Never list or touch it.
- The chat you are in is not in the result. Never act on it.
- Mark "keep" if: it is the `startedBy` parent of a running chat, or a CLAUDE.md or memory note protects it (for example "never archive the conductor chat").
- Mark "wait" if: the project's status file (for example `docs/STATUS.md`) lists its step as running, or its branch has unmerged commits (`git cherry` "+" count over 0). Its work may not be checked yet.
- Else it is idle. Record: project (from `cwd`, worktree paths count as their project), title, `lastActivityAt` date, branch.

Group idle chats by project, oldest first. Note which idle chats sit in a worktree that is otherwise unused: archive the chat first, then the worktree can go.

## Artifacts

Artifacts are pages on claude.ai. They belong to the account, not to a project. Do this check in the main chat, not in a subagent.

```
Artifact { action: "list", scope: "mine", limit: 200 }
```

If the result says more exist, list again with `page_token`. Each row has a title, URL and last-updated date. The list is sorted by last opened OR updated, newest first. With a folder argument, keep only artifacts whose title names the project.

The list gives no "last opened" date. So the verdicts below are a best guess, and the owner decides. Let `<cutoff>` be today minus 30 days. For each artifact, give every label that fits:
- **Opened recently:** it sits above an artifact with a strictly newer update date. Keep.
- **Old:** updated on or before `<cutoff>` and not opened recently.
- **Unnamed:** title "Untitled", or a title of only generic words ("Design", "Design System", "Mockup", "Notes"). Flag it, whatever its date.
- **Project active:** the title names a project that had a chat in the last 14 days (from the chat list). It may still be a reference. Note it next to "old".
- **Shared:** only `scope: "mine"` artifacts are candidates. Never touch a shared one.

Candidates are the artifacts labelled old or unnamed. Do not read their content in this step (it costs context). The title and date are enough to ask.

Record: title, URL, last-updated date, labels (for example "old, unnamed").

## Output

Return, per project: a worktree table, merged and unmerged branch lists, stashes, caches, logs, .git size and gc verdict, idle chat list. Then one artifact table for the account. Use tables. Write sizes as shown by `du -h`. Sum worktree sizes in GB.
