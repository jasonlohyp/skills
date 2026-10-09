// Screenshot script for the visual critic. Copy to <project>/scripts/shots.mjs.
// Needs: npm i -D playwright && npx playwright install chromium
// Usage: node scripts/shots.mjs <baseUrl> <outDir> <screen>...
//   A screen name opens <baseUrl>/?screen=<name>. Seeded game states are screen names too.
//   A name ending in .html opens <baseUrl>/mockups/<name> (mockup phase).
// Prints one PNG path per line. Pass these paths to the visual critic.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const [rawBase, outDir, ...screens] = process.argv.slice(2);
const baseUrl = (rawBase || '').replace(/\/+$/, '');
if (!rawBase || !outDir || screens.length === 0) {
  console.error('Usage: node scripts/shots.mjs <baseUrl> <outDir> <screen>...');
  process.exit(1);
}

// Phone-sized viewport. Change it if your app targets desktop.
const viewport = { width: 390, height: 844 };

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
let failed = 0;
for (const screen of screens) {
  // Fresh context per screen, so storage from one seeded state does not leak into the next.
  // Scale 1 keeps each PNG at about a third of the image tokens of scale 2. Raise only to judge small text.
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const url = screen.endsWith('.html')
    ? `${baseUrl}/mockups/${screen}`
    : `${baseUrl}/?screen=${encodeURIComponent(screen)}`;
  const file = join(outDir, `${screen.replace(/\.html$/, '').replace(/[^\w.-]+/g, '_')}.png`);
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 20000 }); // not networkidle: games that poll never go idle
    await page.waitForTimeout(500); // let animations settle
    await page.screenshot({ path: file });
    console.log(file);
  } catch (err) {
    failed++;
    console.error(`FAIL ${screen}: ${err.message.split('\n')[0]}`);
  }
  await ctx.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
