# Vetus to Novus — Design

**Date:** 2026-10-02
**Status:** Approved in brainstorming, awaiting spec review

## 1. Purpose

An interactive website that presents the Order of Mass of the 1962 *Missale Romanum*
as a printed missal lying on a dark desk. As the reader scrolls, an unseen hand edits
it — tearing, pasting over, striking, redacting, annotating — until it has become the
Order of Mass of the 1970 *Missale Romanum*.

- **Intent:** a persuasive traditionalist argument made through presentation alone.
  The site never comments; the reader draws their own conclusions.
- **Constraint:** realistic, no lies. Every edit shown corresponds to a real, sourced
  change. Nothing is exaggerated, and nothing kept, moved or made optional is shown
  as removed.
- **Inspiration:** a video showing a missal being redacted. The site shares the idea,
  not the video's design or assets.

## 2. Scope

- **In:** the Ordinary of the Mass, with its rubrics and the postures/gestures they
  prescribe.
- **Out:** the Propers (Introit, Collect, readings, etc.), the Leonine prayers after
  Low Mass (not part of the 1962 Ordo Missae), sound, persistence across visits.
- **Language:** English only.

## 3. Content, accuracy and sourcing

### 3.1 Editions compared

- **Vetus:** *Missale Romanum*, editio typica 1962, Ordo Missae, presented as a
  **Low Mass** (priest and server).
- **Novus:** *Missale Romanum*, editio typica 1970, Ordo Missae, with the
  *Institutio Generalis Missalis Romani* (GIRM) 1969/1970 for rubrics and postures.
  Not the 2002 edition.

### 3.2 Honesty rules

1. Every edit is verified against the Latin of both editions and their rubrics, not
   against secondary commentary.
2. Changes made in stages (e.g. 1964 *Inter Oecumenici*, 1965, 1967
   *Tres abhinc annos*) record the actual date of each stage on the sources page.
3. Where 1970 offers several options, the real range is shown, not only the most
   minimal option.
4. Anything uncertain is left out or explicitly flagged as uncertain on the sources
   page.

### 3.3 Text and copyright

- **1962 English:** our own translation of the 1962 Latin in the traditional
  hand-missal register ("thee/thou", "and with thy spirit"). Scripture (Psalm 42,
  John 1 for the Last Gospel, etc.) from the Douay-Rheims (Challoner), public domain.
  Modern hand-missal translations are not used.
- **1970 English:** our own plain, literal modern translation of the 1970 Latin.
  ICEL 1973 and 2011 texts are not used.
- **Sources page:** cites by edition and paragraph number and summarises in our own
  words. It does not quote the official English GIRM.
- Since both translations derive from the Latin, differences in the English reflect
  only differences in the Latin.

### 3.4 Research deliverable and gate

Before any animation is built, a **change table** is produced, section by section,
with columns: section · change · type · vetus reference · novus reference ·
date/stage · confidence · notes. The user reviews and approves it. It becomes the
source for `missal.js`.

## 4. Experience

### 4.1 Opening

Straight into the missal. A closed, worn missal lies on a dark desk under warm light.
A small scroll hint fades in; a discreet "Sources" link sits in a corner. No
introductory text. Scrolling opens the cover to the title page
(*Missale Romanum* · *Ordo Missae* · 1962), and the Mass begins.

### 4.2 Reading

One continuous column of pages at a comfortable reading width, desk visible either
side. Each section opens with a blue-and-gold illuminated blackletter initial and a
red small-caps heading.

### 4.3 Passage rhythm

Edits are triggered per passage (all edits on one block, or one torn span), not per section,
so nothing is edited before the reader has reached it.

1. **Intact:** the passage scrolls in untouched.
2. **Edit:** it plays only after it has been in the reading band of the screen (12%–88% of
   its height) long enough to be skimmed: about 0.12 s per word, at least 0.8 s and at most
   3.5 s. The time pauses while the passage is off the band and resumes when it returns.
   Passages play one at a time, in page order, and only while on screen. A short pause
   (≈0.3 s) precedes the first edit; edits then play on their own timing.
3. **Settled:** the edited passage stays as it is.

### 4.4 One-way edits

- Once triggered, edits play to completion and **never reverse**. Scrolling back shows
  the edited pages.
- If the reader scrolls a passage off the top of the screen before it has played or finished, they keep playing, or snap to
  their final state once off-screen. A half-edited page is never seen on return.
- A reload starts again from the intact book. Nothing is persisted.

### 4.5 Escalation and ending

Edits accumulate; by the Offertory and Canon the pages above are visibly patched,
torn and scribbled. The final edit is the Last Gospel torn out. The page then simply
continues as the 1970 Order of Mass to its dismissal (our translation), and stops.
No closing scene or statement. Only the "Sources" link remains.

Optional, low priority: a thin margin progress mark showing the current part of the
Mass.

## 5. Visual design

- **Look:** printed hand-missal page on a dark wood desk lit by a warm lamp from the
  upper left; cream paper with subtle grain and vignette; slight page rotation and
  deep shadow.
- **Type:** EB Garamond body; rubrics in red italic; headings in red small caps; red ✠
  in text; section initials in UnifrakturMaguntia, cream on a blue gradient with gold
  border and red outer rule.
