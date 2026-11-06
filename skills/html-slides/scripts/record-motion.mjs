#!/usr/bin/env node
/* Plays the deck at normal speed and takes frames during each change. It makes contact sheets to look at.
   A contact sheet shows timing and composition. It does not show how motion feels, so a person must still watch the deck.
   Usage: node record-motion.mjs deck.html out-folder [--from 1] [--to 8] [--times 80,300,650,1100,1800,2800]
   A slow component can run longer than the last frame, so use --times to look later. */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { openBrowser, sleep } from './lib/browser.mjs';

const [file, outDir] = process.argv.slice(2);
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? +process.argv[i + 1] : d; };
if (!file || !outDir) { console.error('Usage: node record-motion.mjs deck.html out-folder [--from 1] [--to 8]'); process.exit(2); }
fs.mkdirSync(outDir, { recursive: true });
const timesAt = process.argv.indexOf('--times');
const TIMES = timesAt >= 0 ? process.argv[timesAt + 1].split(',').map(Number) : [80, 300, 650, 1100, 1800, 2800];
const b = await openBrowser({ width: 1280, height: 720 });
const rows = [];
try {
  await b.open(file); await sleep(1200);
  const hasDeck = await b.eval('!!(window.Deck && Deck.plan)');
  const total = hasDeck ? await b.eval('Deck.plan.length') : 30;
  const from = Math.max(1, arg('from', 1)), to = Math.min(total, arg('to', total));
  if (hasDeck) await b.eval(`Deck.setInstant(true); Deck.goto(${Math.max(0, from - 2)}, { animate: false, force: true }); Deck.setInstant(false); 1`);
  for (let n = from; n <= to; n++) {
    const shots = [], t0 = Date.now();
    if (hasDeck) await b.eval(n === 1 ? 'Deck.goto(0, { force: true })' : 'Deck.next()'); else await b.key('ArrowRight');
    for (const t of TIMES) {
      const wait = t - (Date.now() - t0); if (wait > 0) await sleep(wait);
      const png = path.join(outDir, `step${String(n).padStart(2, '0')}-${t}.png`);
      const real = Date.now() - t0;
      await b.shot(png);
      shots.push({ png, real });
    }
    const where = hasDeck ? await b.eval('Deck.current()') : null;
    rows.push({ n, label: where ? `Slide ${where.slide + 1}${where.step ? `, step ${where.step + 1}` : ''}` : `Press ${n}`, shots, fps: await b.eval('window.__fps || 0') });
    await sleep(120);
  }
  /* Put the frames on sheets of 5 rows each. */
  const sheets = [];
  for (let i = 0; i < rows.length; i += 5) {
    const part = rows.slice(i, i + 5);
    const page = `<!doctype html><body style="margin:0;background:#222;color:#eee;font:13px system-ui">${part.map(r => `<div style="display:flex;align-items:center;gap:4px;margin:4px"><b style="width:44px">${r.label}</b>${r.shots.map(s => `<figure style="margin:0"><img src="${pathToFileURL(path.resolve(s.png)).href}" width="300"><figcaption>${s.real} ms</figcaption></figure>`).join('')}</div>`).join('')}</body>`;
    const htmlFile = path.resolve(outDir, `sheet-${i}.html`); fs.writeFileSync(htmlFile, page);
    await b.send('Emulation.setDeviceMetricsOverride', { width: 1920, height: part.length * 196 + 10, deviceScaleFactor: 1, mobile: false });
    await b.open(htmlFile); await sleep(500);
    const out = path.join(outDir, `motion-sheet-${String(i / 5 + 1).padStart(2, '0')}.png`);
    await b.shot(out); sheets.push(out); fs.rmSync(htmlFile);
  }
  rows.forEach(r => r.shots.forEach(s => fs.rmSync(s.png, { force: true })));
  console.log(`Sheets:\n${sheets.join('\n')}`);
  console.log(`Frame rate per step (this test browser has no graphics card, so the real number is higher): ${rows.map(r => r.fps).join(', ')}`);
  console.log('Times under each frame are real. Taking a frame takes time, so they are not exact.');
} finally { await b.close(); }
