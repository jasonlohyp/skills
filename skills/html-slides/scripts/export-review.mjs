#!/usr/bin/env node
/* Exports one picture per step and all speaker notes, for the critics in step 9.
   Usage: node export-review.mjs deck.html out-folder */
import fs from 'node:fs';
import path from 'node:path';
import { openBrowser, sleep } from './lib/browser.mjs';

const [file, outDir] = process.argv.slice(2);
if (!file || !outDir) { console.error('Usage: node export-review.mjs deck.html out-folder'); process.exit(2); }
fs.mkdirSync(outDir, { recursive: true });
const b = await openBrowser({ width: 1600, height: 900 });
try {
  await b.open(file, '?still'); await sleep(800);
  const plan = await b.eval('Deck.plan.map(p => ({ slide: p.i + 1, step: p.k + 1 }))');
  for (let i = 0; i < plan.length; i++) {
    await b.eval(`Deck.goto(${i}, { animate: false, force: true })`);
    await sleep(350);
    await b.shot(path.join(outDir, `slide-${String(plan[i].slide).padStart(2, '0')}-step-${String(plan[i].step).padStart(2, '0')}.png`));
  }
  const notes = await b.eval(`Deck.slides.map((s, i) => { const n = s.querySelector('.notes'); return '## Slide ' + (i + 1) + '\\n\\n' + (n ? n.textContent.trim() : '(no notes)'); }).join('\\n\\n')`);
  fs.writeFileSync(path.join(outDir, 'notes.md'), `${notes}\n`);
  console.log(`${plan.length} pictures and notes.md are in ${outDir}. Moves are off, so these show the end state of each step.`);
} finally { await b.close(); }