- **Scraps (novus text):** off-white paper, plain sans-serif (IBM Plex Sans or
  similar), slight rotation, tape strip.
- **Margin notes:** blue-grey handwritten ink (Caveat or similar), only short
  editorial marks: "omit", "ad lib.", "→", "1x", "see p.". Never commentary.
- **The hand:** invisible. Edits happen by themselves; no tools, hands or shadows.
- **Assets:** all textures, tear masks and icons are made for this project (SVG,
  procedural noise, or drawn). No scans from existing missals, no assets from the
  inspiration video.

## 6. Edit vocabulary

Each change type maps to exactly one effect.

| Type | Effect | Example |
|---|---|---|
| `removed` | Passage torn out: ragged fibrous edge, piece lifts, curls, falls; desk shows through the hole | Prayers at the foot of the altar, Last Gospel |
| `rewritten` | Typed scrap pasted over; old text visible at the edges | Offertory prayers |
| `shortened` | Red-pencil strikes through the cut parts; the rest stays | Confiteor |
| `optional` | Brass paper clip; fan of tabbed scraps (I · II · III · IV); old text stays, marked "I" | Roman Canon → Eucharistic Prayer I among II–IV |
| `moved` | Dashed scissor cut, piece lifts, slides to new position, taped; pale ghost rectangle left behind | *Mysterium fidei* moved out of the consecration formula |
| `added` | New scrap slides in, pushing the text below it down | Prayer of the Faithful, Greeting |
| `rubric` | Black marker redaction over red rubric text | Signs of the cross in the Canon; canonical digits |
| `repetition` | Strikes through the repeats; one copy left | *Domine, non sum dignus* (exact details per research) |
| `posture` | Margin icon scribbled out (removed); scribbled with new icon drawn beside in blue ink (changed); some repeats scribbled (reduced) | Genuflection at *Et incarnatus est* → profound bow |

**Posture icons:** kneel, genuflect, profound bow, bow of the head, strike the breast,
sign of the cross, stand, priest facing the altar. Small red woodcut-style
pictograms in the margin (inline before the line on phones).

**Pacing:** each edit 0.4–1.5 s with natural easing, staggered within a section so it
reads as one person working through it.

## 7. Architecture

Static site: HTML/CSS/SVG + GSAP ScrollTrigger, built with Vite. Open to changing
(e.g. a small canvas effect for one showpiece moment) if an effect requires it.

```
index.html
sources.html            generated from missal.js
src/
  content/missal.js     sections, 1962 blocks, edits, sources
  render/               data → book HTML; data → sources page
  effects/              one module per edit type
  scroll/               triggers; one-way played state
  styles/               desk, page, typography, initials, scraps
  assets/               SVG icons, generated textures, tear masks
```

### 7.1 Data model

A **section** has an id, title, initial letter, ordered **blocks** (`rubric`,
`versicle`, `response`, `prayer`, `scripture`, `posture`, each with an id and the
1962 text), and ordered **edits**:

```js
{
  type: "shortened",
  target: "confiteor.saints",          // block id or block id + phrase range
  replacement: [ /* blocks */ ],       // for rewritten | added | optional
  destination: "…",                    // for moved
  source: {
    vetus: "Missale Romanum 1962, Ordo Missae, n. …",
    novus: "Missale Romanum 1970, Ordo Missae, n. …; GIRM 1969, n. …",
    stage: "1964 / 1965 / 1967 / 1970",
    note:  "Summary in our own words."
  }
}
```

### 7.2 Flow

`missal.js` → renderer builds the intact 1962 book → scroll module registers one
trigger per section → on trigger, the section's edits run in order through their
effect modules → the section is marked played and never reversed.

### 7.3 Invariants (build fails if violated)

- Every edit has a known `type`, a `target` that exists, and a `source` with
  `vetus`, `novus` and `stage`.
- Every edit appears on the sources page; every sources-page entry corresponds to an
  edit.

## 8. Phones, performance, accessibility

- **Phones:** full width with 16 px desk gutter; icons inline; effects simplified
  (fewer fibres, lighter shadows); trigger point and timings tuned for touch.
- **Performance:** animate only `transform`, `opacity`, `clip-path` and SVG strokes;
  `added` reflow batched once per edit; off-screen sections idle; small generated
  textures; fonts preloaded. Target 60 fps on a recent phone, load under 2 s on an
  average connection.
- **Reduced motion:** sections show their final edited state with a short fade.
- **Screen readers:** each section reads the 1962 text, then a plain change note
  ("Removed in 1970", "Replaced by: …") generated from the same data.
- **Contrast:** verified for rubric red, initials and scraps.

## 9. Testing

- **Data validation:** invariants in 7.3, run at build and in tests.
- **Unit tests:** renderer (data → expected HTML); scroll state (played edits stay
  played; reload resets).
- **Visual checks:** run in the browser at desktop and phone widths; screenshot each
  section intact and edited for user review.
- **Fact review:** user approves the change table (3.4) before animation work.

## 10. Hosting

Static output, deployable to GitHub Pages, Netlify or Cloudflare Pages. Chosen at
release.
