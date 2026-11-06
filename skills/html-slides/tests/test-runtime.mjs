#!/usr/bin/env node
/* Tests the runtime in a real browser, with real key presses, for every flow. Run: node tests/test-runtime.mjs */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openBrowser, sleep } from '../scripts/lib/browser.mjs';

const here = path.dirname(fileURLToPath(import.meta.url)), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'html-slides-test-'));
const SLIDES = `
<section class="slide" data-heading="01 / One" data-dots="scatter|ring">
  <h1 data-move="rise">First title</h1>
  <p data-move="count" id="num">1,240</p>
  <p data-step="1" data-move="fade" id="later">Second step words</p>
  <aside class="notes">Notes for one</aside>
</section>
<section class="slide" data-ground="#efe6d0" data-enter="wipe">
  <h2 data-move="left" id="two">Light slide</h2>
  <img id="pic" alt="" width="200" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==">
</section>
<section class="slide"><h2 data-move="fade" id="three">Third slide</h2>
  <div data-step="1" id="parent"><p data-move="fade" id="child">Waits for the parent</p></div>
  <p data-until="0" id="leaves">Leaves at step two</p>
  <div class="fs-comp" style="width:800px;height:500px"><div class="c-chart c-bars" data-fs="bars" data-max="100" data-items='[["A",80],["B",30]]'><header><h3>Bars</h3></header><svg></svg></div></div>
</section>`;
let passed = 0;
const ok = (cond, name) => { assert.ok(cond, name); passed++; };
const eq = (a, b, name) => { assert.deepEqual(a, b, name); passed++; };

