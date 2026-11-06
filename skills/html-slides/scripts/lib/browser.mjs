/* A small browser driver with no install: it uses the Chrome or Edge already on the machine, through its debug protocol. */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const PLACES = {
  win32: ['Google/Chrome/Application/chrome.exe', 'Microsoft/Edge/Application/msedge.exe'].flatMap(p => [process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)'], process.env.LOCALAPPDATA].filter(Boolean).map(b => path.join(b, p))),
  darwin: ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge', '/Applications/Chromium.app/Contents/MacOS/Chromium'],
  linux: ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/microsoft-edge', '/snap/bin/chromium'],
};
export const findBrowser = () => [process.env.CHROME_PATH, ...(PLACES[process.platform] || [])].filter(Boolean).find(p => fs.existsSync(p));
export const sleep = t => new Promise(r => setTimeout(r, t));

export async function openBrowser({ width = 1920, height = 1080 } = {}) {
  const exe = findBrowser();
  if (!exe) throw new Error('No Chrome or Edge found. Set CHROME_PATH to its path.');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'html-slides-'));
  const proc = spawn(exe, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}`, `--window-size=${width},${height}`, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', 'about:blank'], { stdio: 'ignore' });
  const portFile = path.join(dir, 'DevToolsActivePort');
  for (let i = 0; i < 100 && !fs.existsSync(portFile); i++) await sleep(100);
  if (!fs.existsSync(portFile)) { proc.kill(); throw new Error('The browser did not start.'); }
  const port = fs.readFileSync(portFile, 'utf8').split('\n')[0];
  const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  const ws = new WebSocket(list.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0; const wait = new Map(), errors = [];
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && wait.has(m.id)) { const { res, rej } = wait.get(m.id); wait.delete(m.id); if (m.error) rej(new Error(m.error.message)); else res(m.result); return; }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map(a => a.value ?? a.description).join(' '));
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') errors.push(`${m.params.entry.text} ${m.params.entry.url || ''}`.trim());
  };
  const send = (method, params = {}) => new Promise((res, rej) => {
    const n = ++id, timer = setTimeout(() => { wait.delete(n); rej(new Error(`The browser did not answer ${method}.`)); }, 60000);
    wait.set(n, { res: v => { clearTimeout(timer); res(v); }, rej: e => { clearTimeout(timer); rej(e); } });
    ws.send(JSON.stringify({ id: n, method, params }));
  });
  ws.onclose = () => wait.forEach(w => w.rej(new Error('The browser closed.')));
  await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  const api = {
    errors,
    send,
    async open(file, query = '') {
      const url = (/^(https?|file):/.test(file) ? file : pathToFileURL(path.resolve(file)).href) + query;
      await send('Page.navigate', { url });
      for (let i = 0; i < 100; i++) { if (await api.eval('document.readyState') === 'complete') break; await sleep(100); }
      await api.eval('document.fonts ? document.fonts.ready.then(() => 1) : 1');
    },
    async eval(code) {
      const r = await send('Runtime.evaluate', { expression: code, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return r.result.value;
    },
    async key(key) {
      const code = key === ' ' ? 'Space' : key.length === 1 ? `Key${key.toUpperCase()}` : key;
      const vk = { ArrowRight: 39, ArrowLeft: 37, ArrowDown: 40, ' ': 32, Escape: 27 }[key] || key.toUpperCase().charCodeAt(0);
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: vk, text: key.length === 1 ? key : undefined });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk });
    },
    async shot(file) { const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(file, Buffer.from(r.data, 'base64')); },
    async close() { await Promise.race([send('Browser.close').catch(() => {}), sleep(1500)]); /* it may close before it answers */ ws.close(); await sleep(200); proc.kill(); try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* the browser may hold it for a moment */ } },
  };
  return api;
}
