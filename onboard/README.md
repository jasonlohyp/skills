# onboard

Set up Claude Code with a short, plain work style. You paste one prompt into Claude Code. Claude does the work. There is no installer script.

Every step skips and reports instead of failing. This helps on a company laptop that blocks downloads, hooks or plugins.

## What you get

| Item | What it does | Source |
|---|---|---|
| ELI5 style | Claude answers in short, plain English. | [ELI5.md](ELI5.md) |
| Work rules | Claude reports once per turn, decides small things itself and checks tools before it suggests them. | [WORK-RULES.md](WORK-RULES.md) |
| quiet-noisy hook | Cuts long install, build and test output to errors and the summary. | [hooks/quiet-noisy](../hooks/quiet-noisy/) |

## Quick setup

Use this prompt when downloads are blocked. It needs no internet. It sets up the style and the work rules only.

Paste it into Claude Code:

````text
(Colleagues: if you want normal answers instead of short plain ones, delete step 1 before you send this.)

Set up my work style on this computer. Keep everything that already exists. Do not ask me anything. Report at the end.

Step 1, style. Write the text between STYLE START and STYLE END to `~/.claude/output-styles/ELI5.md`. Create the folder if needed. In `~/.claude/settings.json`, set `"outputStyle": "ELI5"`. Create the file if it is missing. Keep all other keys. Keep the file valid JSON.

Step 2, rules. In `~/.claude/CLAUDE.md` (create it if missing), put the text between RULES START and RULES END between the marker lines `<!-- onboard:work-rules start -->` and `<!-- onboard:work-rules end -->`. If the markers already exist, replace only what is between them. If not, add the block at the end of the file. Keep everything else in the file.

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
# Work rules (from jasonlohyp/skills onboard)

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
- "Stop" or "I want to sleep" means: stop all work, save it, and start nothing new.

## My words
| I say | Do this |
|---|---|
| "brainstorm" | Use `superpowers:brainstorming` before any creative work. |
| "grill me" | Use the `grilling` skill. |
| "bug", "broken", "fix this" | Use `superpowers:systematic-debugging` first. |
=== RULES END ===
````

## Full setup

Use this prompt when you have internet. It adds the hook only. It does not set the style or the rules, so run the quick prompt too.

Paste it into Claude Code:

````text
Install my Claude Code tools. Keep everything that already exists. If a step fails or is blocked (download blocked, company policy, missing program), skip it, go on, and report it at the end. Do not ask me anything.

`~` means my home folder. In commands, use the full path (for example `$HOME/...`), because some shells do not expand `~`.

1. Run `node --version`. If Node is missing, skip step 2 and say so.
2. Hook. Download `https://raw.githubusercontent.com/jasonlohyp/skills/main/hooks/quiet-noisy/quiet-noisy.js` to `~/.claude/hooks/quiet-noisy.js`. In `~/.claude/settings.json`, under `hooks.PreToolUse`, add this entry only if no existing entry already mentions `quiet-noisy.js`: `{"matcher": "Bash|PowerShell", "hooks": [{"type": "command", "command": "node \"$HOME/.claude/hooks/quiet-noisy.js\"", "timeout": 10}]}`. Keep all other keys and entries. Then test it: pipe `{"tool_name":"Bash","tool_input":{"command":"npm test"}}` into `node "$HOME/.claude/hooks/quiet-noisy.js"`. The output must contain `--filter`.
3. Blocks. If any settings file sets `disableAllHooks`, or company policy blocks hooks or downloads, say which.
4. Report. Show a table with the columns Item, Done or skipped, Why. Then tell me to restart Claude Code.
````

## Skills to install yourself

The work rules use 3 outside skills. Install them yourself from their own pages:

| Skill | Gives you | Where |
|---|---|---|
| superpowers | "brainstorm" and "bug" | Anthropic's official plugin store: `/plugin install superpowers@claude-plugins-official` (first `/plugin marketplace add anthropics/claude-plugins-official` if it is not found) |
| grilling | "grill me" | https://github.com/mattpocock/skills |
| humanizer | text that does not sound AI-made | https://github.com/blader/humanizer |

## Claude chat app

The chat app (claude.ai or the Chat tab in the desktop app) cannot run prompts that write files. Set the style by hand instead.

1. Open the style menu in a chat. Choose "Create & edit styles".
2. Create a custom style.
3. Paste the body of [ELI5.md](ELI5.md). The body is the text after the frontmatter (the part after the second `---` line).

If you do not see a style menu, paste the same text into Settings > Profile > personal preferences.

## Check it works

1. Restart Claude Code.
2. Ask: "What is your output style?" The answer must say ELI5.
3. Ask Claude to run a command with long output, such as `npm install --verbose` in a test folder. The output starts with `[quiet-hook]`.

## Update

Run the same prompt again. The markers stop a second copy of the rules. The hook check stops a second hook entry.

## Uninstall

1. Delete `~/.claude/output-styles/ELI5.md`.
2. Remove `outputStyle` from `~/.claude/settings.json`.
3. Delete the marked block from `~/.claude/CLAUDE.md`. It runs from `<!-- onboard:work-rules start -->` to `<!-- onboard:work-rules end -->`.
4. Remove the quiet-noisy hook entry from `~/.claude/settings.json`. Delete `~/.claude/hooks/quiet-noisy.js`.

Skills you installed yourself: remove them the way you installed them.

## Notes

- It works on Windows, macOS and Linux.
- The hook needs Node.js.
- A company admin can block hooks or downloads. The prompt then reports it.
- For hook details, see [quiet-noisy](../hooks/quiet-noisy/).
