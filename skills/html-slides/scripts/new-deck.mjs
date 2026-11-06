#!/usr/bin/env node
/* Makes a new single-file deck: runtime, theme and fonts are all inside the HTML. After this, the HTML is the only source.
   Usage: node new-deck.mjs out/deck.html --title "My talk" --flow vertical --nav dots --ground "#0b0b0d" --accent "#d9480f" \
          --display "Fraunces" --body "Instrument Sans" [--dots] [--components] [--lang en] [--subset "cyrillic,greek"] [--design-css file] [--slides file] */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url)), rt = path.join(here, '..', 'runtime');
const argv = process.argv.slice(2), out = argv.find((a, i) => !a.startsWith('--') && !(argv[i - 1] || '').startsWith('--'));
const opt = (name, fallback) => { const i = argv.indexOf(`--${name}`); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : fallback; };
const has = name => argv.includes(`--${name}`);

if (!out) { console.error('Usage: node new-deck.mjs out/deck.html --title "..." [--flow vertical|horizontal|fade|world] [--nav dots|bar|none] [--ground #hex] [--accent #hex] [--ink-dark #hex] [--ink-light #hex] [--display "Font"] [--body "Font"] [--dots] [--components] [--subset "cyrillic,greek"] [--design-css file] [--slides file] [--force]'); process.exit(2); }
if (fs.existsSync(out) && !has('force')) { console.error(`${out} already exists. The HTML is the source, so I will not overwrite it. Add --force only if you mean to replace it.`); process.exit(2); }

const flow = opt('flow', 'vertical');
if (!['vertical', 'horizontal', 'fade', 'world'].includes(flow)) { console.error(`Unknown flow: ${flow}`); process.exit(2); }
const nav = opt('nav', 'dots'), title = opt('title', 'Untitled deck'), lang = opt('lang', 'en');
const ground = opt('ground', '#0b0b0d'), accent = opt('accent', '#d9480f'), inkDark = opt('ink-dark', '#f4f1ea'), inkLight = opt('ink-light', '#141310');
const display = opt('display', ''), body = opt('body', '');
const stack = (name, tail) => name ? `'${name}', ${tail}` : tail;
const read = f => fs.readFileSync(path.join(rt, f), 'utf8');
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* Fonts go inside the file, so the deck works with no network. If the fetch fails, the deck falls back and says so. */
async function fontCss(family) {
  const ua = { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36' } };
  const name = encodeURIComponent(family).replace(/%20/g, '+');
  /* Fonts differ in which weights they have, so ask for the widest set first. */
  const asks = [':ital,wght@0,100..900;1,100..900', ':wght@100..900', ':ital,wght@0,400;0,700;1,400;1,700', ':wght@400;700', ':ital@0;1', ''];
  let css = '';
  for (const axis of asks) {
    const res = await fetch(`https://fonts.googleapis.com/css2?family=${name}${axis}&display=block`, ua);
    if (res.ok) { css = await res.text(); break; }
  }
  if (!css) throw new Error('Google Fonts did not have it');
  const weights = [...new Set([...css.matchAll(/font-weight:\s*([^;]+);/g)].map(m => m[1].trim()))].join(', ');
  const got = `weights ${weights}${/font-style:\s*italic/.test(css) ? ', with italic' : ', no italic'}`;
  const wanted = ['latin', 'latin-ext', ...opt('subset', '').split(',').map(s => s.trim()).filter(Boolean)];
  const blocks = css.split(/(?=\/\*)/).filter(b => wanted.some(w => b.startsWith(`/* ${w} */`)));
  let outCss = '';
  for (const b of blocks.length ? blocks : [css]) {
    const m = b.match(/url\((https:[^)]+\.woff2)\)/);
    if (!m) continue;
    const buf = Buffer.from(await (await fetch(m[1])).arrayBuffer());
    outCss += b.replace(m[0], `url(data:font/woff2;base64,${buf.toString('base64')})`).replace(/^\/\*.*?\*\/\s*/, '');
  }
  if (!outCss) throw new Error('no font file found');
  return { css: outCss, got };
}
let fonts = '';
for (const family of [...new Set([display, body].filter(Boolean))]) {
  try { const f = await fontCss(family); fonts += f.css; console.log(`Font inside the file: ${family} (${f.got})`); }
  catch (e) { console.warn(`WARNING: could not embed "${family}" (${e.message}). The deck will use a system font on machines without it.`); }
}

const theme = `:root {
  --ground: ${ground};
  --accent: ${accent};
  --ink-on-dark: ${inkDark};
  --ink-on-light: ${inkLight};
  --muted-on-dark: color-mix(in srgb, ${inkDark} 62%, transparent);
  --muted-on-light: color-mix(in srgb, ${inkLight} 66%, transparent);
  --ink: var(--ink-on-dark);
  --muted: var(--muted-on-dark);
  --font-display: ${stack(display, 'Georgia, serif')};
  --font-body: ${stack(body, 'system-ui, sans-serif')};
}`;

const css = read('deck.css') + (has('components') ? `\n${read('components/components.css')}` : '');
const js = [read('deck.js'), has('dots') ? read('dots.js') : '', has('components') ? read('components/components.js') : '', read('editor.js')].filter(Boolean).join('\n');
if (/<\/script/i.test(js)) throw new Error('runtime contains a closing script tag');

const fileOpt = name => { const f = opt(name); return f ? fs.readFileSync(f, 'utf8') : null; };
const designCss = fileOpt('design-css') ?? '/* This deck\'s own design goes here. */';
const slidesHtml = fileOpt('slides') ?? `<section class="slide">
  <h1 data-move="rise">REPLACE this slide</h1>
  <aside class="notes">REPLACE speaker notes</aside>
</section>`;
const html = `<!doctype html>
<html lang="${esc(lang)}" data-flow="${flow}" data-nav="${nav}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style id="deck-fonts">${fonts}</style>
<style id="deck-runtime">
${css}
</style>
<style id="deck-theme">
${theme}
</style>
<style id="deck-design">
${designCss}
</style>
</head>
<body>
<div id="ground"></div>
<div id="wipe"></div>
${has('dots') ? '<canvas id="dots"></canvas>\n' : ''}<main id="stage">
<div id="sec"></div>
<div id="world">

${slidesHtml}

</div>
</main>
<script id="deck-runtime-js">
${js}
Deck.start();
</script>
</body>
</html>
`;
fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
fs.writeFileSync(out, html);
console.log(`Made ${out} (${Math.round(html.length / 1024)} KB).`);
