# onboard

Set up Claude Code with a short, plain work style in 3 steps. For each step, you paste a prompt into Claude Code, and Claude does the work.

## What you get

| Item | What it does | Source |
|---|---|---|
| ELI5 style | Claude answers in short, plain English. | [ELI5.md](ELI5.md) |
| Work rules | Claude reports once per turn, decides small things itself and checks tools before it suggests them. | [WORK-RULES.md](WORK-RULES.md) |
| quiet-noisy hook | Cuts long install, build and test output to errors and the summary. This saves tokens. | [hooks/quiet-noisy](../hooks/quiet-noisy/) |

## Step 1: Style and rules

This step needs no internet. Paste this into Claude Code:

````text
Set up my work style on this computer. Keep everything that already exists. Do not ask me anything. Report at the end. If a step is blocked or fails, skip it and report it. If `settings.json` is not valid JSON, do not change it; skip and report.

Step 1, style. Write the text between STYLE START and STYLE END to `~/.claude/output-styles/ELI5.md`. Create the folder if needed. In `~/.claude/settings.json`, set `"outputStyle": "ELI5"`. Create the file if it is missing. Keep all other keys. Keep the file valid JSON.

Step 2, rules. In `~/.claude/CLAUDE.md` (create it if missing), put the text between RULES START and RULES END between the marker lines `<!-- onboard:work-rules start -->` and `<!-- onboard:work-rules end -->`. If the markers already exist, replace only what is between them. If not, add the block at the end of the file. Keep everything else in the file. If only one marker exists, do not change the file; skip and report.

Step 3, report. List each file you changed. List each step you skipped and why. Tell me to restart Claude Code.

=== STYLE START ===
---
name: ELI5
description: keep it simple pls
keep-coding-instructions: true
---
It's been a long day and my brain is fried, talk to me like I'm 5.
Only report to me in ASD-STE100 Simplified Technical English. That means approved plain words, active voice, and one instruction or idea per sentence.
Small words, short sentences, short paragraphs. If you have to use a big word, explain it right after. Only return what's actually necessary.
Just tell me what you did, did it work, what do I do now.
If I have to decide something: 2 options max, the context I need to pick fast, and which one you'd go with.
Keep paths and commands exact. I have no brain cells left for the rest.
=== STYLE END ===

=== RULES START ===
# Work rules

## Reporting
- One message per turn, at the end. Write no text between tool calls.
- Say what changed, whether it worked, and what I do next.
- Two options max, with your pick.

## Deciding
- Decide small calls yourself and say each one in one line. Never write "say X if you want it".
- Before a big task, name the goal in one line and add one idea I did not think of, with your pick. Then do what I say.
- Run the safe next step yourself (a re-check, a re-run). Do not ask me for it.
- Do not invent a rule I did not give. Check where a rule comes from first.

## Quality
- Before I see anything I will share, a fresh reviewer (a new subagent) checks it. Stop the review loop when it stops improving, and say so.
- When I give a reference (an image, a document, an example), say back what it shows before you build from it.
- Text that people will read must not sound AI-made. Run the humanizer skill on it.

## Tools
- Before you propose a tool or a paid service, check its price, its exact free limit (official page), its commercial license and user reviews. Name a free option too.

## Stop
- "Stop" means: stop all work, save it, and start nothing new.

## My words
| I say | Do this |
|---|---|
| "brainstorm" | Use `superpowers:brainstorming` before any creative work. |
| "grill me" | Use the `grilling` skill. |
| "bug", "broken", "fix this" | Use `superpowers:systematic-debugging` first. |
=== RULES END ===
````

## Step 2: The hook

This step needs internet and [Node.js](https://nodejs.org). Paste this into Claude Code:

````text
Install the quiet-noisy hook. Keep everything that already exists. If a step fails or is blocked (download blocked, company policy, missing program), skip it, go on, and report it at the end. Do not ask me anything.

`~` means my home folder. In commands, use the full path (for example `$HOME/...`), because some shells do not expand `~`.

1. Run `node --version`. If Node is missing, skip step 2 and say so.
2. Hook. Download `https://raw.githubusercontent.com/jasonlohyp/skills/main/hooks/quiet-noisy/quiet-noisy.js` to `~/.claude/hooks/quiet-noisy.js`. In `~/.claude/settings.json`, under `hooks.PreToolUse`, add this entry only if no existing entry already mentions `quiet-noisy.js`: `{"matcher": "Bash|PowerShell", "hooks": [{"type": "command", "command": "node \"$HOME/.claude/hooks/quiet-noisy.js\"", "timeout": 10}]}`. Keep all other keys and entries. If the download fails, do not add the settings entry. If an entry for `quiet-noisy.js` exists with matcher `Bash`, change it to `Bash|PowerShell`. Then test it: pipe `{"tool_name":"Bash","tool_input":{"command":"npm test"}}` into `node "$HOME/.claude/hooks/quiet-noisy.js"`. The output must contain `--filter`.
3. Blocks. If any settings file sets `disableAllHooks`, or company policy blocks hooks or downloads, say which.
4. Report. Show a table with the columns Item, Done or skipped, Why. Then tell me to restart Claude Code.
````

## Step 3: Outside skills

The work rules use 3 outside skills. Install them yourself:

| Skill | Gives you | Where |
|---|---|---|
| superpowers | "brainstorm" and "bug" | In Claude Code: `/plugin install superpowers@claude-plugins-official` (first `/plugin marketplace add anthropics/claude-plugins-official` if it is not found) |
| grilling | "grill me" | https://github.com/mattpocock/skills |
| humanizer | text that does not sound AI-made | https://github.com/blader/humanizer |

## Check it works

1. Restart Claude Code.
2. Ask: "What is your output style?" The answer must say ELI5.
3. Ask Claude to run `npm install --verbose express` in a test folder. The output starts with `[quiet-hook]`.

## Claude chat app (optional)

The ELI5 style above works in Claude Code only. The chat app (claude.ai, or the Chat tab in the desktop app) has its own styles. To use ELI5 there too:

1. In a chat, open the style menu and choose "Create & edit styles".
2. Create a custom style, and paste the text of [ELI5.md](ELI5.md) after the second `---` line.

## Uninstall

1. Delete `~/.claude/output-styles/ELI5.md`, and remove `outputStyle` from `~/.claude/settings.json`.
2. In `~/.claude/CLAUDE.md`, delete the block from `<!-- onboard:work-rules start -->` to `<!-- onboard:work-rules end -->`.
3. Remove the quiet-noisy entry from `~/.claude/settings.json`, and delete `~/.claude/hooks/quiet-noisy.js`.
4. Restart Claude Code.

## Notes

- It works on Windows, macOS and Linux.
- For hook details, see [quiet-noisy](../hooks/quiet-noisy/).
