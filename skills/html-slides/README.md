# html-slides

A Claude Code skill that makes a slide deck as one HTML file. You give it notes, a script, a PowerPoint or only a topic. It asks you questions, shows you samples, and builds a deck that moves well and does not look AI-made.

You can edit the finished deck in your browser, like PowerPoint. You need no code and no tools.

## What you get

- **One file.** All fonts, code and pictures are inside it. It works offline. You can email it.
- **Edit in the browser.** Press E, then click text and type. Swap photos and change chart data. Hide a slide. Press Ctrl+S to save.
- **Your choice of flow.** Vertical, horizontal, fade, or a 3D camera that flies between slides.
- **Motion with a meaning.** 12 moves, 9 animated blocks and charts, colour wipes, and a field of dots that changes shape.
- **Speaker notes.** Press N. The notes stay in the same file as the slides.
- **Checks.** A script finds faults such as text overflow, weak contrast, repeated layouts and common AI looks. Two fresh AI critics then review the deck.

## How it works

The skill does not start by building. It works in 10 steps, and you make the main decisions:

1. **Read** your files.
2. **Grill** you, one question at a time: your goal, the room, what they already know, your time limit, your ask.
3. **Who leads the design?** You, Claude, or a reference that you supply.
4. **Pick the flow** from samples with your own title.
5. **Lock the look:** colours, fonts, motion level, real pictures.
6. **Find the big idea**, then plan each slide.
7. **Test the opening.** You watch it at normal speed before the full build.
8. **Build** the deck.
9. **Check** it with the script, a wording pass and two critics.
10. **Hand over**, with edit steps and a list of what was not tested.

If you want it fast, say "just do it". Claude then builds on its best guesses and lists them for you to confirm.

## Install

You need [Claude Code](https://code.claude.com) and [Node.js](https://nodejs.org) 22 or newer. You also need Chrome or Edge for the checks, and Python with `python-pptx` for PowerPoint files.

Copy the `html-slides` folder into your skills folder:

```bash
git clone --depth 1 https://github.com/jasonlohyp/skills.git
```

```bash
mkdir -p ~/.claude/skills
```

```bash
cp -r skills/skills/html-slides ~/.claude/skills/
```

Start a new session. Check that the skill shows up by typing `/html-slides`.

For PowerPoint files:

```bash
pip install python-pptx
```

Claude chat on claude.ai is not tested. The skill runs Node scripts, so Claude Code is the safe choice.

## Use it

```
/html-slides Make a deck from my notes in talk.txt
```

```
/html-slides Turn deck.pptx into something much better. You lead the design.
```

```
/html-slides I have a 5 minute talk about why small teams should keep a decision log.
```

## See it first

Download and open a file in [examples](examples/). Both talks are made up. Press the right arrow to move, and press E to try editing.

- [quiet-beehive.html](examples/quiet-beehive.html): vertical flow, dot field, colour wipe and a chart.
- [harbor-bikes.html](examples/harbor-bikes.html): fade flow and drawn pictures. An AI agent using this skill built it from rough notes, with no help from a person.

## Edit your deck

Open the HTML file in Chrome or Edge, then:

| Key | What it does |
|---|---|
| Right arrow, Space or left click | Next |
| Left arrow | Back |
| F | Full screen |
| N | Show speaker notes |
| E | Start or end edit mode |
| Click text in edit mode | Type new words |
| Click a photo in edit mode | Swap the photo |
| Click a chart in edit mode | Change its data |
| H in edit mode | Hide or show this slide |
| Ctrl+S | Save |

The first save asks where to save. Pick the same file. Other browsers save a new copy to your Downloads folder.

Edit mode cannot add, delete or reorder slides. It also cannot change words drawn in dots. For these, ask Claude.

## Limits

- It can check text, layout, timing and frames. It cannot judge how motion feels, so you must watch your deck at normal speed.
- Test on the laptop and projector you will use.
- The design-taste step works better if you also have a design skill installed. `html-slides` uses `design-taste-frontend` when it finds it, and works without it.
- The critics are AI. Treat their scores as a hint.

## How it was tested

- `node tests/test-runtime.mjs` runs 140 checks in a real browser, on all four flows, with real key presses.
- Three AI agents made decks without the skill, and three made decks with it, from the same notes, PowerPoint and topic. With the skill, all three passed the deck checker. Without it, all three had faults, and none could be edited on the page.
- The real save window needs a person, so the automatic tests stop just before it. They check the saved HTML by opening it again.
- It has not yet had a blind test with real people.

## Credits

The fixed 16:9 stage idea and the PowerPoint extractor come from [frontend-slides](https://github.com/zarazhangrui/frontend-slides) by Zara Zhang. The wording rules come from [humanizer](https://github.com/blader/humanizer) by Siqi Chen. Both use the MIT licence. See [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).

`html-slides` differs from `frontend-slides`: it grills you on the talk first, adds flows and a motion plan, edits photos and chart data, and checks the deck with a script and critics. If you have both installed, name the one you want.

## License

[MIT](../../LICENSE)
