# Step 5: Apply (only approved groups)

Before each group: read the project CLAUDE.md and memory for freeze and public-repo rules. A frozen file stays as it is unless the owner opens the freeze. In a public repo, keep real names, emails and local paths out of every change and commit, and follow the commit identity rule in the user CLAUDE.md.

Prefer reversible. Do the groups in this order: Chats, Disk and git, Memory, Instructions, Artifacts. Chats go first because a worktree can only go after its chat is archived.

## Chats

- `mcp__ccd_session_mgmt__archive_session` for each approved idle chat. Never `delete_session`.
- Before each call, check the chat again with `mcp__ccd_session_mgmt__get_session`. Skip it if `isRunning` is now true.
- If auto mode says a hook changed the input, send the call once more with exactly the input it printed. If it is refused again, report it. Do not retry in a loop.

## Artifacts

Delete is permanent, and the link stops working for everyone. So:
1. Delete only the artifacts whose numbers the owner gave in reply to "Artifacts?".
2. Save a copy of each first, to `<home>/.claude/artifact-backups/<YYYY-MM-DD>/<title>/` (write the full home path; `~` may not expand):
   - `Artifact { action: "list", scope: "files", url: <url> }` to get its published files.
   - `Artifact { action: "read", url: <url>, paths: [<all of them>], out_dir: <that folder> }`.
   - If a read fails, do not delete that artifact. Report it as kept.
3. Then `Artifact { action: "delete", url: <url> }`. The app asks the owner to confirm each delete.
4. Report each URL as deleted or kept, with the path of its copy. Add one line: "Delete the backup folder when you no longer need it."

## Disk and git

Worktrees:
```bash
git -C <p> worktree remove <wt>      # refuses a dirty worktree: then ask, do not add --force
git -C <p> worktree prune -v
```
On Windows, "Filename too long": delete the folder with PowerShell, then prune:
```powershell
Remove-Item -LiteralPath "\\?\<full path>" -Recurse -Force
```
```bash
git -C <p> worktree prune -v
```

Merged branches:
```bash
git -C <p> branch -d <b>                                  # local; -d refuses unmerged work
git -C <p> tag archive/<b> origin/<b>                     # tag before a remote delete
git -C <p> push origin --delete <b>
```
Never `branch -D` and never delete an unmerged branch without its own yes. Keep the tags local unless the owner asks to push them.

Stashes: `git -C <p> stash drop <ref>` only for stashes the owner named.

Caches and logs: delete only items marked "cache, can go" or a log the owner approved. `rm` and `Remove-Item` are permanent, so the report marks these "destructive". To keep an undo, send the item to the Recycle Bin from PowerShell:

```powershell
Add-Type -AssemblyName Microsoft.VisualBasic
[Microsoft.VisualBasic.FileIO.FileSystem]::DeleteDirectory("<full path>", 'OnlyErrorDialogs', 'SendToRecycleBin')   # DeleteFile for a file
```

gc: `timeout 600 git -C <p> gc` (no `--aggressive`, no `--prune=now`).

## Memory

- Edit or delete only the files listed in the approved Memory fixes.
- Keep MEMORY.md one line per memory. Remove the line of a deleted file.
- A fact moved to CLAUDE.md: add it there first, then remove it from memory.

## Instructions

- Apply the approved diffs with the Edit tool.
- A procedure moved to a skill: create the skill, then replace the text with one line that names it.
- A rule moved to a hook: use the `update-config` skill for the settings.json change.
- Commit only if the owner asks. In a repo with a commit rule in CLAUDE.md, follow it.

## After

Run the size and git checks from `references/housekeeping.md` and `wc -l -c` on the changed files again. Add to the report:

```markdown
## Before and after
| What | Before | After |
|---|---|---|
```

Show the table in chat. List anything that failed, with the error.
