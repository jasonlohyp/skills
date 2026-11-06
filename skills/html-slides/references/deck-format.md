# Deck format

`new-deck.mjs` makes one HTML file with the runtime inside. Add your work in two places only:

- Design CSS: in `<style id="deck-design">`. Colours and fonts are in `<style id="deck-theme">`.
- Slides: inside `<div id="world">`, replacing the starter `<section>`.

To add many slides at once, write them to files and pass `--design-css design.css --slides slides.html` when you make the deck. Do not use a text replace on the style blocks, because a wrong match can delete the runtime.

A one-off script is fine for writing repeated drawn parts, such as 40 small SVG shapes. Run it once, put the result in the HTML, and do not keep it as the source.

Do not change `<style id="deck-runtime">` or `<script id="deck-runtime-js">`.

## A slide

```html
<section class="slide" data-heading="02 / The plan" data-ground="#efe6d0" data-enter="wipe">
  <h2 data-move="rise">Vans take 38% of our budget</h2>
  <p data-step="1" data-move="fade">Next press shows this line.</p>
  <img data-move="scale" src="data:image/jpeg;base64,..." alt="A van at the depot">
  <aside class="notes">What the speaker says.</aside>
</section>
```

- The stage is always 1920x1080 and scales to fit. Lay out in pixels. Do not use breakpoints. It letterboxes on other shapes, and the ground colour fills the window, so no frame shows.
- A slide has 130px side padding and 110px top and bottom padding. Change it in your CSS if the design needs it.
- `data-heading`: small heading in a fixed place at the top left. Use it when someone expects a framework or section names. Slides without it show none, so it can appear on chapter openers only.
- `data-ground` stays in force on the slides after it, so set it once per chapter. To go back, set it again, for example `data-ground="var(--ground)"`.
- `data-step` on a parent also holds back the items inside it. An item with `data-until="1"` leaves at step 2, and the slide gets that extra step by itself.
- A move replaces the element's CSS `transform` while it runs. If an element has its own rotation, put `data-move` on a wrapper and the rotation on the inner element, or it snaps at the end.
- For `rise` on large type, keep `line-height` at 1.05 or more, or the masks can cut the tails of letters.
- `.slide` adds no text styles. Give your design classes a clear target, because a rule such as `.part p` beats `.big`.
- Text colour follows the slide's ground. Use `var(--ink)`, `var(--muted)` and `var(--accent)`, and do not hard-code text colours unless the design needs it.
- If the deck has no photos on purpose, add `data-no-pictures="drawn"` to `<html>`. The check then stops warning about it.
- Pictures must be inside the file as `data:` URLs, so the deck works offline. Make them small first: about 1600px wide at most.

## What edit mode can reach

Edit mode finds text by itself in `h1`-`h5`, `p`, `li`, `blockquote`, `figcaption`, `td`, `th`, `dt` and `dd`. Add `data-edit` to any other element that holds words, such as a `div` or `span`. Without it, the user cannot edit those words.

- `img` inside a slide: click to swap.
- `[data-fs]` component with data: click to edit the data.
- `.notes`: press N.
- Inline tags (`<em>`, `<b>`) stay when the user edits around them.
- Text drawn only in SVG or canvas cannot be edited, and neither can dot-field words. Tell the user. Use HTML text for words that may change.

## Keys

| Key | Does |
|---|---|
| Right, Down, Space, Page Down, left click | Next |
| Left, Up, Page Up | Back |
| Home, End | First, last |
| F | Full screen |
| N | Speaker notes |
| E | Edit mode |
| H | In edit mode: hide or show this slide |
| Ctrl+S | Save into the file |

Add `#5` to the address to open at step 5, with no animation. Add `?still` for no motion at all.

## Your own script

If a slide needs custom behaviour, add a `<script>` before the runtime script. Use `Deck.onChange(cb)`. `Deck.start()` must stay the last line of the runtime script. To skip advancing when something is clicked, add `data-no-advance` to it.

## Limits

- Edit mode cannot add, delete or reorder slides. The user can hide a slide. For the rest, they ask Claude.
- Saving to the same file works in Chrome and Edge. Other browsers save a new copy to Downloads.
- The dot field needs WebGL. Without it, the deck still works, with no dots.
- Reduced-motion settings turn off moves, and all content still shows.
- `new-deck.mjs` prints which weights each font has. If a font has no bold or italic, do not use them in the design, because the browser fakes them. Symbols such as arrows may come from a system font.
- Fonts hold Latin letters by default. Add `--subset "cyrillic,greek"` to `new-deck.mjs` for other scripts. Chinese, Japanese and Korean fonts are too large to embed, so those decks use the machine's own fonts.
- A drawn bar or shape does not follow an edited number. Only count-up text and components do. Tell the user which drawings are fixed.
