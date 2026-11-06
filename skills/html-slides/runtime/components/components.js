/* ===========================================================
   FSComponents: runtime for the html-slides components
   No dependencies. Pair with components.css.

   Usage in a deck:
     FSComponents.init();                 // builds words, charts, feeds from data-* attributes
     FSComponents.bindSlides('.slide');   // plays a slide's components when it gets .visible

   Usage anywhere else (gallery, a plain page):
     <section data-fs-scope> ... components ... </section>
     FSComponents.init();
     FSComponents.play(scopeEl);          // run the animations (add .play + start JS hooks)
   =========================================================== */
(function () {
  'use strict';
  var FS = (window.FSComponents = {});
  var NS = 'http://www.w3.org/2000/svg';

  /* ---------- helpers ---------- */
  var ease = function (t) { return 1 - Math.pow(1 - t, 4); };
  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in (attrs || {})) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function json(node, attr, fallback) {
    var raw = node.getAttribute(attr);
    if (!raw) return fallback;
    try { return JSON.parse(raw); } catch (err) { return fallback; }
  }
  /* Draw an SVG chart at its real pixel size so text and dots are never stretched. Redraws on resize. */
  function responsive(svg, draw) {
    var run = function () {
      svg.innerHTML = '';
      var r = svg.getBoundingClientRect();
      var W = Math.max(300, Math.round(r.width)), H = Math.max(150, Math.round(r.height));
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      draw(W, H);
    };
    run();
    if ('ResizeObserver' in window) {
      new ResizeObserver(function () { clearTimeout(svg._fsT); svg._fsT = setTimeout(run, 150); }).observe(svg);
    }
  }

  /* ---------- KPI: count-up ---------- */
  function playKpi(root) {
    root.querySelectorAll('[data-count]').forEach(function (n, i) {
      settleKpi(n);
      var raw = n.textContent.trim(), m = raw.match(/^(\D*)(\d[\d,]*(?:\.\d+)?)(.*)$/);
      if (!m) return;
      var to = +m[2].replace(/,/g, ''), dec = (m[2].split('.')[1] || '').length, comma = m[2].indexOf(',') >= 0;
      var t0 = performance.now() + i * 150, dur = 1600, token = {};
      n._fsCount = { token: token, raw: raw };
      var tick = function (now) {
        if (!n._fsCount || n._fsCount.token !== token) return;
        var p = Math.min(Math.max((now - t0) / dur, 0), 1), v = to * ease(p);
        n.textContent = m[1] + (comma ? Math.round(v).toLocaleString('en-US') : v.toFixed(dec)) + m[3];
        if (p < 1) requestAnimationFrame(tick); else settleKpi(n);
      };
      requestAnimationFrame(tick);
    });
  }
  function settleKpi(n) { if (n._fsCount) { n.textContent = n._fsCount.raw; delete n._fsCount; } }

  /* ---------- BEFORE / AFTER: drag + auto-sweep ---------- */
  function setupCmp(box) {
    var dragging = false;
    var set = function (pct) { box.style.setProperty('--pos', pct + '%'); };
    var fromEvent = function (e) { var r = box.getBoundingClientRect(); set(Math.min(100, Math.max(0, (e.clientX - r.left) / r.width * 100))); };
    box.addEventListener('pointerdown', function (e) { dragging = true; cancelAnimationFrame(box._fsRaf); box.setPointerCapture(e.pointerId); fromEvent(e); });
    box.addEventListener('pointermove', function (e) { if (dragging) fromEvent(e); });
    box.addEventListener('pointerup', function () { dragging = false; });
    box._fsSweep = function () {
      cancelAnimationFrame(box._fsRaf); set(100);
      var t0 = performance.now() + 500, from = 100, to = +(box.dataset.to || 50), dur = 1800;
      var tick = function (now) {
        if (dragging) return;
        var p = Math.min(Math.max((now - t0) / dur, 0), 1);
        set(from + (to - from) * ease(p));
        if (p < 1) box._fsRaf = requestAnimationFrame(tick);
      };
      box._fsRaf = requestAnimationFrame(tick);
    };
  }

  /* ---------- STATEMENT: split into masked words ---------- */
  function buildStatement(root) {
    var h = root.querySelector('h2'); if (!h) return;
    var text = root.dataset.text || h.textContent;
    var em = root.dataset.em || '';
    h.innerHTML = text.split(' ').map(function (w, i) {
      return '<span class="w"><span style="--i:' + i + '" class="' + (w === em ? 'em' : '') + '">' + w + '</span></span>';
    }).join('');
  }

  /* ---------- ALERT FEED: list duplicated so the loop is seamless ---------- */
  function buildFeed(root) {
    var rows = json(root, 'data-items', []);
    var html = rows.map(function (r) {
      return '<li><time>' + r[0] + '</time><span>' + r[1] + '</span><span class="sev ' + r[2] + '">' + r[3] + '</span></li>';
    }).join('');
    root.querySelector('ul').innerHTML = html + html;
  }

  /* ---------- LINE CHART ---------- */
  function buildLine(root) {
    var svg = root.querySelector('svg'), tip = root.querySelector('.tip');
    var labels = json(root, 'data-labels', []);
    var series = json(root, 'data-series', []);
    var max = +root.dataset.max || 120;
    var legend = root.querySelector('.legend');
    if (legend) legend.innerHTML = series.map(function (s) { return '<span><i style="background:' + s.color + '"></i>' + s.name + '</span>'; }).join('');
    responsive(svg, function (W, H) {
      var P = { l: 62, r: 14, t: 14, b: 42 }, n = labels.length;
      var x = function (i) { return P.l + i * (W - P.l - P.r) / (n - 1); };
      var y = function (v) { return H - P.b - v / max * (H - P.t - P.b); };
      var g = el('g', { class: 'grid' }, svg), ax = el('g', { class: 'axis' }, svg);
      [0, 0.25, 0.5, 0.75, 1].forEach(function (f) {
        var v = Math.round(max * f);
        el('line', { x1: P.l, x2: W - P.r, y1: y(v), y2: y(v) }, g);
        el('text', { x: P.l - 12, y: y(v) + 8, 'text-anchor': 'end' }, ax).textContent = v;
      });
      labels.forEach(function (m, i) { el('text', { x: x(i), y: H - 8, 'text-anchor': 'middle' }, ax).textContent = m; });
      var curve = function (d) {
        var s = 'M' + x(0) + ',' + y(d[0]);
        for (var i = 0; i < d.length - 1; i++) {
          var p0 = i ? i - 1 : 0, p3 = i + 2 < d.length ? i + 2 : i + 1, k = 0.18;
          s += 'C' + (x(i) + (x(i + 1) - x(p0)) * k) + ',' + (y(d[i]) + (y(d[i + 1]) - y(d[p0])) * k) + ' ' +
               (x(i + 1) - (x(p3) - x(i)) * k) + ',' + (y(d[i + 1]) - (y(d[p3]) - y(d[i])) * k) + ' ' + x(i + 1) + ',' + y(d[i + 1]);
        }
        return s;
      };
      series.forEach(function (s, si) {
        var p = curve(s.values);
        el('path', { d: p + 'L' + x(n - 1) + ',' + y(0) + 'L' + x(0) + ',' + y(0) + 'Z', fill: s.color, class: 'area' }, svg);
        el('path', { d: p, stroke: s.color, class: 'ln' + (si ? ' b' : ''), pathLength: 1 }, svg);
        s.values.forEach(function (v, i) { el('circle', { cx: x(i), cy: y(v), r: 3.5, fill: s.color, class: 'pt', style: '--i:' + i }, svg); });
      });
      var cross = el('line', { class: 'cross', y1: P.t, y2: H - P.b }, svg);
      svg.onpointermove = function (e) {
        var r = svg.getBoundingClientRect(), hr = root.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width * W;
        var i = Math.min(n - 1, Math.max(0, Math.round((px - P.l) / ((W - P.l - P.r) / (n - 1)))));
        cross.setAttribute('x1', x(i)); cross.setAttribute('x2', x(i)); cross.style.opacity = 1;
        tip.innerHTML = labels[i] + ' · ' + series.map(function (s) { return s.name + ' <b>' + s.values[i] + '</b>'; }).join(' · ');
        tip.style.left = (r.left - hr.left + x(i) / W * r.width) + 'px';
        tip.style.top = (r.top - hr.top + Math.min.apply(null, series.map(function (s) { return y(s.values[i]); })) / H * r.height) + 'px';
        tip.style.opacity = 1;
      };
      svg.onpointerleave = function () { cross.style.opacity = 0; tip.style.opacity = 0; };
    });
  }

  /* ---------- BAR CHART ---------- */
  function buildBars(root) {
    var svg = root.querySelector('svg');
    var data = json(root, 'data-items', []), max = +root.dataset.max || 100;
    var hi = root.dataset.highlight === undefined ? 0 : +root.dataset.highlight; // index drawn in accent colour, -1 for none
    responsive(svg, function (W, H) {
      var P = { l: 62, r: 8, t: 34, b: 42 }, bw = (W - P.l - P.r) / data.length;
      var y = function (v) { return H - P.b - v / max * (H - P.t - P.b); };
      var g = el('g', { class: 'grid' }, svg), ax = el('g', { class: 'axis' }, svg);
      [0, 0.25, 0.5, 0.75, 1].forEach(function (f) {
        var v = Math.round(max * f);
        el('line', { x1: P.l, x2: W - P.r, y1: y(v), y2: y(v) }, g);
        el('text', { x: P.l - 12, y: y(v) + 8, 'text-anchor': 'end' }, ax).textContent = v;
      });
      data.forEach(function (d, i) {
        var bx = P.l + i * bw + bw * 0.18, w = bw * 0.64;
        el('rect', { x: bx, y: y(d[1]), width: w, height: y(0) - y(d[1]), fill: i === hi ? 'var(--fs-accent)' : 'var(--fs-fg)', class: 'rect', style: '--i:' + i }, svg);
        el('text', { x: bx + w / 2, y: y(d[1]) - 10, class: 'val', style: '--i:' + i }, svg).textContent = d[1];
        el('text', { x: bx + w / 2, y: H - 8, 'text-anchor': 'middle' }, ax).textContent = d[0];
      });
    });
  }

  /* ---------- PIE CHART: true pie via a thick stroke on a r=25 circle (circumference = 100 with pathLength) ---------- */
  function buildPie(root) {
    var svg = root.querySelector('svg'), ul = root.querySelector('ul');
    var data = json(root, 'data-items', []), start = 0;
    svg.setAttribute('viewBox', '0 0 100 100'); svg.innerHTML = ''; ul.innerHTML = '';
    data.forEach(function (d, i) {
      el('circle', { cx: 50, cy: 50, r: 25, pathLength: 100, stroke: d[2], class: 'seg',
        style: '--i:' + i + ';--len:' + (d[1] - 0.6) + ';stroke-dashoffset:' + (-start) }, svg);
      start += d[1];
      ul.insertAdjacentHTML('beforeend', '<li style="--i:' + i + '"><i style="background:' + d[2] + '"></i><span>' + d[0] + '</span><b>' + d[1] + '%</b></li>');
    });
  }

  /* ---------- public API ---------- */
  FS.init = function (root) {
    root = root || document;
    root.querySelectorAll('[data-fs="statement"]').forEach(buildStatement);
    root.querySelectorAll('[data-fs="feed"]').forEach(buildFeed);
    root.querySelectorAll('[data-fs="line"]').forEach(buildLine);
    root.querySelectorAll('[data-fs="bars"]').forEach(buildBars);
    root.querySelectorAll('[data-fs="pie"]').forEach(buildPie);
    root.querySelectorAll('[data-fs="cmp"]').forEach(function (b) { if (!b._fsSweep) setupCmp(b); });
  };

  /* Start the animations inside a scope element (a slide, a tile, any wrapper with data-fs-scope). */
  FS.play = function (scope) {
    scope.classList.remove('play');
    void scope.offsetWidth;
    scope.classList.add('play');
    scope.querySelectorAll('[data-fs="kpi"]').forEach(playKpi);
    scope.querySelectorAll('[data-fs="cmp"]').forEach(function (b) { if (b._fsSweep) b._fsSweep(); });
  };
  FS.settle = function (scope) { scope.querySelectorAll('[data-count]').forEach(settleKpi); };

  /* Only touch the class when it is set: even a no-op classList.remove() writes the attribute and
     would re-trigger the MutationObserver in bindSlides (an endless loop). */
  FS.stop = function (scope) { FS.settle(scope); if (scope.classList.contains('play')) scope.classList.remove('play'); };

  /* Play a slide's components whenever the slide gets .visible; reset them when it leaves. */
  FS.bindSlides = function (selector) {
    document.querySelectorAll(selector || '.slide').forEach(function (slide) {
      slide.setAttribute('data-fs-scope', '');
      var sync = function () { slide.classList.contains('visible') ? (slide.classList.contains('play') || FS.play(slide)) : FS.stop(slide); };
      new MutationObserver(sync).observe(slide, { attributes: true, attributeFilter: ['class'] });
      sync();
    });
  };
})();
