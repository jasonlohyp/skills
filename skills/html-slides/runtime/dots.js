/* html-slides dot field: raw WebGL, no library. The same dots change shape from one step to the next. */
window.DeckDots = (() => {
  const F = 1000;
  let gl = null, cv, N = 0, W = 0, H = 0, dpr = 1, morph = null, target = null, live = null, lastSpec = null;
  let cur, from, drawn, phase, buf = {}, U = {}, reduced = false;
  const eases = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const makeSet = () => ({ pos: new Float32Array(N * 3), col: new Float32Array(N * 4), size: new Float32Array(N) });

  /* Each shape gives every dot a place: x, y, z from the stage centre. */
  const SHAPES = {
    scatter: (i, r) => { const z = -640 + r() * 2200, k = (1000 + z) / 1000; return [(r() - .5) * 2150 * k, (r() - .5) * 1250 * k, z, 2.2 + r() * 2.6, .35 + .65 * r()]; },
    cluster: (i, r, n) => { const c = i % n, a = c / n * 6.283 - 1.57, R = n > 1 ? 330 : 0, q = r() * 6.283, d = Math.pow(r(), .6) * 190; return [Math.cos(a) * R * 1.5 + Math.cos(q) * d, Math.sin(a) * R + Math.sin(q) * d, 0, 2.6 + r() * 2, .6 + .4 * r()]; },
    line: (i, r) => [-860 + 1720 * i / N, (r() - .5) * 2, 0, 3, 1],
    lines: (i, r, n) => { const k = i % n; return [-760 + 1520 * r(), (k - (n - 1) / 2) * 92, 0, 2.8, .9]; },
    ring: (i, r) => { const k = i % 3, R = 230 + k * 150, a = r() * 6.283; return [Math.cos(a) * R * 1.35, Math.sin(a) * R * .62, Math.sin(a) * R * .5, 2.4 + r() * 1.6, .5 + .5 * r()]; },
    globe: (i, r) => { const y = 1 - 2 * (i + .5) / N, a = i * 2.39996, q = Math.sqrt(1 - y * y), R = 400; return [Math.cos(a) * q * R, y * R, Math.sin(a) * q * R, 2.6, .85]; },
    wave: (i, r) => { const c = Math.ceil(Math.sqrt(N * 2.4)), x = i % c, z = Math.floor(i / c); return [(x / c - .5) * 2300, 240, (z / (N / c) - .5) * 1900, 2.6, .7]; },
    grid: (i) => { const c = Math.ceil(Math.sqrt(N * 16 / 9)), x = i % c, y = Math.floor(i / c), rows = Math.ceil(N / c); return [(x - c / 2) * 1500 / c, (y - rows / 2) * 840 / rows, 0, 2.8, .8]; },
  };
  function textPoints(word) {
    const c = document.createElement('canvas'), w = 1720, h = 560; c.width = w; c.height = h;
    const g = c.getContext('2d'), family = getComputedStyle(document.documentElement).getPropertyValue('--font-display');
    let size = 460;
    do { g.font = `800 ${size}px ${family}`; size -= 10; } while (g.measureText(word).width > w - 40 && size > 40);
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(word, w / 2, h / 2);
    const d = g.getImageData(0, 0, w, h).data, px = [];
    for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) if (d[(y * w + x) * 4 + 3] > 128) px.push(x - w / 2, y - h / 2);
    return px;
  }
  function layout(spec, slide) {
    const [name, arg] = spec.split(':'), r = rng(name.length * 37 + 11), l = { ...makeSet(), delay: new Float32Array(N) };
    const ink = Deck.rgb(getComputedStyle(slide).getPropertyValue('--ink').trim() || '#fff');
    const accent = Deck.rgb(getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#f00');
    const share = parseFloat(slide.dataset.dotsAccent ?? .02), alpha = parseFloat(slide.dataset.dotsAlpha ?? 1);
    const [ox, oy, sc] = (slide.dataset.dotsAt || '0,0,1').split(',').map(Number);
    const px = name === 'text' ? textPoints(arg || 'HELLO') : null;
    const fn = SHAPES[name] || SHAPES.scatter;
    for (let i = 0; i < N; i++) {
      let p;
      if (name === 'none') p = [(r() - .5) * 2200, (r() - .5) * 1200, r() * 800, 0, 0];
      else if (px) { const k = Math.floor(r() * px.length / 2) * 2; p = [px[k] + r() * 2, px[k + 1] + r() * 2, 0, 3.4, 1]; }
      else p = fn(i, r, Math.max(1, +arg || 3));
      l.pos[i * 3] = p[0] * sc + ox; l.pos[i * 3 + 1] = p[1] * sc + oy; l.pos[i * 3 + 2] = p[2] * sc;
      const c = r() < share ? accent : ink;
      l.col.set([c[0], c[1], c[2], p[4] * alpha * (c === accent ? 1 : .8)], i * 4);
      l.size[i] = p[3] * (c === accent ? 2.2 : 1);
      l.delay[i] = r();
    }
    if (!reduced && name === 'globe') {
      const base = l.pos.slice();
      live = now => { const a = now * .00012, c = Math.cos(a), s = Math.sin(a); for (let i = 0; i < N; i++) { const x = (base[i * 3] - ox) / sc, z = base[i * 3 + 2] / sc; l.pos[i * 3] = (x * c - z * s) * sc + ox; l.pos[i * 3 + 2] = (x * s + z * c) * sc; } };
    } else if (!reduced && name === 'wave') {
      const base = l.pos.slice();
      live = now => { const t = now * .0005; for (let i = 0; i < N; i++) l.pos[i * 3 + 1] = base[i * 3 + 1] + 60 * Math.sin(base[i * 3] * .004 + t) * Math.cos(base[i * 3 + 2] * .003 + t * .7); };
    } else live = null;
    return l;
  }

  function resize() {
    if (!gl) return;
    W = innerWidth; H = innerHeight; dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = W * dpr; cv.height = H * dpr; gl.viewport(0, 0, cv.width, cv.height);
  }
  function frame(now) {
    if (live) live(now);
    if (morph) {
      const T = Math.min((now - morph.t0) / morph.dur, 1), S = .6;
      for (let i = 0; i < N; i++) {
        const q = Math.min(Math.max((T - target.delay[i] * S) / (1 - S), 0), 1), e = eases(q), arc = 170 * Math.sin(Math.PI * e), a = i * 3, b = i * 4;
        cur.pos[a] = from.pos[a] + (target.pos[a] - from.pos[a]) * e + arc * Math.cos(phase[a]);
        cur.pos[a + 1] = from.pos[a + 1] + (target.pos[a + 1] - from.pos[a + 1]) * e + arc * Math.sin(phase[a]);
        cur.pos[a + 2] = from.pos[a + 2] + (target.pos[a + 2] - from.pos[a + 2]) * e;
        for (let c = 0; c < 4; c++) cur.col[b + c] = from.col[b + c] + (target.col[b + c] - from.col[b + c]) * e;
        cur.size[i] = from.size[i] + (target.size[i] - from.size[i]) * e;
      }
      if (T >= 1) morph = null;
    } else if (live && target) cur.pos.set(target.pos);
    const t = now * .001, wob = reduced ? 0 : 1.2;
    for (let i = 0; i < N * 3; i += 3) {
      drawn[i] = cur.pos[i] + wob * Math.sin(t * .4 + phase[i]);
      drawn[i + 1] = cur.pos[i + 1] + wob * Math.cos(t * .33 + phase[i + 1]);
      drawn[i + 2] = cur.pos[i + 2];
    }
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(U.r, W, H); gl.uniform1f(U.fit, Deck.fit); gl.uniform1f(U.dpr, dpr); gl.uniform1f(U.f, F);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf.p); gl.bufferData(gl.ARRAY_BUFFER, drawn, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf.c); gl.bufferData(gl.ARRAY_BUFFER, cur.col, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf.s); gl.bufferData(gl.ARRAY_BUFFER, cur.size, gl.DYNAMIC_DRAW);
    gl.drawArrays(gl.POINTS, 0, N);
    requestAnimationFrame(frame);
  }
  return {
    resize,
    init() {
      cv = document.getElementById('dots');
      if (!cv) return;
      gl = cv.getContext('webgl', { antialias: true, premultipliedAlpha: true });
      if (!gl) return;
      reduced = Deck.still;
      N = Math.min(6000, parseInt(document.documentElement.dataset.dotsCount || 4000, 10));
      const VS = 'attribute vec3 aP;attribute vec4 aC;attribute float aS;uniform vec2 uR;uniform float uFit,uDpr,uF;varying vec4 vC;void main(){float d=uF+aP.z;if(d<40.){gl_Position=vec4(2.,2.,2.,1.);gl_PointSize=0.;return;}float s=uF/d;gl_Position=vec4(aP.x*s*uFit/(uR.x*.5),-aP.y*s*uFit/(uR.y*.5),0.,1.);gl_PointSize=aS*s*uFit*uDpr;vC=aC;}';
      const FS = 'precision mediump float;varying vec4 vC;void main(){float d=length(gl_PointCoord-.5)*2.;float a=vC.a*smoothstep(1.,.8,d);gl_FragColor=vec4(vC.rgb*a,a);}';
      const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; };
      const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(p); gl.useProgram(p);
      U = { r: gl.getUniformLocation(p, 'uR'), fit: gl.getUniformLocation(p, 'uFit'), dpr: gl.getUniformLocation(p, 'uDpr'), f: gl.getUniformLocation(p, 'uF') };
      const attr = (name, size) => { const b = gl.createBuffer(), a = gl.getAttribLocation(p, name); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, size, gl.FLOAT, false, 0, 0); return b; };
      buf = { p: attr('aP', 3), c: attr('aC', 4), s: attr('aS', 1) };
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.clearColor(0, 0, 0, 0);
      cur = makeSet(); from = makeSet(); drawn = new Float32Array(N * 3); phase = new Float32Array(N * 3);
      for (let i = 0; i < phase.length; i++) phase[i] = Math.random() * 6.283;
      resize();
      requestAnimationFrame(frame);
    },
    show(spec, slide) {
      if (!gl) return;
      const key = `${spec}|${slide.dataset.dotsAt || ''}|${slide.dataset.dotsAccent || ''}|${slide.dataset.dotsAlpha || ''}|${getComputedStyle(slide).getPropertyValue('--ink')}`;
      if (key === lastSpec) return;
      lastSpec = key;
      target = layout(spec, slide);
      if (Deck.still) { cur.pos.set(target.pos); cur.col.set(target.col); cur.size.set(target.size); morph = null; return; }
      from.pos.set(cur.pos); from.col.set(cur.col); from.size.set(cur.size);
      morph = { t0: performance.now(), dur: 2200 };
    },
  };
})();
