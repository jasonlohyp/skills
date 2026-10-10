---
name: lean-agent-build
description: Use in Claude Code when starting, setting up, or resuming (the project has docs/STATUS.md and .claude/agents/) a multi-session app or game build that needs fresh, unbiased subagent reviews and a review loop on a tight weekly usage limit.
---

# Lean agent build

## Overview
Fresh subagents give unbiased reviews. But reviews, long sessions and big models eat a weekly limit fast. This skill keeps the reviews and cuts the bill: **Sonnet and medium effort by default (code reviewer: high), small agents with capped turns, a hard bar on every loop, and short sessions.** Git is the memory: every round is a commit, and a `reviewed` tag marks the last reviewed code.

The lead session is the orchestrator. It talks with the owner, writes the spec and plan, builds small steps, and decides. Subagents do two jobs only: review with fresh eyes, or build one big step from a brief. They cannot ask the owner questions, so they never author the design.

Claude Code only. It needs `.claude/agents/`, the Agent tool, git and `/clear`.

## Where the cost goes (heuristic, biggest first; watch `/usage` once per session)
1. **The lead's model and effort.** The lead runs every turn. Use Sonnet (`/model sonnet`) and `/effort medium`. The prompt cache is per model, so a `/model` switch mid-chat re-writes the whole chat. For a hard step, run a subagent with `model: "opus"` on the Agent call, or switch only right after `/clear`.
2. **Idle sessions.** The chat is cached only while you work. After an idle gap (often 5 min; it depends on your plan) the next turn re-writes the whole chat at more than full input price. Update STATUS, commit, then tell the owner to `/clear` **before** stepping away.
3. **Each subagent starts cold.** A spawn after the cache window has passed pays cache-write price (more than full input) on its first turn for its body, tools and CLAUDE.md. Inside one run, turns hit cache; cost then grows with what it reads, especially images. Keep bodies and tool lists short, name exactly what to read, and set `maxTurns` and `effort`.
4. **Critic rounds.** Cap them, and send later rounds only the changes.

## New session in an existing project
Check your model in the system prompt. Not Sonnet? Tell the owner once: run `/model sonnet` right after the next `/clear`. Effort is not visible to you, so remind the owner once, in the first session after setup: type `/effort medium` at the start of each session. Then run `git log -1 --format=%s` and read `docs/STATUS.md`, and use the Resume table. Find sections in big docs with the Grep tool (`^## `) and read only that range.

## Set up a new project (once)
1. No spec yet? Use `superpowers:brainstorming` with the owner, but save the spec as `docs/SPEC.md` and stop when the spec is written: do not hand off to `writing-plans`. (No superpowers: draft it with at most 3 questions.) Do not review it yet.
2. From `templates.md` in this skill folder, create: `.claude/settings.json` (lead on Sonnet), `CLAUDE.md`, `docs/STATUS.md`, `docs/PLAN.md`, `docs/REVIEW-LOG.md`, `docs/LATER.md`, a `## Owner decisions (closed)` section at the end of the spec, and `.claude/agents/<name>.md` for each agent the project needs (keep `release-checker` if the app will go to a store; add `art-director` and `artist` only if the project needs art, see step 4).
3. Screenshots.
   - **Browser app:** (a) every screen opens from the URL (`?screen=<name>`; seeded game states and mockups too, mockups at `mockups/<name>.html`). (b) Record the start command and `BASE_URL` in CLAUDE.md (Claude desktop app: also `.claude/launch.json`). No dev server yet? Use `npx -y http-server -p 5173 -c-1`; the step that adds the real server updates (b). (c) `npm i -D playwright`, then `npx playwright install chromium`. (d) Copy `shots.mjs` from this skill folder to `scripts/shots.mjs`. It takes a base URL, a folder and screen names, and prints the PNG paths.
   - **Not a browser app:** mockups are still web pages, so set up (b)–(d) for them. For the real app, the owner drops phone shots into the folder, and the visual loop runs only when the owner says so.
