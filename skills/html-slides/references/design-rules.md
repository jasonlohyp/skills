# Design rules

The aim: a person looks at it and thinks a designer made it for this one talk.

## Start from the subject

Before you pick colours, find what the topic looks like in the real world: its objects, materials, places and tools. A library talk can borrow a catalogue card. A freight talk can borrow a shipping label. The design then belongs to this talk and no other.

If the user has a brand, the brand wins. Read colours from their files or pictures. Do not add a colour because it looks nice.

## Type

- Use two fonts at most. Pick one with character for big words.
- Fonts from Google Fonts go inside the file through `new-deck.mjs`. The script warns you if it cannot fetch a font.
- Avoid Inter, Roboto, Poppins, Montserrat and Space Grotesk as the main font. They are in most AI-made pages.
- On the 1920x1080 stage: body text 32px or more, big statements 80 to 200px, and nothing under 24px. Make the size gap large: a big word next to a small line looks designed. Many similar sizes look like a template.
- Left-aligned text usually looks more designed than centred text.

## Colour

- One ground, one ink, one accent. Add more only with a reason.
- Write what each colour means in `plan.md`, for example "orange means act on this". Use it only with that meaning.
- Do not make a slide colourful to make it interesting. Move something, or make something bigger.

## Layout

Choose the layout from the point of the slide:

| The slide says | Try |
|---|---|
| One number matters | The number very large, one line beside it |
| One idea | One sentence, large, with lots of empty space |
| A change | Before and after, side by side or as a sweep |
| A trend | One chart that fills the slide, with the point as its title |
| Steps | A line or path that grows, one step per press |
| Time | A path or timeline, with "now" marked |
| Who it is for | Real photos of people, large, not icons |
| A list of 3 | Different weight for each, or one at a time. Cards are the last choice |

Rules:
- Never use the same layout on three slides in a row.
- A slide title states the point: "Vans take 38% of our budget", not "Costs". If the user asked to keep the same content, keep their titles and let the layout carry the point.
- Empty space is part of the design. Do not fill it.
- If two things line up on one slide, make them line up exactly.

## Looks that read as AI-made

Avoid these unless the brand asks for them:

- Rows of equal rounded cards with an icon on top
- Purple or blue gradients, and gradient-filled text
- Frosted glass panels
- Glowing orbs and drifting particles with no meaning
- Emoji as icons
- A small uppercase label above every heading. A section heading from `data-heading` is different: use it only when a framework or chapters need it, in normal case, in one fixed place
- A coloured top border on every card
- A big number with a "+" and a vague word, such as "10x impact"
- Every slide with the same structure

## Pictures

Real pictures beat drawings. Ask for product screenshots and photos of real people and places. Do not use stock pictures of people pointing at screens. If there are no pictures, draw something specific in SVG or use the dot field. Do not use generic icons.

## Words

- One point per slide. Few words on the slide. The speaker says the rest.
- Keep the user's own words where they are good. They sound human, and the user will say them more easily.
- Follow `humanizer.md` before you finish.