const only = process.argv[2];
for (const flow of ['vertical', 'horizontal', 'fade', 'world'].filter(f => !only || f === only)) {
  const file = path.join(dir, `${flow}.html`);
  execFileSync('node', [path.join(here, '..', 'scripts', 'new-deck.mjs'), file, '--flow', flow, '--dots', '--components', '--title', 'Test'], { stdio: 'ignore' });
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(/<section class="slide">[\s\S]*?<\/section>/, SLIDES));
  const b = await openBrowser();
  try {
    await b.open(file); await sleep(600);
    const cur = () => b.eval('Deck.current()'), vis = id => b.eval(`getComputedStyle(document.getElementById('${id}')).visibility`);

    /* Steps and keys. */
    eq(await b.eval('Deck.plan.length'), 5, `${flow}: 2 + 1 + 2 steps`);
    eq(await vis('later'), 'hidden', `${flow}: a later step starts hidden`);
    await b.key('ArrowRight'); await sleep(300);
    eq((await cur()).step, 1, `${flow}: right arrow shows the next step`);
    eq(await vis('later'), 'visible', `${flow}: the later step is now shown`);
    eq(await b.eval(`document.getElementById('sec').textContent`), '01 / One', `${flow}: heading shows`);
    await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 400, y: 400, button: 'left', clickCount: 1 });
    await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 400, y: 400, button: 'left', clickCount: 1 });
    await sleep(1800);
    eq((await cur()).slide, 1, `${flow}: left click goes forward`);
    eq(await b.eval(`document.querySelector('.slide:nth-of-type(1)').classList.contains('visible')`), false, `${flow}: old slide is gone`);
    eq(await b.eval(`document.getElementById('wipe').style.visibility`), 'hidden', `${flow}: wipe has ended`);
    ok((await b.eval(`getComputedStyle(document.getElementById('ground')).backgroundColor`)).includes('239'), `${flow}: ground changed`);
    ok((await b.eval(`getComputedStyle(document.getElementById('two')).color`)).match(/\d+/)[0] < 60, `${flow}: text is dark on a light slide`);
    await b.key('ArrowLeft'); await sleep(1600);
    eq((await cur()).index, 1, `${flow}: left arrow goes back to the last step of the slide`);
    eq(await vis('later'), 'visible', `${flow}: going back keeps the earlier step shown`);

    /* Fast presses do not break it. */
    for (let i = 0; i < 6; i++) await b.key('ArrowRight');
    await sleep(1800);
    eq((await cur()).index, 4, `${flow}: stops at the end`);
    eq(await vis('child'), 'visible', `${flow}: nested item shows with its parent's step`);
    eq(await vis('leaves'), 'hidden', `${flow}: data-until adds its own step and leaves`);
    ok((await b.eval(`getComputedStyle(document.getElementById('ground')).backgroundColor`)).includes('239'), `${flow}: a ground colour stays on the next slide`);
    await b.key('ArrowLeft'); await sleep(200);
    eq(await vis('child'), 'hidden', `${flow}: nested item waits for its parent's step`);
    eq(await vis('leaves'), 'visible', `${flow}: data-until item shows before it leaves`);
    await b.key('ArrowRight'); await sleep(200);
    ok(await b.eval(`document.querySelector('.c-bars').closest('.slide').classList.contains('visible') && document.querySelector('.c-bars svg rect') !== null`), `${flow}: chart drew`);

    /* Edit with real keys. */
    await b.eval('Deck.goto(0, { animate: false, force: true })'); await sleep(200);
    await b.key('e'); await sleep(200);
    ok(await b.eval(`document.body.classList.contains('editing')`), `${flow}: E turns on edit mode`);
    ok(await b.eval(`document.querySelector('h1').isContentEditable && !document.querySelector('h1 .m')`), `${flow}: words are whole in edit mode`);
    await b.eval(`(() => { const h = document.querySelector('h1'); h.focus(); const r = document.createRange(); r.selectNodeContents(h); const s = getSelection(); s.removeAllRanges(); s.addRange(r); })()`);
    for (const ch of 'Heard e ') { await b.send('Input.dispatchKeyEvent', { type: 'keyDown', key: ch, text: ch }); await b.send('Input.dispatchKeyEvent', { type: 'keyUp', key: ch }); }
    eq((await b.eval(`document.querySelector('h1').textContent`)).replace(/ /g, ' '), 'Heard e ', `${flow}: letters and spaces go into the text, not to the shortcuts`);
    ok(await b.eval(`document.body.classList.contains('editing')`), `${flow}: typing e does not end edit mode`);
    await b.key('Escape'); await sleep(100);
    ok(await b.eval(`document.body.classList.contains('editing')`), `${flow}: first Esc only leaves the text box`);

    /* Number, photo, chart, heading, hide, notes. */
    await b.eval(`DeckEditor.setText(Deck.collectText(document).indexOf(document.getElementById('num')), '6,200')`);
    await b.eval(`DeckEditor.setImage(0, 'data:image/gif;base64,R0lGODlhAgACAIAAAAAAAP///ywAAAAAAgACAAACAoRRADs=')`);
    await b.eval(`document.getElementById('sec').textContent = 'Renamed'; DeckEditor.setHeading('Renamed')`);
    await b.key('n'); await sleep(100);
    eq(await b.eval(`document.getElementById('deck-notes').textContent`), 'Notes for one', `${flow}: N shows the notes`);
    await b.eval(`(() => { const n = document.getElementById('deck-notes'); n.textContent = 'New notes'; n.dispatchEvent(new InputEvent('input', { bubbles: true })); })()`);
    await b.eval('Deck.goto(Deck.plan.findIndex(p => p.i === 2), { animate: false, force: true })'); await sleep(100);
    await b.key('h'); await sleep(100);
    const saved = await b.eval('DeckEditor.savedHtml()');
    const copy = path.join(dir, `${flow}-saved.html`); fs.writeFileSync(copy, saved);
    await b.key('e'); await sleep(100);
    eq(await b.eval('Deck.plan.length'), 3, `${flow}: a hidden slide is skipped when presenting`);
    await b.eval('window.onbeforeunload = null; 1');

    /* The saved file opens clean, with every edit, and runs. */
    const c = await openBrowser();
    try {
      await c.open(copy); await sleep(600);
      eq(await c.eval(`document.querySelector('h1').textContent.trim()`), 'Heard e', `${flow}: saved text`);
      ok(saved.includes('6,200'), `${flow}: saved number`);
      ok(saved.includes('R0lGODlhAgAC'), `${flow}: saved photo`);
      ok(saved.includes('New notes'), `${flow}: saved notes`);
      ok(saved.includes('data-heading="Renamed"'), `${flow}: saved heading`);
      eq(await c.eval('Deck.plan.length'), 3, `${flow}: hidden slide stays hidden after reopening`);
      eq(c.errors, [], `${flow}: saved copy has no errors`);
      ok(!saved.includes('id="deck-bar"') && !saved.includes('class="deck-nav'), `${flow}: no runtime leftovers in the save`);
    } finally { await c.close(); }
    eq(b.errors, [], `${flow}: no page errors`);
    console.log(`${flow}: pass`);
  } finally { await b.close(); }
}
fs.rmSync(dir, { recursive: true, force: true });
console.log(`All ${passed} checks passed.`);