4. **Art (only if the project needs art; skip otherwise).** Create the `art-director` and `artist` agents, `scripts/art/art.mjs` and `scripts/art/package.json` (copy both from this skill folder), `<art folder>/README.md` (file name and role per asset) and `docs/art-log.md`. Run `npm install` in `scripts/art`. Add the art flow (see Art flow below) to the CLAUDE.md house rules. Tell the owner to set the key once, outside the project (Windows: `setx OPENAI_API_KEY "..."`; Mac/Linux: add it to the shell profile), then open a new session. Never ask the owner to paste a key in chat. Ask the owner the art questions in Talking to the owner.
5. Set STATUS **Next** to "design-critic loop on the spec" (or "PLAN step 1" if the spec was already reviewed). If the look matters, PLAN step 1 is "mockups": static `mockups/<name>.html` pages, a `step 1: plan` commit, a visual-critic loop, then **stop and show the owner the mockups**. Apply the owner's changes, add the chosen look to Owner decisions, then build-order step 5 (update STATUS, `step 1: done` commit, `git tag -f reviewed`).
6. Git: `git init` if needed. Write `.gitignore` with the stack's standard ignores (deps, build output, `.env*` but `!.env.example`) plus `docs/shots/` and `.claude/settings.local.json`. Check `git status --short` before the first add. Then `git add -A`, `git commit -m "setup"` and `git tag -f reviewed` (setup tooling is exempt from review; on an existing codebase, tell the owner the tag here means "baseline": the old code was not reviewed, or run one code-reviewer pass on the riskiest files if the owner says yes). No remote? Remove "push" from the house rules.
   Later, when an app scaffold needs an empty folder (for example `create-expo-app`), make it in a temp folder and merge it in: never replace `CLAUDE.md`, `docs/`, `.claude/`, `scripts/`, `mockups/`; merge `package.json` and `.gitignore`.
7. A new `.claude/agents/` folder loads only at session start. Tell the owner to quit and open a new session (CLI: plain `claude`, not `--continue`; the old chat is waste now).

## When to use a subagent
- **Reviewers always run as subagents.** They exist to be fresh and unbiased.
- **Delegate build or research only when ALL three are true:** it makes a lot of output; you need only a short report; this session still has a long way to go. Else do it yourself. Up to ~3 files: never delegate.

## Other skills (use them if installed)
| Moment | Skill |
|---|---|
| No spec yet | `superpowers:brainstorming` |
| Mockups and any UI step | `frontend-design` |
| Expo or React Native project: setup, native UI, dev builds, App Store submit | `expo` |
| The lead or the builder writes code | `superpowers:test-driven-development` (test first, then code) |
| A test fails or a bug shows up | `superpowers:systematic-debugging` |
| Never with this skill | `superpowers:subagent-driven-development`, `superpowers:executing-plans`, `superpowers:writing-plans`: they add per-task agents and their own plan, which this skill replaces |

List the project's skills in CLAUDE.md (template line "Skills"), so every session and the builder use them.

## Resume table
After `/clear`, run `git log -1 --format=%s`. The last commit name picks the row. STATUS adds the details (step, open items).
| Last commit | Next action |
|---|---|
| `setup` | design-critic loop on the spec (or the first PLAN step, if STATUS says the spec is reviewed) |
| `wip: <critic> round N` (N < 3, MUST FIX fixed) | round N+1 of that loop |
| `wip: <critic> round N` (loop done) | design-critic on the spec: tag `reviewed` if not on HEAD, then the first PLAN step. Design-critic on a step: build. Visual: code loop. Code: build-order step 5 |
| `wip: <critic> round 3` | STATUS says awaiting owner: ask the owner again |
| `wip: <critic> round 3 fix` | the round-4 check |
| `step N: plan` | mockup step: visual-critic loop, show the owner, then build-order step 5. Else: design-critic loop if the table below says so, then build |
| `step N: build` | visual loop (big look change), then code loop |
| `step N: done` | the next PLAN step, or push and stop if the batch is done |
| `play: logged` | the next PLAN step, or stop |
| `feedback: logged` | the next PLAN step |
| `art: logged` | the next PLAN step |

A loop is done when the log's last round for it has 0 MUST FIX, or round 3/4 went to the owner. Tag `reviewed` only at `step N: done` and at the end of the spec loop.

## Who runs when
| Agent | Model | When |
|---|---|---|
| design-critic | Sonnet | spec change; a PLAN step that adds a mechanic, screen or data model (skip small steps and the mockup step, and say so) |
| visual-critic | Sonnet | after a mockup or a big look change |
| code-reviewer | Sonnet; `model: "opus"` on the call when the PLAN step says `Opus review: yes` (then for every round of that step) | end of each build step |
| playtester | Sonnet | **only on the owner's yes, each run** (most expensive) |
| builder | Sonnet | big build steps only |
| art-director | Sonnet | **only on the owner's yes for an art batch**: DIRECT once before any image, REVIEW once per draft |
| artist | Sonnet | **only on the owner's yes, each run** (costs money per image) |
| release-checker | Sonnet | once before each App Store or store submit: privacy, permissions, data, purchases, store rules |

