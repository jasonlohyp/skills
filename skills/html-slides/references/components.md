# Components

Nine animated blocks: 6 layouts and 3 charts. Add `--components` to `new-deck.mjs`, then copy a snippet from `runtime/components/snippets/` into a slide. They need no library.

Use a component only when the slide's content has that shape. Use one per slide, two at most. Replace every `REPLACE` with the user's real content. `check-deck.mjs` fails a deck that still has one.

| File | Use it when the slide says | Motion |
|---|---|---|
| `01-kpi` | One number matters, with up to two more beside it | Numbers count up, a bar fills |
| `02-statement` | One hero sentence or quote | Words rise, a line draws |
| `03-flow` | A three-step method | A line draws, a dot travels along it |
| `04-timeline` | Stages over time, with one marked now | A line draws down, items slide in, now pulses |
| `05-before-after` | A change with two clear states | Sweeps by itself, then can be dragged |
| `06-feed` | "This is what live activity looks like" | A list scrolls without end. Use it for mood |
| `07-line-chart` | A trend over time, one or two lines | Lines draw, area fades in |
| `08-bar-chart` | Compare 3 to 8 things | Bars grow one after another |
| `09-pie-chart` | Share of a whole, 2 to 5 parts that add up to 100 | Wedges sweep in |

## How to use one

The `.fs-comp` wrapper fills its box, so give that box a size. Text scales with the box.

```html
<div style="width:1100px;height:640px">
  <!-- paste the snippet here -->
</div>
```

Rough minimum sizes: charts 800x500, KPI 600x500, flow 1100x400, timeline 700x600, statement 900x400.

## Colours

The components read the deck's `--ink`, `--muted`, `--accent`, `--ground` and fonts, so they follow the design and work on light or dark slides. Set chart colours in the data: `"color":"var(--accent)"`.

## Data

| Component | Attribute | Meaning |
|---|---|---|
| statement | `data-text`, `data-em` | The sentence, and the word in the accent colour |
| before-after | `data-to` | Where the sweep stops, 0 to 100 |
| feed | `data-items` | `[["time","text","hi","High"]]`. Level is `hi`, `md` or `lo` |
| line | `data-labels`, `data-series`, `data-max` | X labels, `[{"name","color","values"}]`, top of the scale |
| bars | `data-items`, `data-max`, `data-highlight` | `[["Label",84]]`, top of the scale, the bar in accent colour (-1 for none) |
| pie | `data-items` | `[["Label",42,"var(--accent)"]]`, adding up to 100 |

In edit mode, the user clicks a component to change this data. KPI numbers come from the text, so the user types the new number.

Use only the user's real numbers. If there is no data, drop the chart and say why.
