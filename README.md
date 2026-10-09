# skills

Skills, hooks and tools for [Claude Code](https://code.claude.com).

Each item has its own folder with a README that explains what it does and how to install it.

## Skills

A skill is a set of instructions that Claude loads only when a task needs it.

| Skill | What it does |
|---|---|
| [lean-agent-build](skills/lean-agent-build/) | Builds an app or game over many sessions with fresh AI reviewers and a review loop with a hard stop, on a tight weekly usage limit. |

## Hooks

A hook is a small script that Claude Code runs at a set point, for example before each command.

| Hook | What it does |
|---|---|
| [quiet-noisy](hooks/quiet-noisy/) | Cuts long install, build and test output down to errors, failures and the final summary. This saves tokens. |

## License

[MIT](LICENSE)