One agent at a time, one job each (the artist and art-director too). No parallel team. No per-task reviewers.

**Order per build step N:**
1. Write step N in `docs/PLAN.md`. `git add -A`, then `git commit -m "step N: plan"`. Design-critic loop on it, if the table says so.
2. Build, test first (see Other skills). Run the tests. Builder report lists unfinished work or ran out of turns? Finish it yourself if small, or re-run once with a narrower brief. Then `git add -A`, then `git commit -m "step N: build"`.
3. Visual-critic loop, if there was a big look change.
4. Code-reviewer loop. Round 1 reads the review diff (CLAUDE.md, "Review diff"). Skip the loop if its `--stat` form is empty.
5. Update STATUS. `git add -A`, then `git commit -m "step N: done"`, then `git tag -f reviewed`.
6. When the owner's batch is done (the steps the owner asked for this session), push if a remote exists: first time `git push -u origin HEAD`, later `git push`; then `git push -f origin reviewed`. The owner plays.
7. **Owner feedback** after playing: turn it into PLAN steps (or LATER.md items), update STATUS, then `git add -A`, then `git commit -m "feedback: logged"`. Do this before any `/clear`, so no feedback lives only in the chat.

## The review loop and its bar (every critic except the playtester)
Severities, defined in each agent file: **MUST FIX** names a concrete failure (crash, data loss, wrong behavior vs the spec, a broken user-visible feature, a contradiction, not buildable, the target violates an owner decision or house rule). **SHOULD FIX** is clearly better. **NIT** is taste. No concrete failure named → it is SHOULD FIX.

One round:
1. Fresh critic. Its prompt names the target, the spec path and the round number. `<files>` below = the files the fixes touched (`git diff HEAD~1 --name-only`; for code, leave out docs, .claude, CLAUDE.md, mockups and lockfiles). Inputs:

