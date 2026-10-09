# lean-agent-build

A Claude Code skill for building an app or game over many sessions, with fresh AI reviewers, on a tight weekly usage limit.

Fresh subagents give honest reviews, because they have not seen the chat. But reviewers, long sessions and big models use up a weekly limit fast. This skill keeps the reviews and cuts the cost.

## What it does

- **Cheap by default.** The main session and all agents run on Sonnet, mostly at medium effort (the code reviewer at high). Opus runs only as a subagent (for example the code review of a step marked `Opus review: yes`), or right after `/clear`. Never switch models mid-chat.
- **Small agents.** Each agent has its own file with a model, an effort level, a turn cap and a short tool list.
- **Reviews with a bar.** Each critic tags findings MUST FIX, SHOULD FIX or NIT. The loop stops at 0 MUST FIX. If round 3 still has a MUST FIX, the owner decides; one last check follows a fix. It never runs forever.
- **Owner decisions stay closed.** Critics cannot re-open what the owner decided. Rejected findings are logged, so they come back only with a new concrete failure.
- **Git is the memory.** Every review round is a commit. A `reviewed` tag marks the last reviewed code, so the code reviewer reads only what is new.
- **Short sessions.** Progress lives in `docs/STATUS.md`. After each batch you run `/clear`, and the next session reads STATUS and goes on.
- **One agent at a time.** No parallel teams. The playtester (the most expensive agent) runs only when you say yes.

## What you get in a project

```
CLAUDE.md                  house rules + "invoke lean-agent-build"
.claude/settings.json      main session on Sonnet
docs/STATUS.md             phase, next step, open review loop
docs/PLAN.md               build steps
docs/REVIEW-LOG.md         fixed, rejected and open findings
docs/LATER.md              ideas that are out of scope
.claude/agents/
  design-critic.md         attacks the spec or a plan
  visual-critic.md         reviews screenshots
  code-reviewer.md         reviews the diff of a build step
  playtester.md            plays the build blind in a browser
  builder.md               builds one big step from a brief
scripts/shots.mjs          takes screenshots for the visual critic
```

## Install

Claude Code only. It needs subagents and `/clear`, so it does not work in the claude.ai chat. The playtester also needs a browser MCP server (the desktop app's built-in browser, Claude in Chrome, or Playwright MCP).

Personal (all your projects):

```bash
git clone https://github.com/jasonlohyp/skills.git
```

```bash
mkdir -p ~/.claude/skills
```

```bash
cp -r skills/skills/lean-agent-build ~/.claude/skills/
```

On Windows PowerShell, use these in place of the last two commands:

```powershell
New-Item -ItemType Directory -Force $HOME\.claude\skills | Out-Null
```

```powershell
Copy-Item -Recurse skills\skills\lean-agent-build $HOME\.claude\skills\
```

Or for one project only, copy the folder to `<project>/.claude/skills/lean-agent-build/`.

To update, pull and copy the folder again.

## Use

Run the main session on Sonnet at medium effort. Setup adds `.claude/settings.json`, which sets the model. Run `/effort medium` yourself.

In a new project, tell Claude: "Set up this project with lean-agent-build." Claude makes the files above from `templates.md`. In later sessions, Claude reads `docs/STATUS.md` and goes on.

Watch your burn with `/usage` once per session.

## How it differs from a fan-out loop

A fan-out loop ("spawn sub-agents on everything, loop until wowed") gets great results but burns a weekly limit in hours. This skill gives up parallel speed and endless polish. It keeps fresh, honest reviews, with a hard stop on cost.

| | gauntlet-loop (fan-out) | lean-agent-build |
|---|---|---|
| What it gives you | One prompt: "fan out, loop until wowed" | A full working method for many sessions |
| Goal | Highest quality | Honest reviews at the lowest cost |
| Agents | No limit, in parallel | 1 at a time, only when a step needs it |
| Models | Not set | Sonnet everywhere; Opus only for a hard code review |
| Loop stop | "Utterly wowed" | 0 MUST FIX, or 3 rounds, then the owner decides |
| Memory between sessions | None | STATUS + review log + git commits and a `reviewed` tag |
| Owner control | Low | High: closed decisions, playtests only on the owner's yes |
| Weak point | Uses up a weekly limit in hours | Bigger skill file (about 2,500 words); slower, less "wow" |
| Best for | One big build with no usage limit | Hobby projects over weeks on a tight limit |

Scores come from a 20-round loop of fresh, independent Opus reviewers on this skill. The gauntlet-loop score is the author's estimate.
