/* html-slides edit mode. E edits, N shows notes, H hides a slide, Ctrl+S writes the changes into the HTML file. */
window.DeckEditor = (() => {
  const ATTRS = ['data-text', 'data-em', 'data-items', 'data-series', 'data-labels', 'data-max', 'data-to', 'data-highlight'];
  const BAR = 'Edit mode. Click text and type. Click a photo to swap it. Click a chart to edit its data. H hides this slide. N shows notes. Ctrl+S saves. E or Esc ends.';
  let on = false, dirty = false, handle = null, texts = [], images = [], comps = [], bar, flag, notesEl, notesOpen = false;
  const edits = { text: new Map(), img: new Map(), attr: new Map(), notes: new Map() };
  const compsIn = doc => [...doc.querySelectorAll('.slide [data-fs]')];
  const imagesIn = doc => [...doc.querySelectorAll('.slide img')];
  const typing = () => { const a = document.activeElement; return !!a && (a.isContentEditable || a.tagName === 'TEXTAREA' || a.tagName === 'INPUT'); };
  const say = t => { bar.textContent = t; bar.hidden = false; };
  const notesOf = s => s.querySelector('.notes');

  function paintNotes() {
    const s = Deck.slides[Deck.current().slide], n = s && notesOf(s), i = Deck.current().slide;
    notesEl.hidden = !notesOpen;
    if (!notesOpen) return;
    notesEl.textContent = edits.notes.has(i) ? edits.notes.get(i) : (n ? n.textContent.trim() : '');
    notesEl.setAttribute('data-empty', notesEl.textContent ? '' : 'none');
    if (on) notesEl.setAttribute('contenteditable', 'plaintext-only'); else notesEl.removeAttribute('contenteditable');
  }
  function paintHidden() {
    const s = Deck.slides[Deck.current().slide];
    flag.hidden = !(on && s && s.hasAttribute('data-hidden'));
  }
  function setEditing(next) {
    if (next === on) return;
    on = next; Deck.editing = on;
    document.body.classList.toggle('editing', on);
    Deck.setInstant(on);
    Deck.setShowHidden(on);
    const sec = document.getElementById('sec');
    if (on) {
      if (window.FSComponents && FSComponents.settle) Deck.slides.forEach(FSComponents.settle);
      document.getAnimations().forEach(a => { try { a.finish(); } catch (e) { a.cancel(); } });
      texts.forEach(el => { Deck.settleCount(el); Deck.unsplit(el); el.setAttribute('contenteditable', 'true'); el.spellcheck = false; });
      sec.setAttribute('contenteditable', 'plaintext-only');
      say(BAR);
    } else {
      if (typing()) document.activeElement.blur();
      texts.forEach(el => el.removeAttribute('contenteditable'));
      sec.removeAttribute('contenteditable');
      bar.hidden = true;
    }
    paintNotes(); paintHidden();
  }
  function setText(i, html) { texts[i].innerHTML = html; edits.text.set(i, html); dirty = true; }
  function setImage(i, src) { images[i].src = src; edits.img.set(i, src); dirty = true; }
  function toggleHidden() {
    const i = Deck.current().slide, s = Deck.slides[i];
    if (!s) return;
    s.toggleAttribute('data-hidden'); dirty = true;
    Deck.rebuild(); paintHidden();
    say(s.hasAttribute('data-hidden') ? 'This slide is hidden. It stays in the file but does not show when you present. Press H to show it again.' : BAR);
  }
  function setHeading(text) {
    const s = Deck.slides[Deck.current().slide], old = s.dataset.heading;
    Deck.slides.forEach(x => { if (x.dataset.heading === old) x.dataset.heading = text; });
    dirty = true;
  }
  /* Photos are made smaller so the file stays easy to share. */
  function readImage(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onerror = reject;
      r.onload = () => {
        const im = new Image();
        im.onerror = reject;
        im.onload = () => {
          const k = Math.min(1, 1920 / Math.max(im.width, im.height)), c = document.createElement('canvas');
          c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
          c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
          resolve(file.type === 'image/png' ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', .86));
        };
        im.src = r.result;
      };
      r.readAsDataURL(file);
    });
  }
  function pickImage(i) {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = async () => {
      if (!inp.files[0]) return;
      try { setImage(i, await readImage(inp.files[0])); say(`Photo swapped. ${BAR}`); } catch (e) { say(`That file did not open as a picture. ${BAR}`); }
    };
    inp.click();
  }
  function openData(comp, i) {
    const box = document.createElement('div'); box.id = 'deck-data'; box.className = 'deck-ui';
    const data = {}; ATTRS.forEach(a => { if (comp.hasAttribute(a)) data[a] = comp.getAttribute(a); });
    box.innerHTML = '<div>Change the values, then press Apply. Keep the quotes and brackets.</div><textarea spellcheck="false"></textarea><div><button data-a="ok">Apply</button><button data-a="no">Cancel</button></div><div data-a="msg"></div>';
    const ta = box.querySelector('textarea'); ta.value = JSON.stringify(data, null, 2);
    box.addEventListener('click', e => {
      const a = e.target.dataset.a;
      if (a === 'no') box.remove();
      if (a === 'ok') {
        try {
          const next = JSON.parse(ta.value);
          Object.entries(next).forEach(([k, v]) => { if (ATTRS.includes(k)) comp.setAttribute(k, typeof v === 'string' ? v : JSON.stringify(v)); });
          edits.attr.set(i, next); dirty = true;
          if (window.FSComponents) { FSComponents.init(comp.closest('.fs-comp') || comp); FSComponents.play(comp.closest('.slide')); }
          box.remove();
        } catch (err) { box.querySelector('[data-a="msg"]').textContent = 'That is not valid. Check the quotes and brackets.'; }
      }
    });
    document.body.appendChild(box);
  }
  function savedHtml() {
    const doc = new DOMParser().parseFromString(Deck.pristine, 'text/html');
    const t = Deck.collectText(doc), im = imagesIn(doc), cs = compsIn(doc), ss = [...doc.querySelectorAll('.slide')];
    edits.text.forEach((html, i) => { t[i].innerHTML = html.replace(/&nbsp;| /g, ' ').replace(/<br\s*\/?>/gi, ' ').replace(/\s+/g, ' ').trim(); });
    edits.img.forEach((src, i) => { im[i].src = src; });
    edits.attr.forEach((obj, i) => Object.entries(obj).forEach(([k, v]) => { if (ATTRS.includes(k)) cs[i].setAttribute(k, typeof v === 'string' ? v : JSON.stringify(v)); }));
    Deck.slides.forEach((s, i) => {
      if (s.hasAttribute('data-hidden')) ss[i].setAttribute('data-hidden', ''); else ss[i].removeAttribute('data-hidden');
      if (s.dataset.heading !== undefined) ss[i].dataset.heading = s.dataset.heading;
    });
    edits.notes.forEach((text, i) => {
      let n = ss[i].querySelector('.notes');
      if (!n) { n = doc.createElement('aside'); n.className = 'notes'; ss[i].appendChild(n); }
      n.textContent = text;
    });
    return `<!doctype html>\n${doc.documentElement.outerHTML}`;
  }
  async function save() {
    const html = savedHtml(), name = decodeURIComponent(location.pathname.split('/').pop() || 'deck.html');
    try {
      if (window.showSaveFilePicker) {
        handle = handle || await showSaveFilePicker({ suggestedName: name, types: [{ description: 'HTML', accept: { 'text/html': ['.html'] } }] });
        const w = await handle.createWritable(); await w.write(html); await w.close();
        say(`Saved. ${on ? BAR : ''}`);
      } else {
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' })); a.download = name; a.click();
        say('A new copy went to your Downloads folder. Replace the old file with it.');
      }
      dirty = false;
    } catch (err) { say(err.name === 'AbortError' ? 'Not saved.' : `Not saved: ${err.message}`); }
  }
  function bind() {
    document.addEventListener('input', e => {
      const i = texts.indexOf(e.target);
      if (i >= 0) { edits.text.set(i, e.target.innerHTML); dirty = true; return; }
      if (e.target.id === 'sec') { setHeading(e.target.textContent.trim()); return; }
      if (e.target === notesEl) { edits.notes.set(Deck.current().slide, notesEl.textContent); dirty = true; }
    });
    document.addEventListener('paste', e => {
      if (!e.target.closest || !e.target.closest('[contenteditable]')) return;
      e.preventDefault();
      document.execCommand('insertText', false, (e.clipboardData || window.clipboardData).getData('text/plain').replace(/\s*\n\s*/g, ' '));
    });
    addEventListener('click', e => {
      if (!on || e.target.closest('.deck-ui') || e.target.closest('[contenteditable]')) return;
      const im = images.indexOf(e.target);
      if (im >= 0) { pickImage(im); return; }
      const c = e.target.closest('[data-fs]');
      if (c && ATTRS.some(a => c.hasAttribute(a))) openData(c, comps.indexOf(c));
    });
    addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) { e.preventDefault(); e.stopImmediatePropagation(); save(); return; }
      if (typing()) {
        if (e.key === 'Escape' || (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target !== notesEl)) { e.preventDefault(); document.activeElement.blur(); }
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'e' || e.key === 'E') setEditing(!on);
      if (e.key === 'Escape' && on) setEditing(false);
      if (e.key === 'n' || e.key === 'N') { notesOpen = !notesOpen; paintNotes(); }
      if ((e.key === 'h' || e.key === 'H') && on) toggleHidden();
    });
    addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
    Deck.onChange(() => { paintNotes(); paintHidden(); });
  }
  return {
    /* Runs before anything changes the page, so the live lists line up with the saved copy. */
    prepare() { texts = Deck.collectText(document); images = imagesIn(document); comps = compsIn(document); },
    init() {
      const ui = (id) => { const d = document.createElement('div'); d.id = id; d.className = 'deck-ui'; d.hidden = true; document.body.appendChild(d); return d; };
      bar = ui('deck-bar'); flag = ui('deck-hidden'); notesEl = ui('deck-notes');
      flag.textContent = 'Hidden slide';
      Deck.typing = typing;
      bind();
    },
    get on() { return on; }, get count() { return { text: texts.length, images: images.length, charts: comps.length }; },
    setEditing, setText, setImage, toggleHidden, setHeading, savedHtml, save,
  };
})();