| Critic | Round 1 | Round 2+ (plus last round's MUST FIX items and items still `open`) |
|---|---|---|
| design-critic | the spec or the PLAN step | the fix diff (`git diff HEAD~1 -- <files>`), pasted into the prompt (it has no Bash) |
| visual-critic | PNG paths + house rules that affect the look | fresh PNGs of the changed screens |
| code-reviewer | the review diff command from CLAUDE.md | the command `git diff HEAD~1 -- <files>` |

   PNGs: start the dev server, run the shots script into `docs/shots/step<N>-r<round>/` (mockup phase: `docs/shots/mockup-r<round>/`), stop the server, pass the paths the script printed.
2. **Partial report?** If the report has no findings list or says it ran out of turns, it is not a round. Raise `maxTurns` in the agent file and re-run once. Still partial: tell the owner and narrow the target (fewer files or screens). A partial report never counts as 0 MUST FIX.
3. **0 MUST FIX?** The loop is done. Change no code or spec. Do round step 6 (log + commit) with SHOULD FIX items logged as `deferred` (or moved to LATER.md), so every change under the `reviewed` tag was seen by a critic.
4. **MUST FIX in round 1 or 2?** Fix each one, plus SHOULD FIX only if cheap (skipped ones are `deferred`). Reject a MUST FIX only if it contradicts an owner decision or is factually wrong (cite file:line or evidence). If every MUST FIX was rejected and nothing changed, the loop is done. Do not log NITs.
5. **MUST FIX in round 3?** Do not fix. Log the items as `open`, set STATUS to "round 3: awaiting owner", commit as `wip: <critic> round 3`. Then give the owner one line per item, with your pick: fix my way / cut the feature / accept and test in play. On "fix my way" or "cut": make the change, log it, commit as `wip: <critic> round 3 fix`, then run one round-4 check on `git diff HEAD~1 -- <files>`. A MUST FIX in round 4 goes to the owner again, who picks accept or revert the round-3 change only; there is no round 5. On accept: the loop is done; accepted items stay `open` and go into STATUS Next as a play-test check.
6. Log every item in `docs/REVIEW-LOG.md` (step, round, result: fixed / rejected + reason / deferred / open). Update the loop line in STATUS. Then `git add -A`, then `git commit -m "wip: <critic> round <N>"` (one commit per round, fixes and log together).

- **Stop early** if an item the log marks fixed (this phase) comes back. Check the diff first: if the fix is missing, finish it. If it is there and the critic still objects, it is a design conflict. Ask the owner.
- **Spec loop done** (setup): the last `wip: design-critic round N` commit also sets STATUS Next to "PLAN step 1"; run `git tag -f reviewed` right after it. Then show the owner the top 3 design SHOULD FIX items, one line each, with your pick. Picked items go into the first build step (after mockups, if any), so its design check covers them.
- Run a step's rounds back to back. A spawn within the cache window of the last one reuses part of its cache (same agent and model only).

**Art flow** (only if the project has the art agents; images cost money): (1) art-director DIRECT writes the brief and the prompts; the lead saves them in `docs/ART-BRIEF.md`. (2) Artist makes ONE low-quality draft per prompt, word for word. (3) Art-director REVIEW says PASS or FAIL. (4) On PASS, the artist makes one medium (or high) final. On FAIL, retry with the changed prompt: max 2 retries per asset, then ask the owner. Never prompt the artist without a brief. The owner judges the final look. Every image is logged in `docs/art-log.md`; commit each asset as `art: logged`.

**Playtester:** one run per owner yes. A partial report: tell the owner; never re-run without a yes. Start the app (see Dev server below), pass the URL, stop the server after the report. It cannot see the log or spec, so drop its findings that hit an owner decision or a rejected item. Log the rest as step `play`: each MUST FIX becomes a PLAN step only if the owner says yes; the rest go to LATER.md. Then `git add -A`, then `git commit -m "play: logged"`.

**Dev server:** Claude desktop app: `preview_start` (stop with `preview_stop`). CLI: Bash with `run_in_background`; read its output (or use Monitor) until the URL appears before you use it; stop it with TaskStop when done.

## Session hygiene
- One commit per round and per build step. One push per batch (if a remote exists).
- After each batch (push first if a remote exists), tell the owner to run `/clear` (STATUS was updated in the "done" commit). Before any break: update STATUS, commit, `/clear`.
- Never paste big output: use `tail` (PowerShell: `Select-Object -Last N`), counts, or the Grep tool. Never view screenshots in the lead; the visual critic does that.
- A phase (spec, mockups, build v1, polish) ends when the owner says so or PLAN moves on. At phase end: in the log, delete fixed and one-off rejected rows, move lasting rejections into Owner decisions, move deferred rows to LATER.md, and keep owner-accepted `open` rows until play-tested. In STATUS, move old Done items out of STATUS (keep it under 40 lines).

## Talking to the owner
Short and plain. Decide routine design and polish yourself and say the call in one line. Ask only about scope, cost (playtests, Opus for the lead, extra rounds, image budget) or a house rule. For art, get a decision once on AI-art rules: store disclosure, copyright, and no real studio or artist names in prompts. Two options max, with your pick. When the owner decides something, add it to Owner decisions.

## Red flags: stop and re-read this skill
| Thought | Reality |
|---|---|
| "Spawn all the reviewers in parallel, it's faster" | One at a time, only the one this step needs. |
| "Run the playtester again to check" | Most expensive agent. Only on the owner's yes. |
| "Switch to Opus for this bit, then back" | Each switch re-writes the cache. Opus subagent, or switch only after `/clear`. |
| "Use general-purpose for the build, it's easier" | It has every tool and no turn cap. Use the builder file. |
| "This MUST FIX is overkill, I'll log it rejected" | Only an owner decision or evidence rejects a MUST FIX. Else fix or ask. |
| "Loop until it's good" | Fresh harsh critics always find something. 0 MUST FIX or 3 rounds. |
| "Keep going, this session has context" | Context lives in STATUS, the log and git. Commit, update, `/clear`. |
| "Pass the agent a summary of the chat" | Name the file, or paste a small doc diff. The agent reads only that. |
| "Let the artist loop until it looks good" | Max 2 retries per asset. The owner judges the look. Every image costs money. |
| "Install a small community MCP server for images" | Check its source and age first. Prefer the official library in a small script we own. |
| "Let an architect agent write the spec" | A subagent cannot ask the owner anything. The lead writes the spec with the owner; agents only review it. |
