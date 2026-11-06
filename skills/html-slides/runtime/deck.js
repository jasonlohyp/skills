/* html-slides runtime: stage, steps, flows, moves and input. One index decides what the screen shows. */
window.Deck = (() => {
  const $ = s => document.querySelector(s), root = document.documentElement;
  const SOFT = 'cubic-bezier(.16,1,.3,1)', SWING = 'cubic-bezier(.76,0,.24,1)', BOUNCE = 'cubic-bezier(.34,1.56,.64,1)';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]still\b/.test(location.search);
  const EDIT_TEXT = 'h1,h2,h3,h4,h5,p,li,blockquote,figcaption,td,th,dt,dd,[data-edit]';
  let stage, world, sec, ground, wipe, slides = [], plan = [], at = 0, cur = -1, fit = 1, W = 0, H = 0;
  let instant = reduced, showHidden = false, pristine = '', running = [], started = false, nav = null;
  const listeners = [];
  const flow = () => root.dataset.flow || 'vertical';
  const ms = v => instant ? 0 : v;

  /* === Colours === */
  const probe = () => { const p = document.createElement('i'); p.style.display = 'none'; document.body.appendChild(p); return p; };
  function rgb(css) {
    const p = probe(); p.style.color = css;
    const m = getComputedStyle(p).color.match(/[\d.]+/g).map(Number); p.remove();
    return m[0] > 1 || m.length === 3 ? [m[0] / 255, m[1] / 255, m[2] / 255] : [m[0], m[1], m[2]];
  }
  const lum = c => { const f = v => v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2]); };
  /* A ground colour stays until a later slide sets another, so a chapter keeps its colour. */
  const groundOf = s => { for (let i = slides.indexOf(s); i >= 0; i--) if (slides[i].dataset.ground) return slides[i].dataset.ground; return 'var(--ground)'; };
  /* Text colour follows the ground of its slide, so a light slide never has light text. */
  function inkFor(s) {
    const light = lum(rgb(groundOf(s))) > .4;
    s.style.setProperty('--ink', light ? 'var(--ink-on-light)' : 'var(--ink-on-dark)');
    s.style.setProperty('--muted', light ? 'var(--muted-on-light)' : 'var(--muted-on-dark)');
    s.style.setProperty('--slide-ground', groundOf(s));
  }

  /* === Fit the stage to the window === */
  function resize() {
    W = innerWidth; H = innerHeight; fit = Math.min(W / 1920, H / 1080);
    stage.style.transform = `translate(${(W - 1920 * fit) / 2}px,${(H - 1080 * fit) / 2}px) scale(${fit})`;
    if (window.DeckDots) DeckDots.resize();
  }

  /* === Moves === */
  function splitWords(el) {
    if (el.__raw !== undefined) return;
    el.__raw = el.innerHTML;
    const out = document.createDocumentFragment();
    const wrap = node => { const m = document.createElement('span'), i = document.createElement('span'); m.className = 'm'; i.className = 'i'; i.appendChild(node); m.appendChild(i); return m; };
    [...el.childNodes].forEach(n => {
      if (n.nodeType !== 3) { out.appendChild(wrap(n)); return; }
      n.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return;
        out.appendChild(/^\s+$/.test(part) ? document.createTextNode(' ') : wrap(document.createTextNode(part)));
      });
    });
    el.textContent = ''; el.appendChild(out);
  }
  function unsplit(el) { if (el.__raw !== undefined) { el.innerHTML = el.__raw; delete el.__raw; } }
  const run = (el, frames, dur, delay, easing = SOFT) => el.animate(frames, { duration: ms(dur), delay: ms(delay), easing, fill: 'backwards' });
  function countUp(el, delay, dur) {
    settleCount(el);
    const raw = el.textContent.trim(), m = raw.match(/^(\D*)(\d[\d,]*(?:\.\d+)?)(.*)$/s);
    if (!m || instant) return;
    const to = +m[2].replace(/,/g, ''), dec = (m[2].split('.')[1] || '').length, comma = m[2].includes(',');
    const t0 = performance.now() + delay, token = {};
    el.__count = { token, raw };
    const tick = now => {
      if (!el.__count || el.__count.token !== token) return;
      const p = Math.min(Math.max((now - t0) / dur, 0), 1), v = to * (1 - Math.pow(1 - p, 4));
      el.textContent = m[1] + (comma ? Math.round(v).toLocaleString('en-US') : v.toFixed(dec)) + m[3];
      if (p < 1) requestAnimationFrame(tick); else settleCount(el);
    };
    el.textContent = m[1] + (dec ? (0).toFixed(dec) : '0') + m[3];
    requestAnimationFrame(tick);
  }
  function settleCount(el) { if (el.__count) { el.textContent = el.__count.raw; delete el.__count; } }
  const MOVES = {
    rise(el, d, dur) { splitWords(el); el.querySelectorAll('.i').forEach((w, i) => run(w, [{ transform: 'translateY(115%)' }, { transform: 'none' }], dur, d + i * 35)); },
    fade(el, d, dur) { run(el, [{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'none' }], dur, d); },
    scale(el, d, dur) { run(el, [{ opacity: 0, transform: 'scale(.9)' }, { opacity: 1, transform: 'none' }], dur, d); },
    pop(el, d) { run(el, [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'none' }], 650, d, BOUNCE); },
    left(el, d, dur) { run(el, [{ opacity: 0, transform: 'translateX(-80px)' }, { opacity: 1, transform: 'none' }], dur, d); },
    right(el, d, dur) { run(el, [{ opacity: 0, transform: 'translateX(80px)' }, { opacity: 1, transform: 'none' }], dur, d); },
    wipe(el, d) { run(el, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], 1100, d, SWING); },
    grow(el, d) { el.style.transformOrigin = el.dataset.origin || 'left center'; run(el, [{ transform: el.dataset.axis === 'y' ? 'scaleY(0)' : 'scaleX(0)' }, { transform: 'none' }], 1200, d, SWING); },
    focus(el, d, dur) { run(el, [{ opacity: 0, filter: 'blur(16px)' }, { opacity: 1, filter: 'blur(0)' }], dur * 1.2, d); },
    stagger(el, d, dur) { [...el.children].forEach((c, i) => run(c, [{ opacity: 0, transform: 'translateY(28px)' }, { opacity: 1, transform: 'none' }], dur, d + i * 120)); },
    draw(el, d) {
      const parts = el.matches('path,line,polyline,circle,rect') ? [el] : [...el.querySelectorAll('path,line,polyline,circle,rect')];
      parts.forEach((p, i) => { p.setAttribute('pathLength', 1); p.style.strokeDasharray = 1; run(p, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], 1300, d + i * 120, SWING); });
    },
    count(el, d, dur) { countUp(el, ms(d), dur * 1.8); run(el, [{ opacity: 0 }, { opacity: 1 }], 300, d); },
  };

  /* === Steps inside a slide === */
  const itemsOf = s => [...s.querySelectorAll('[data-move],[data-step],[data-until]')];
  /* An item inside a stepped parent waits for that parent's step too. */
  const startOf = (el, s) => { let a = 0; for (let e = el; e && e !== s; e = e.parentElement) a = Math.max(a, +e.dataset.step || 0); return a; };
  const endOf = (el, s) => { let b = Infinity; for (let e = el; e && e !== s; e = e.parentElement) if (e.dataset.until !== undefined) b = Math.min(b, +e.dataset.until); return b; };
  const stepsOf = s => 1 + Math.max(0, ...itemsOf(s).map(e => Math.max(startOf(e, s), e.dataset.until === undefined ? 0 : +e.dataset.until + 1)));
  function setStep(s, k, animate) {
    let order = 0;
    itemsOf(s).forEach(el => {
      const on = k >= startOf(el, s) && k <= endOf(el, s);
      if (on === !!el.__on) return;
      el.__on = on;
      el.getAnimations().forEach(x => x.cancel());
      if (on) {
        el.style.visibility = '';
        if (!animate) return;
        const delay = el.dataset.delay !== undefined ? el.dataset.delay * 1000 : (k === 0 ? 260 : 60) + order * 130;
        order++;
        (MOVES[el.dataset.move] || MOVES.fade)(el, delay, +el.dataset.dur * 1000 || 900);
      } else if (animate && !instant) {
        el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220 }).onfinish = () => { if (!el.__on) el.style.visibility = 'hidden'; };
      } else el.style.visibility = 'hidden';
    });
    if (window.DeckDots) { const spec = (s.dataset.dots || 'none').split('|'); DeckDots.show(spec[Math.min(k, spec.length - 1)], s); }
  }
  function resetSlide(s) { itemsOf(s).forEach(el => { el.__on = false; el.getAnimations().forEach(x => x.cancel()); settleCount(el); el.style.visibility = 'hidden'; }); }

  /* === Ground === */
  function setGround(s, animate) {
    const color = groundOf(s), kind = s.dataset.enter;
    const was = ground.dataset.color;
    if (was === color) return;
    ground.dataset.color = color;
    const snap = () => { ground.style.transition = 'none'; ground.style.background = color; void ground.offsetWidth; ground.style.transition = ''; };
    if (instant) { snap(); return; }
    if (!animate || kind !== 'wipe') { ground.style.background = color; return; }
    const R = Math.hypot(W, H) * 1.1, [ox, oy] = (s.dataset.origin || '50 50').split(/\s+/).map(Number), x = W * ox / 100, y = H * oy / 100;
    wipe.style.background = color; wipe.style.visibility = 'visible';
    const a = wipe.animate([{ clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(${R}px at ${x}px ${y}px)` }], { duration: 1150, easing: 'cubic-bezier(.87,0,.13,1)' });
    a.onfinish = a.oncancel = () => { snap(); wipe.style.visibility = 'hidden'; };
    running.push(a);
  }

  /* === Flows === */
  function placeWorld() {
    slides.forEach((s, i) => {
      const [x, y, z] = (s.dataset.at || `${Math.round(Math.sin(i * 1.3) * 900)},${Math.round(Math.cos(i * .9) * 420)},${-i * 2600}`).split(',').map(Number);
      s.__at = { x, y, z };
      s.style.transform = `translate3d(${x}px,${y}px,${z}px)`;
    });
  }
  const camera = s => `translate3d(${-s.__at.x}px,${-s.__at.y}px,${-s.__at.z}px)`;
  function changeSlide(from, to, dir, animate) {
    const f = flow(), go = animate && !instant;
    to.classList.add('visible');
    if (f === 'world') {
      const list = plan.filter((p, i) => i === 0 || plan[i - 1].i !== p.i).map(p => p.i), pos = list.indexOf(slides.indexOf(to));
      slides.forEach(s => s.classList.remove('ghost'));
      if (pos + 1 < list.length) slides[list[pos + 1]].classList.add('ghost');
      if (from && from !== to) from.classList.remove('visible');
      const end = camera(to), start = getComputedStyle(world).transform;
      world.style.transform = end;
      if (go && from) running.push(world.animate([{ transform: start }, { transform: end }], { duration: 1500, easing: SWING }));
      return;
    }
    if (!from || from === to) return;
    from.classList.remove('visible');
    if (!go) return;
    from.classList.add('leaving');
    const done = () => from.classList.remove('leaving');
    if (f === 'fade') {
      run(to, [{ opacity: 0, transform: 'scale(1.025)' }, { opacity: 1, transform: 'none' }], 800, 0);
      const a = from.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500 }); a.onfinish = a.oncancel = done; running.push(a);
      return;
    }
    const axis = f === 'horizontal' ? 'X' : 'Y', d = (f === 'horizontal' ? 1920 : 1080) * dir;
    running.push(to.animate([{ transform: `translate${axis}(${d}px)` }, { transform: 'none' }], { duration: 950, easing: SWING }));
    const a = from.animate([{ transform: 'none' }, { transform: `translate${axis}(${-d}px)` }], { duration: 950, easing: SWING });
    a.onfinish = a.oncancel = done; running.push(a);
  }

  /* === Navigation === */
  function rebuild() {
    plan = [];
    slides.forEach((s, i) => { if (showHidden || !s.hasAttribute('data-hidden')) for (let k = 0; k < stepsOf(s); k++) plan.push({ i, k }); });
    if (nav && nav.classList.contains('dots')) buildDots();
  }
  function buildDots() {
    nav.textContent = '';
    plan.filter(p => p.k === 0).forEach(p => {
      const b = document.createElement('button'); b.setAttribute('aria-label', `Slide ${p.i + 1}`); b.dataset.i = p.i;
      b.addEventListener('click', e => { e.stopPropagation(); goto(plan.findIndex(q => q.i === p.i)); });
      nav.appendChild(b);
    });
  }
  function paintNav() {
    if (!nav) return;
    if (nav.classList.contains('bar')) { nav.firstChild.style.width = `${plan.length > 1 ? at / (plan.length - 1) * 100 : 100}%`; return; }
    [...nav.children].forEach(b => b.classList.toggle('on', +b.dataset.i === cur));
  }
  function goto(n, opts = {}) {
    if (!plan.length) return false;
    n = Math.max(0, Math.min(plan.length - 1, n));
    const p = plan[n], first = cur < 0;
    if (!first && n === at && !opts.force) return false;
    const dir = n >= at ? 1 : -1, s = slides[p.i], animate = opts.animate !== false;
    running.forEach(a => a.finish()); running = [];
    if (p.i !== cur) {
      const from = slides[cur];
      if (from) resetSlide(from);
      resetSlide(s);
      changeSlide(from, s, dir, animate && !first);
      setGround(s, animate && !first && dir > 0);
      setStep(s, 0, animate && dir > 0 && !instant);
      for (let k = 1; k <= p.k; k++) setStep(s, k, false);
    } else setStep(s, p.k, animate && dir > 0 && !instant);
    at = n; cur = p.i;
    const text = s.dataset.heading || '';
    if (sec.textContent !== text) sec.textContent = text;
    sec.style.color = '';
    sec.style.setProperty('--muted', s.style.getPropertyValue('--muted'));
    paintNav();
    listeners.forEach(cb => cb(api.current()));
    return true;
  }

  /* === Input === */
  const skip = t => t.closest && t.closest('a,button,input,textarea,select,.deck-ui,.deck-nav,[data-no-advance],.c-cmp');
  function bindInput() {
    addEventListener('click', e => { if (e.button === 0 && !api.editing && !skip(e.target)) goto(at + 1); });
    addEventListener('keydown', e => {
      if (api.typing && api.typing()) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); goto(at + 1); }
      if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); goto(at - 1); }
      if (e.key === 'Home') goto(0);
      if (e.key === 'End') goto(plan.length - 1);
      if (e.key === 'f' || e.key === 'F') { if (document.fullscreenElement) document.exitFullscreen(); else root.requestFullscreen(); }
    });
    let wheelAt = 0, startX = 0, startY = 0;
    addEventListener('wheel', e => {
      if (api.editing || flow() === 'world') return;
      const now = performance.now();
      if (now - wheelAt < 900 || Math.abs(e.deltaY) + Math.abs(e.deltaX) < 20) return;
      wheelAt = now; goto(at + (e.deltaY + e.deltaX > 0 ? 1 : -1));
    }, { passive: true });
    addEventListener('touchstart', e => { startX = e.touches[0].clientX; startY = e.touches[0].clientY; }, { passive: true });
    addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - startX, dy = e.changedTouches[0].clientY - startY;
      if (Math.max(Math.abs(dx), Math.abs(dy)) > 50) goto(at + ((Math.abs(dx) > Math.abs(dy) ? dx : dy) < 0 ? 1 : -1));
    }, { passive: true });
    let idle = 0;
    addEventListener('pointermove', () => { document.body.classList.remove('idle'); clearTimeout(idle); idle = setTimeout(() => document.body.classList.add('idle'), 2500); });
    addEventListener('resize', resize);
  }

  /* === Editable things, found the same way in the live page and in the saved copy === */
  const leafText = el => [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
  function collectText(doc) {
    const out = [];
    doc.querySelectorAll('.slide').forEach(s => s.querySelectorAll(EDIT_TEXT).forEach(el => {
      if (el.closest('.notes')) return;
      if (leafText(el) || el.hasAttribute('data-edit')) { if (!out.some(o => o.contains(el))) out.push(el); }
    }));
    return out;
  }

  const api = {
    editing: false, typing: null,
    get slides() { return slides; }, get plan() { return plan; }, get pristine() { return pristine; }, get fit() { return fit; },
    get still() { return instant; },
    rgb, lum, unsplit, splitWords, settleCount, collectText, rebuild, goto,
    next: () => goto(at + 1), prev: () => goto(at - 1),
    current: () => ({ index: at, slide: cur, step: plan[at] ? plan[at].k : 0, total: plan.length }),
    onChange: cb => { listeners.push(cb); },
    setInstant: on => { instant = on || reduced; },
    setShowHidden: on => { showHidden = on; const s = cur; rebuild(); at = Math.max(0, plan.findIndex(p => p.i === s)); paintNav(); },
    groundOf,
    start() {
      if (started) return; started = true;
      pristine = `<!doctype html>\n${root.outerHTML}`; /* the clean page, before any script changes it; Save starts from this */
      stage = $('#stage'); world = $('#world'); sec = $('#sec'); ground = $('#ground'); wipe = $('#wipe');
      slides = [...document.querySelectorAll('.slide')];
      if (window.DeckEditor) DeckEditor.prepare();
      slides.forEach(s => { inkFor(s); resetSlide(s); });
      const navKind = root.dataset.nav || 'dots';
      if (navKind !== 'none') { nav = document.createElement('nav'); nav.className = `deck-nav ${navKind}`; if (navKind === 'bar') nav.appendChild(document.createElement('i')); document.body.appendChild(nav); }
      rebuild(); resize();
      if (flow() === 'world') placeWorld();
      if (window.FSComponents) { FSComponents.init(); FSComponents.bindSlides('.slide'); }
      if (window.DeckDots) DeckDots.init();
      if (window.DeckEditor) DeckEditor.init();
      bindInput();
      let frames = 0, t0 = performance.now(); window.__fps = 0;
      const count = now => { frames++; if (now - t0 > 1000) { window.__fps = Math.round(frames * 1000 / (now - t0)); frames = 0; t0 = now; } requestAnimationFrame(count); };
      requestAnimationFrame(count);
      const open = () => { const h = location.hash.match(/^#(\d+)$/); at = h ? Math.min(+h[1], plan.length - 1) : 0; goto(at, { force: true, animate: !h }); };
      (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(open);
    },
  };
  return api;
})();
