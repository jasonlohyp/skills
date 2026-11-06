#!/usr/bin/env node
/* Checks a deck for faults a script can find. FAIL means fix it. WARN means look at it and decide.
   It also works on HTML decks not made with this skill (it presses the arrow key to move through them).
   Usage: node check-deck.mjs deck.html [--json] */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { openBrowser, sleep } from './lib/browser.mjs';

const file = process.argv[2], asJson = process.argv.includes('--json');
if (!file || !fs.existsSync(file)) { console.error('Usage: node check-deck.mjs deck.html [--json]'); process.exit(2); }
const html = fs.readFileSync(file, 'utf8');
const out = [];
const add = (level, rule, detail) => out.push({ level, rule, detail });

/* === Checks on the file itself === */
const design = (html.match(/<style id="deck-design">([\s\S]*?)<\/style>/) || [])[1] ?? html.replace(/<script[\s\S]*?<\/script>/g, '');
const noData = html.replace(/data:[a-z/+\-0-9.]+;base64,[A-Za-z0-9+/=]+/g, 'DATA');
const slidesPart = ((noData.match(/<div id="world">([\s\S]*?)<script id="deck-runtime-js">/) || [])[1] ?? noData.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '')).replace(/<!--[\s\S]*?-->/g, '');

if (/\bREPLACE\b|lorem ipsum|\bTODO\b/i.test(slidesPart)) add('FAIL', 'placeholder-text', `Placeholder text left in: ${(slidesPart.match(/.{0,30}(\bREPLACE\b|lorem ipsum|\bTODO\b).{0,30}/i) || [''])[0].trim()}`);
const external = [...noData.matchAll(/(?:src=|href=|url\(|@import\s+)["']?(https?:\/\/[^"')\s]+)/g)].map(m => m[1]).filter(u => !/w3\.org/.test(u));
const external2 = [...noData.matchAll(/<a\b[^>]*href=["'](https?:[^"']+)/g)].map(m => m[1]);
const needed = external.filter(u => !external2.includes(u));
if (needed.length) add('FAIL', 'needs-network', `The deck loads ${needed.length} thing(s) from the network, so it breaks offline: ${needed.slice(0, 3).join(', ')}`);
const size = Buffer.byteLength(html) / 1048576;
if (size > 25) add('WARN', 'large-file', `The file is ${size.toFixed(1)} MB. Make the photos smaller.`);
const tells = [
  [/background-clip:\s*text/i, 'gradient-text', 'Gradient-filled text is a common AI look.'],
  [/linear-gradient\([^)]*(#6[0-9a-f]{2}[ef]|#7c3aed|#8b5cf6|#a855f7|#667eea|#764ba2)/i, 'purple-gradient', 'A purple gradient is a common AI look.'],
  [/backdrop-filter/i, 'glass-cards', 'Frosted glass cards are a common AI look.'],
  [/font-family:[^;}]*\b(Inter|Roboto|Space Grotesk|Poppins|Montserrat)\b/i, 'default-font', 'This font appears in most AI-made pages. Pick one with character.'],
  [/border-radius:\s*(1[6-9]|2\d)px/i, 'soft-cards', 'Large rounded cards are a common AI look. Check that the shape has a reason.'],
];
for (const [re, rule, detail] of tells) if (re.test(design)) add('WARN', rule, detail);
if (/[\u{1F300}-\u{1FAFF}]/u.test(slidesPart)) add('WARN', 'emoji-icons', 'Emoji used as icons often read as AI-made. Use drawn symbols or real pictures.');

/* === Checks in a real browser === */
let browser;
const AUDIT = `(() => {
  const leafText = el => [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
  const shown = el => { for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const c = getComputedStyle(e); if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity < .05) return false; } return true; };
  const parse = s => { const m = s.match(/[\\d.]+/g); if (!m) return [0, 0, 0, 0]; const v = m.map(Number); if (s.startsWith('color(')) return [v[0] * 255, v[1] * 255, v[2] * 255, v[3] ?? 1]; return [v[0], v[1], v[2], v[3] ?? 1]; };
  const lin = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); };
  const lum = c => .2126 * lin(c[0]) + .7152 * lin(c[1]) + .0722 * lin(c[2]);
  const over = (a, b) => { const t = a[3]; return [a[0] * t + b[0] * (1 - t), a[1] * t + b[1] * (1 - t), a[2] * t + b[2] * (1 - t), 1]; };
  const groundEl = document.getElementById('ground');
  const baseBg = () => { const g = groundEl ? parse(getComputedStyle(groundEl).backgroundColor) : parse(getComputedStyle(document.body).backgroundColor); return g[3] ? g : [255, 255, 255, 1]; };
  function bgOf(el) { let stack = [], hasPicture = false; for (let e = el; e && e.nodeType === 1 && !(groundEl && e === document.body); e = e.parentElement) { const c = getComputedStyle(e); if (c.backgroundImage !== 'none') hasPicture = true; const b = parse(c.backgroundColor); if (b[3] > 0) { stack.push(b); if (b[3] === 1) break; } } let base = stack.length && stack[stack.length - 1][3] === 1 ? stack.pop() : baseBg(); for (let i = stack.length - 1; i >= 0; i--) base = over(stack[i], base); return { base, hasPicture }; }
  const W = innerWidth, H = innerHeight, leaves = [], faults = [];
  const clean = t => t.trim().replace(/\\s+/g, ' ').slice(0, 48);
  document.querySelectorAll('body *').forEach(el => {
    if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TITLE', 'OPTION'].includes(el.tagName) || el.closest('.deck-ui,.deck-nav,.notes,svg')) return;
    if (!leafText(el) || !shown(el)) return;
    const range = document.createRange(); range.selectNodeContents(el);
    const r = range.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    leaves.push({ el, r });
  });
  const seen = [];
  for (const { el, r } of leaves) {
    const c = getComputedStyle(el), size = parseFloat(c.fontSize) * (window.Deck ? Deck.fit : 1), t = clean(el.textContent);
    if (r.left < -2 || r.top < -2 || r.right > W + 2 || r.bottom > H + 2) faults.push(['FAIL', 'overflow', t]);
    if (size < 18) faults.push(['FAIL', 'text-too-small', Math.round(size) + 'px: ' + t]); else if (size < 24) faults.push(['WARN', 'small-text', Math.round(size) + 'px: ' + t]);
    const ink = parse(c.color), { base, hasPicture } = bgOf(el);
    if (!hasPicture && c.webkitTextFillColor !== 'rgba(0, 0, 0, 0)') { const L1 = lum(over(ink, base)), L2 = lum(base), cr = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05), need = size >= 40 ? 3 : 4.5; if (cr < need) faults.push(['FAIL', 'low-contrast', cr.toFixed(1) + ':1 ' + t]); }
    for (const o of seen) { if (o.el.contains(el) || el.contains(o.el)) continue; const trim = q => q.height * .16; /* a line box is taller than its letters */ const w = Math.min(r.right, o.r.right) - Math.max(r.left, o.r.left), h = Math.min(r.bottom - trim(r), o.r.bottom - trim(o.r)) - Math.max(r.top + trim(r), o.r.top + trim(o.r)); if (w > 2 && h > 2 && w * h > .1 * Math.min(r.width * r.height, o.r.width * o.r.height)) faults.push(['FAIL', 'text-overlap', clean(o.el.textContent) + ' / ' + t]); }
    seen.push({ el, r });
  }
  /* A rough picture of the layout: equal blocks in a row, and where the main text sits. */
  let cards = 0;
  document.querySelectorAll('body *').forEach(el => {
    if (el.closest('.deck-ui,.deck-nav,svg') || !shown(el) || el.children.length < 3) return;
    const kids = [...el.children].filter(k => shown(k) && !['SCRIPT', 'STYLE', 'ASIDE'].includes(k.tagName)).map(k => k.getBoundingClientRect()).filter(r => r.width > 180 && r.height > 80 && r.left >= 0 && r.right <= W);
    if (kids.length < 3) return;
    const a = kids[0], same = kids.filter(r => Math.abs(r.width - a.width) < 8 && Math.abs(r.top - a.top) < 8).length;
    if (same === kids.length && same > cards) cards = same;
  });
  const biggest = leaves.map(l => ({ s: parseFloat(getComputedStyle(l.el).fontSize), r: l.r })).sort((a, b) => b.s - a.s)[0];
  const lead = biggest ? (biggest.r.left + biggest.r.width / 2 < W * .38 ? 'L' : biggest.r.left + biggest.r.width / 2 > W * .62 ? 'R' : 'C') + (biggest.r.top + biggest.r.height / 2 < H * .38 ? 'T' : biggest.r.top + biggest.r.height / 2 > H * .62 ? 'B' : 'M') : '-';
  return { faults, cards, sig: cards + 'x' + lead, leaves: leaves.length, biggest: biggest ? biggest.s : 0, pictures: document.querySelectorAll('img').length, text: leaves.map(l => clean(l.el.textContent)).join(' | ').slice(0, 200) };
})()`;

const report = { file: path.basename(file), steps: 0, slides: 0, uses_runtime: false, editable: null };
try {
  browser = await openBrowser();
  await browser.open(file, '?still');
  await sleep(800);
  const hasDeck = await browser.eval('!!(window.Deck && Deck.plan && Deck.plan.length)');
  report.uses_runtime = hasDeck;
  if (hasDeck && await browser.eval(`getComputedStyle(document.getElementById('stage')).position`) !== 'fixed') add('FAIL', 'runtime-broken', 'The runtime styles are missing or changed, so other faults below may come from this. Restore the deck-runtime style block.');
  const perStep = [];
  if (hasDeck) {
    const total = await browser.eval('Deck.plan.length');
    report.steps = total; report.slides = await browser.eval('Deck.slides.length');
    for (let i = 0; i < total; i++) {
      await browser.eval(`Deck.goto(${i}, { animate: false, force: true })`);
      await sleep(120);
      perStep.push({ ...(await browser.eval(AUDIT)), ...(await browser.eval(`(() => { const c = Deck.current(), s = Deck.slides[c.slide]; const items = [...s.querySelectorAll('[data-move]')]; return { slide: c.slide, step: c.step, moves: items.map(e => e.dataset.move), hasDots: !!s.dataset.dots && s.dataset.dots !== 'none', comps: s.querySelectorAll('[data-fs]').length }; })()`)) });
    }
  } else {
    let last = '';
    for (let i = 0; i < 60; i++) {
      const a = await browser.eval(AUDIT);
      if (i && a.text === last) break;
      last = a.text;
      perStep.push({ ...a, slide: i, step: 0, moves: null, hasDots: false, comps: 0 });
      await browser.key('ArrowRight'); await sleep(1400);
    }
    report.steps = report.slides = perStep.length;
  }
  const seen = new Set();
  perStep.forEach((s, i) => s.faults.forEach(([level, rule, detail]) => { const key = rule + detail; if (!seen.has(key)) { seen.add(key); add(level, rule, `step ${i + 1}: ${detail}`); } }));

  /* Per slide: use the last step, because it shows the most. */
  const bySlide = new Map(); perStep.forEach(s => bySlide.set(s.slide, s));
  const list = [...bySlide.values()];
  for (let i = 2; i < list.length; i++) if (list[i].sig === list[i - 1].sig && list[i].sig === list[i - 2].sig && list[i].cards >= 2) { add('FAIL', 'repeated-layout', `Slides ${i - 1} to ${i + 1} use the same layout (${list[i].cards} equal blocks). Change at least one.`); break; }
  const cardSlides = list.filter(s => s.cards >= 3).length;
  report.card_slides = cardSlides;
  if (list.length >= 5 && cardSlides / list.length > .34) add('WARN', 'too-many-cards', `${cardSlides} of ${list.length} slides are rows of equal cards. This is the most common AI layout.`);
  if (list.length && list.every(s => !s.pictures) && !/<html[^>]*data-no-pictures=/.test(html)) add('WARN', 'no-real-pictures', 'The deck has no real photo or screenshot. Ask the user for some. A deck with none looks more generic.');
  const empties = list.filter(s => !s.leaves && !s.comps && !s.hasDots);
  if (empties.length) add('FAIL', 'empty-slide', `${empties.length} step(s) show no text.`);
  if (hasDeck) {
    let flat = 0, worst = 0;
    list.forEach(s => { flat = (s.moves.length || s.hasDots || s.comps) ? 0 : flat + 1; worst = Math.max(worst, flat); });
    if (worst >= 2) add('WARN', 'flat-run', `${worst} slides in a row have no motion.`);
    list.forEach((s, i) => { if (s.moves.length > 7) add('WARN', 'busy-slide', `Slide ${i + 1} has ${s.moves.length} moving items. One clear move is better.`); });
    report.motion_slides = list.filter(s => s.moves.length || s.hasDots || s.comps).length;
    const kinds = new Set(list.flatMap(s => s.moves)); report.move_kinds = [...kinds];
    if (list.length >= 5 && kinds.size < 3) add('WARN', 'one-note-motion', `Only ${kinds.size} kind(s) of move in the deck.`);
    if (kinds.size > 7) add('WARN', 'too-many-move-kinds', `${kinds.size} kinds of move. Use fewer, so each one means something.`);

    /* The edit path, end to end: change the page, save the HTML, open the saved file, look for the change. */
    const count = await browser.eval('DeckEditor.count');
    report.editable = count;
    if (!count.text) add('FAIL', 'edit-nothing', 'Edit mode finds no text to edit.');
    else {
      const stamp = 'EDIT-TEST-WORDS';
      const saved = await browser.eval(`(() => { Deck.goto(0, { animate: false }); DeckEditor.setEditing(true); DeckEditor.setText(0, ${JSON.stringify(stamp)}); DeckEditor.setEditing(false); return DeckEditor.savedHtml(); })()`);
      const tmp = path.join(os.tmpdir(), `html-slides-edit-${process.pid}.html`);
      fs.writeFileSync(tmp, saved);
      await browser.eval('window.onbeforeunload = null; 1');
      await browser.send('Page.setBypassCSP', { enabled: false }).catch(() => {});
      const ok = saved.includes(stamp);
      const clean = saved.includes('class="deck-nav') === false && saved.includes('id="deck-bar"') === false && !/class="m"/.test(saved);
      if (!ok) add('FAIL', 'edit-not-saved', 'An edit did not reach the saved HTML.');
      if (!clean) add('FAIL', 'edit-dirty-save', 'The saved HTML holds runtime leftovers.');
      report.edit_saved_test = tmp;
    }
  } else {
    await browser.key('e'); await sleep(300);
    const editable = await browser.eval(`document.querySelectorAll('[contenteditable]:not([contenteditable="false"])').length`);
    const writes = /showSaveFilePicker/.test(html), downloads = /\.download\s*=/.test(html), local = /localStorage/.test(html);
    report.editable = { text: editable, writes_file: writes, downloads, local_storage_only: local && !writes && !downloads };
    if (!editable) add('FAIL', 'no-edit-mode', 'Pressing E does not turn on editing.');
    if (!writes && !downloads) add('FAIL', 'edits-do-not-save-to-file', local ? 'Edits stay only in this browser, so they do not reach the file or other people.' : 'The deck cannot write edits to a file.');
  }
  if (browser.errors.length) add('FAIL', 'page-errors', [...new Set(browser.errors)].slice(0, 4).join(' / '));
} catch (e) {
  add('WARN', 'no-browser-checks', `Browser checks did not run: ${e.message}`);
} finally { if (browser) await browser.close(); }

/* The saved copy must open with no errors. */
if (report.edit_saved_test) {
  let b2;
  try {
    b2 = await openBrowser();
    await b2.open(report.edit_saved_test, '?still'); await sleep(600);
    const shown = await b2.eval(`document.body.textContent.includes('EDIT-TEST-WORDS') && Deck.plan.length === ${report.steps}`);
    if (!shown) add('FAIL', 'edit-reopen', 'The saved copy did not reopen with the edit.');
    if (b2.errors.length) add('FAIL', 'edit-reopen-errors', [...new Set(b2.errors)].slice(0, 3).join(' / '));
  } catch (e) { add('WARN', 'edit-reopen-skip', e.message); } finally { if (b2) await b2.close(); fs.rmSync(report.edit_saved_test, { force: true }); delete report.edit_saved_test; }
}

report.fail = out.filter(o => o.level === 'FAIL').length; report.warn = out.filter(o => o.level === 'WARN').length; report.faults = out;
if (asJson) console.log(JSON.stringify(report, null, 2));
else {
  console.log(`${report.file}: ${report.slides} slides, ${report.steps} steps, ${report.fail} FAIL, ${report.warn} WARN`);
  out.sort((a, b) => a.level.localeCompare(b.level)).forEach(o => console.log(`${o.level}  ${o.rule}: ${o.detail}`));
  if (!out.length) console.log('No faults found. A script cannot judge taste, so still look at the deck.');
}
process.exit(report.fail ? 1 : 0);
