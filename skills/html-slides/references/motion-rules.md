# Motion rules

Motion is there to show the idea. It is not decoration. The test for every move: **what does this move mean?** Write the answer in the plan. If there is no answer, cut the move.

## Motion levels

Ask the user to pick from moving samples. The word alone is not enough, because people mean different things by "cool".

| Level | What it has | Risk |
|---|---|---|
| **Calm** | Text and blocks arrive, and the flow is soft. No dot field. | Can look like an ordinary deck |
| **Strong** | One signature effect, moves that carry meaning, 2 or 3 colour wipes. | The usual best choice |
| **Bold** | Dot field through the talk, camera flow, a moment on each chapter. | Can make people dizzy, and draws eyes off the point |

Expect to adjust. If the user says "too much", cut the moves with no meaning first. If the user says "too plain", add back meaning, not decoration: a line that draws, a number that climbs, a shape that forms.

## Rules

1. **One main move per slide.** Other things may arrive, but only one thing should catch the eye.
2. **Move, then rest.** Things arrive, then the slide stays still while the speaker talks. Nothing that loops behind text, except a very slow background.
3. **Move the idea.** A rising cost is a line that climbs. Noise becoming order is dots forming a word. Moving only text is the weak choice.
4. **The speaker controls the pace.** Use `data-step` for each new point. Do not make the speaker wait for an animation.
5. **Keep one signature moment.** The audience should remember one thing. Protect it by keeping the slides around it simple.
6. **Motif discipline.** A repeated symbol (a dot, a line) appears only where it means something. Do not put it on every slide because it is the motif.
7. **Same kind of move, same meaning.** Use 3 to 6 kinds of move in a deck.
8. **Backgrounds stay quiet.** If people watch the background, it is too strong. Make it slower and fainter, or remove it.
9. **No dragging or tricks in a live talk.** The speaker has one job.

## Moves

Put `data-move` on any element.

| `data-move` | What happens | Use it for |
|---|---|---|
| `rise` | Words rise from a mask, one after another | Titles and statements. Text only, no blocks |
| `fade` | Fades in and lifts a little | Supporting lines |
| `scale` | Grows a little as it fades in | Photos, large blocks |
| `pop` | Springs in | One small thing that must be noticed |
| `left`, `right` | Slides in from the side | Steps, two sides of a choice |
| `wipe` | Is revealed from left to right | Lines, charts, a highlight |
| `grow` | Grows from one edge. `data-axis="y"` grows upward | Bars, meters, progress |
| `focus` | Goes from blurred to sharp | A thing becoming clear |
| `stagger` | Its children arrive one by one | A group that belongs together |
| `draw` | SVG lines draw themselves | Paths, drawn symbols |
| `count` | The number counts up to the value in its text | One number that matters |

Options: `data-step="1"` (appears on that press), `data-until="2"` (leaves after that press), `data-delay="0.6"` (seconds), `data-dur="1.2"` (seconds).

## Dot field

Add `--dots` to `new-deck.mjs`, then set `data-dots` on a slide. Use `|` to change shape on each step: `data-dots="scatter|text:CLEAR"`.

| Shape | Picture | Can mean |
|---|---|---|
| `scatter` | Dots everywhere | Noise, too much data, confusion |
| `cluster:3` | Three groups | Groups, teams, segments |
| `lines:5` | Parallel straight lines | Clear options, tracks, next steps |
| `line` | One straight line | One clear path, focus |
| `ring` | Tilted rings | Orbit, cycle |
| `globe` | Slowly turning sphere | Reach, a whole company, the world |
| `wave` | A rolling surface | Calm, a field, the ground under the story |
| `grid` | An even grid | Order, measured, everyone counted |
| `text:WORD` | The dots form a word | The signature moment |
| `none` | The dots fade away | Clear the stage |

Options on the slide: `data-dots-at="x,y,scale"` moves it (stage centre is 0,0), `data-dots-accent="0.05"` is the share of accent-coloured dots, `data-dots-alpha="0.5"` makes it fainter. Keep text out of the area where the dots are dense.

## Colour wipe

On a slide: `data-ground="#hex" data-enter="wipe"`. Text colour changes by itself to suit a light or dark ground. Use it for chapter changes only. `data-origin="30 60"` sets where the circle starts, in percent of the screen.
