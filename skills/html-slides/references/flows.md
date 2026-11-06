# Flows for step 4

The flow is how one slide becomes the next. Set it with `--flow` or on `<html data-flow="...">`.

| Flow | What the audience sees | Good for | Avoid when |
|---|---|---|---|
| `vertical` | Slides glide up, like moving down a page | Most talks, a clear list of topics | The story has one continuous thread |
| `horizontal` | Slides glide sideways, like a timeline | Time, stages, before and after | Long talks, where it feels like endless paging |
| `fade` | One slide dissolves into the next, with a small scale change | Calm or formal rooms, photos | The audience needs a strong sense of progress |
| `world` | The camera flies through 3D space. The next slide waits, small and dim, in the distance | A journey, a roadmap, a talk that should feel like one place | Very formal rooms, many small details on each slide |

## Add these to any flow

- **Dot field** (`--dots`): thousands of dots behind the slides change shape from step to step. They can be noise that becomes a word, clusters, parallel lines or a globe. This is the strongest single effect, and it suits a talk with one big idea such as "noise becomes order". Do not use it as wallpaper. See `motion-rules.md`.
- **Colour wipe** (`data-enter="wipe"` on a slide with its own `data-ground`): a circle grows until it fills the screen. Use it to mark a chapter change. Use it 2 or 3 times in a talk, no more.
- **Steps** (`data-step`): things appear one press at a time, so the speaker keeps the pace.

## Position marks

Set `data-nav` on `<html>`: `dots` (small dots at the right edge), `bar` (thin line at the bottom) or `none`.

## Making samples

Make one small file per flow, with the user's own title and one point:

```bash
node SKILL_DIR/scripts/new-deck.mjs samples/world.html --flow world --title "..." --ground "#hex" --accent "#hex"
```

Put 2 or 3 real slides in each sample, then ask the user to press the arrow key. If the user wants something not on this list (for example a scroll story), tell them it is custom work, then build it on the same stage and steps.
