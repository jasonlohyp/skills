#!/usr/bin/env node
// Claude Code PreToolUse hook (matcher: Bash|PowerShell).
// Hook mode (no args): reads the tool call JSON on stdin. If the command is a
// noisy one (install / build / test / progress bars), it rewrites the command
// so its output is piped through this same script in --filter mode.
// Filter mode (--filter): short output passes through whole; long output is cut
// down to error/failure lines (with a little context) plus the final summary.
// Bypass: put QUIET_HOOK_OFF anywhere in the command
//   Bash:       QUIET_HOOK_OFF=1 npm install
//   PowerShell: $env:QUIET_HOOK_OFF=1; npm install

const fs = require('fs');

const SELF = __filename.replace(/\\/g, '/');
const SHORT_LIMIT = 40;    // output with this many lines or fewer is kept whole
const TAIL_LINES = 15;     // final summary lines always kept
const CONTEXT_AFTER = 3;   // lines kept after each error line
const MAX_KEPT = 150;      // cap on error lines + context

const NOISY = [
  /\b(npm|pnpm|yarn|bun)\s+(install|i|ci|add|update|upgrade|rebuild|test|t|build)\b/,
  /\b(npm|pnpm|yarn|bun)\s+run\s+(build|test|lint|e2e)[\w:-]*/,
  /\bnpx\s+(tsc|jest|vitest|playwright|mocha|eslint|next\s+build|vite\s+build|webpack)\b/,
  /\b(pip3?|uv\s+pip|poetry|pipenv)\s+(install|sync|update|lock)\b/,
  /\b(pytest|tox|nox)\b/,
  /\bpython3?\s+-m\s+(pytest|pip\s+install|unittest)\b/,
  /\bcargo\s+(build|test|install|check|clippy|update)\b/,
  /\bgo\s+(build|test|install|get|mod\s+download)\b/,
  /\bdotnet\s+(build|test|restore|publish)\b/,
  /\b(mvn|mvnw|gradle|gradlew)\b/,
  /(^|[\s;&|(])make(\s|$)/,
  /\bdocker\s+(build|pull|push|compose\s+(build|pull|up))\b/,
  /\bgit\s+(clone|fetch|pull)\b/,
  /\b(wget|choco\s+install|winget\s+install|brew\s+install|apt(-get)?\s+install)\b/,
  /\bterraform\s+(init|plan|apply)\b/,
];

// Whole words only, so package names like "http-errors" do not count as errors.
const IMPORTANT = new RegExp([
  /\b(error|errors?:|fatal|panic|exception|traceback|assert(ion)?)\b/i.source,
  /\b(fail|fails|failed|failing|failure|broken)\b/i.source,
  /\b(warn|warning|deprecated)\b/i.source,
  /\b(cannot|could not|not found|denied|refused|timed out|exit code)\b/i.source,
  /\bERR!|\w+Error\b|✗|✖|×/.source,
].join('|'), 'i');

function wrapBash(cmd) {
  return `{ ${cmd}\n} 2>&1 | node "${SELF}" --filter; exit \${PIPESTATUS[0]}`;
}

// Works in Windows PowerShell 5.1 and PowerShell 7. Output is collected first,
// so the exit code of the real command is saved before node runs. Stderr lines
// arrive as error records; Exception.Message turns them back into plain text.
function wrapPowerShell(cmd) {
  const toText = 'if ($_ -is [System.Management.Automation.ErrorRecord]) { $_.Exception.Message } else { "$_" }';
  return [
    '$global:LASTEXITCODE = 0',
    '$OutputEncoding = New-Object System.Text.UTF8Encoding $false',
    `$__qOut = & {\n${cmd}\n} 2>&1 | ForEach-Object { ${toText} }`,
    '$__qCode = $LASTEXITCODE',
    `$__qOut | node "${SELF}" --filter`,
    'exit $__qCode',
  ].join('; ');
}

function hookMode() {
  let input;
  try { input = JSON.parse(fs.readFileSync(0, 'utf8')); } catch { return; }
  const cmd = input?.tool_input?.command;
  if (typeof cmd !== 'string' || !cmd.trim()) return;
  if (cmd.includes('QUIET_HOOK_OFF') || cmd.includes('quiet-noisy.js')) return;
  if (!NOISY.some((re) => re.test(cmd))) return;

  const wrapped = input.tool_name === 'PowerShell' ? wrapPowerShell(cmd) : wrapBash(cmd);
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      updatedInput: { ...input.tool_input, command: wrapped },
    },
  }));
}

function filterMode() {
  const chunks = [];
  process.stdin.on('data', (c) => chunks.push(c));
  process.stdin.on('end', () => {
    const raw = Buffer.concat(chunks).toString('utf8');
    const lines = raw
      .replace(/\x1b\[[0-9;?]*[ -\/]*[@-~]/g, '')          // ANSI colours / cursor moves
      .split(/\r?\n/)
      .map((l) => l.split('\r').pop())                      // progress bars: keep last redraw
      .filter((l, i, a) => !(l.trim() === '' && (a[i - 1] ?? '').trim() === '')); // squeeze blanks

    if (lines.length <= SHORT_LIMIT) { process.stdout.write(lines.join('\n')); return; }

    const tailStart = lines.length - TAIL_LINES;
    const keep = new Set();
    let kept = 0;
    for (let i = 0; i < tailStart && kept < MAX_KEPT; i++) {
      if (!IMPORTANT.test(lines[i])) continue;
      for (let j = i; j <= Math.min(i + CONTEXT_AFTER, tailStart - 1); j++) {
        if (!keep.has(j)) { keep.add(j); kept++; }
      }
    }

    const out = [];
    let last = -1;
    for (const i of [...keep].sort((a, b) => a - b)) {
      if (i > last + 1) out.push(`  … ${i - last - 1} lines cut …`);
      out.push(lines[i]);
      last = i;
    }
    if (tailStart > last + 1) out.push(`  … ${tailStart - last - 1} lines cut …`);
    out.push(...lines.slice(tailStart));

    process.stdout.write(
      `[quiet-hook] ${lines.length} lines → ${out.length}. ` +
      `Re-run with QUIET_HOOK_OFF=1 for full output.\n` + out.join('\n'),
    );
  });
}

if (process.argv.includes('--filter')) filterMode(); else hookMode();
