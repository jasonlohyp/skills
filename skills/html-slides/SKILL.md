---
name: html-slides
description: Use when someone wants a slide deck, presentation, talk, keynote or pitch built or redesigned as an HTML file, from notes, a script, a PowerPoint (PPT, PPTX) or only a topic, or wants slides that can be edited in the browser, have strong motion, or do not look AI-made.
---

# html-slides

Make one HTML file that is a real talk: it has one idea, it moves with meaning, and the owner can edit it without any tool.

**Core rule:** decide with the user first, build second. Most bad decks come from a wrong guess about the audience or the look, so the steps below stop those guesses early.

`SKILL_DIR` below means the folder that holds this file.

## The steps

Work in order. A step marked **STOP** needs the user's answer before the next step. Keep the decisions in `plan.md` next to the deck.

If the user cannot answer (a batch run, or they say "just do it"), write each question and your best guess into `plan.md` under **Guesses to confirm**, go on, and list those guesses first in your final message. Do not stop for this, and skip the samples in steps 4, 5 and 7. Do not invent facts: put missing facts on the list, and leave them off the slides.

### 1. Read
Read everything before asking anything: notes, script, brand files, photos.
- PowerPoint: `python SKILL_DIR/scripts/extract-pptx.py input.pptx work/` (needs `pip install python-pptx`). Also look at its pictures and slide images.
- List each fact, number and name. These must reach the deck unchanged. List anything that clashes (for example a cost on one slide that differs from the ask on another), and any gap (for example a target with no starting number).

### 2. Grill the talk. **STOP**
Read `references/questions.md`. Ask one question at a time, each with your suggested answer. Skip what the files already answer. You must know: the goal, who is in the room, what they **already know**, the time limit, live or read alone, and the one thing they should do after.

### 3. Who leads the design. **STOP**
Ask this exact choice: **I lead** (the user gives the look), **You lead** (you decide and show them), or **Copy my reference** (a file, picture, video or brand book to follow).

### 4. Pick the flow. **STOP**
Read `references/flows.md`. Offer the flows that fit. Make a short sample of each, using the user's own title, and let them try it. Use `scripts/new-deck.mjs` for samples. A flow is hard to judge from a description.

### 5. Lock the look. **STOP**
Read `references/design-rules.md`. Fix these in `plan.md`: colours and what each colour means, two fonts, the motion level (calm, strong or bold, shown as moving samples), and the real pictures to use. Ask for real photos or product screenshots now. After this step, add no new colour or font without asking.

If a skill named `design-taste-frontend` is available, use its direction tool for ideas in **You lead** mode. It is written for web pages, so its page rules (a button, a video, one main title) do not apply to a talk.

### 6. Find the big idea. **STOP**
Give 2 or 3 story ideas. Each has one sentence, one picture or motif that runs through the talk, and one signature moment. Take them from the user's own words where you can. Then write the per-slide plan in `plan.md`:

| Slide | The one point | Layout | What moves | What the move means | Spoken words |

Read `references/motion-rules.md` first. If you cannot say what a move means, cut the move.

### 7. Test the opening. **STOP**
Build only the opening and the hardest slide. Open them and ask the user to watch at normal speed. Change direction now if needed. A full build in the wrong direction is the most costly fault.

### 8. Build
Read `references/deck-format.md` and, if you use charts or blocks, `references/components.md`.

```bash
node SKILL_DIR/scripts/new-deck.mjs deck.html --title "..." --flow vertical --ground "#hex" --accent "#hex" --display "Google Font" --body "Google Font" [--dots] [--components]
```

After this, the HTML file is the only source. Edit it directly and never make it again from scratch, or you lose the user's edits. Before a big change, copy it to `versions/deck-v1.html`. Put speaker notes in each slide's `<aside class="notes">`.

### 9. Check
Run these in order. Fix and rerun until the script has no FAIL.
1. `node SKILL_DIR/scripts/check-deck.mjs deck.html`
2. Words: follow `references/humanizer.md` on slide words and speaker notes. On slides, only remove AI patterns. Facts, numbers and the user's own phrases stay.
3. `node SKILL_DIR/scripts/record-motion.mjs deck.html motion/` and look at each sheet. Look for flashes, text that arrives late, and things that move at the same time.
4. Export pictures and notes: `node SKILL_DIR/scripts/export-review.mjs deck.html review/`
5. Two fresh critics, each with no knowledge of this chat: `critics/design-critic.md` and `critics/cold-reader.md`. Run them as subagents if you can. The target is 7 or more on each score. A low score that needs a fact from the user goes on the list for the user. Do not invent the fact to raise the score. Give the cold reader the same background the real audience has. If the speaker notes are empty or placeholders, tell the reader so, and have it judge the slides alone. Do at most 2 fix rounds. Report the real scores, even if they miss the target.

### 10. Hand over
Tell the user how to edit, in these words: press **E**, click text and type, click a photo to swap it, click a chart to change its data, press **H** to hide a slide, press **N** for notes, press **Ctrl+S** to save. The first save asks where to save: pick the same file. Chrome and Edge write to the file. Other browsers save a new copy to Downloads.

Then state what you did not test (always: the real motion on their laptop, the projector) and list any **Guesses to confirm**.

## Rules that do not bend

| Rule | Why |
|---|---|
| Keep the user's facts and numbers exactly. Add no invented examples, people or results. | A talk with a made-up fact can hurt the speaker. If an example would help, ask for a real one. |
| Label a target as a target. | Big numbers read as results. |
| Any second accent colour needs a meaning. Test it across every slide before you offer it. | A colour that shows once looks like a mistake. |
| When the user says "too much" or "too plain", change the amount, and keep a copy of the old version. | Both directions are easy to overdo. |
| Never say the motion feels right. | You see frames. Only a person sees the motion. |

## Common mistakes

| Mistake | Do this instead |
|---|---|
| Build first, ask later | Steps 2 to 6 come first, unless the user cannot answer |
| Every slide is three cards in a row | Give each slide a layout that fits its point |
| Particles or glows behind everything | The background must help the point, or be still |
| The same motif on every slide | Show it only where it means something |
| Move the text only | Move the thing that shows the idea: a line that grows, a number that climbs |
| Long animation with a click to wait for | The speaker controls the pace with steps |
| Tell the user to edit the code | Edit mode is in every deck |
