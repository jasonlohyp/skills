# quiet-noisy

A Claude Code hook that stops noisy command output from filling up Claude's context.

Installs, builds and tests can print hundreds of lines. Claude reads every line, and every line costs tokens. This hook cuts that output down to the lines that matter: **errors, failures and the final summary**.

```
Before:  npm install --verbose express  →  171 lines
After:   npm install --verbose express  →   16 lines
```

## What it does

- **Catches noisy commands.** These are installs, builds, tests, `git clone`, `docker build` and similar commands.
- **Keeps short output whole.** If the output is 40 lines or less, Claude gets all of it.
- **Cuts long output.** Claude gets only the error and fail lines, plus the last 15 lines. The last lines hold the summary.
- **Keeps the exit code.** A failed build still shows as failed.
- **Leaves all other commands alone.**

For long output, the first line tells Claude what happened:

```
[quiet-hook] 153 lines → 16. Re-run with QUIET_HOOK_OFF=1 for full output.
```

## How it differs from the Anthropic example

The Claude Code docs have a small example hook on the [Manage costs](https://code.claude.com/docs/en/costs) page. That example is a starting point to copy from. This hook is a finished version of the same idea.

| | Anthropic example | quiet-noisy |
|---|---|---|
| Commands it catches | `npm test`, `pytest`, `go test` only | Installs, builds, tests and progress bars |
| Short output | Filters it too | Keeps all of it |
| Final summary | Drops it | Keeps the last 15 lines |
| Exit code | Lost, so a failed test can look like a pass | Kept |
| Needs `jq` | Yes | No. It needs Node only |
| Permission prompts | Skips them for test commands | Does not change them |

## Requirements

- [Claude Code](https://code.claude.com)
- [Node.js](https://nodejs.org)
- Claude's Bash tool. This is the default on macOS and Linux. On Windows, you need [Git for Windows](https://git-scm.com/download/win), which includes Git Bash.

## Install

**Step 1. Copy the script into your Claude folder.**

macOS / Linux / Git Bash:

```bash
mkdir -p ~/.claude/hooks
curl -o ~/.claude/hooks/quiet-noisy.js https://raw.githubusercontent.com/jasonlohyp/skills/main/hooks/quiet-noisy/quiet-noisy.js
```

You can also download `quiet-noisy.js` from this folder and save it in `~/.claude/hooks/`.

The full path must be:

| System | Path |
|---|---|
| macOS / Linux | `~/.claude/hooks/quiet-noisy.js` |
| Windows | `C:\Users\<you>\.claude\hooks\quiet-noisy.js` |

**Step 2. Turn the hook on.**

Open `~/.claude/settings.json`. Add the `hooks` block below. If the file already has other settings, keep them, and add `hooks` next to them.

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node \"$HOME/.claude/hooks/quiet-noisy.js\"",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

If you already have a `PreToolUse` list, add only the inner `{ "matcher": "Bash", ... }` object to it.

**Step 3. Restart Claude Code.**

The hook now works in every session and every project.

## Check that it works

**1. Check the file.** Run this command. It must print the file path.

```bash
ls ~/.claude/hooks/quiet-noisy.js
```

**2. Test the script by itself.** Run this command. It must print a line of JSON that contains `--filter`.

```bash
echo '{"tool_input":{"command":"npm test"}}' | node ~/.claude/hooks/quiet-noisy.js
```

**3. Check that Claude Code loaded it.** In a Claude Code terminal session, run `/hooks`. The hook must show under `PreToolUse`.

**4. Test it for real.** Ask Claude to run a noisy command, for example `npm install --verbose express` in a test folder. The output must start with `[quiet-hook]`.

## Get the full output

Put `QUIET_HOOK_OFF=1` at the start of a command. The hook then skips that command.

```bash
QUIET_HOOK_OFF=1 npm install --verbose
```

## Uninstall

1. Remove the `quiet-noisy.js` entry from `hooks` in `~/.claude/settings.json`.
2. Delete `~/.claude/hooks/quiet-noisy.js`.
3. Restart Claude Code.

## Notes

- Claude Code does not run this hook in a project whose settings contain `"disableAllHooks": true`.
- The hook covers the Bash tool only. Commands that Claude runs through the PowerShell tool are not filtered.
- To change which commands it catches, edit the `NOISY` list at the top of `quiet-noisy.js`.
- To change which lines it keeps, edit the `IMPORTANT` pattern.
