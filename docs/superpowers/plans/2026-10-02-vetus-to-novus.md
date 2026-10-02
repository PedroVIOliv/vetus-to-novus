# Vetus to Novus Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A static, scroll-driven website showing the 1962 Order of Mass as a printed missal on a dark desk, edited one-way by an invisible hand into the 1970 Order of Mass, with every edit sourced.

**Architecture:** All content (1962 text blocks, typed edits, sources) lives in `src/content/missal.js`. A renderer builds the intact book and the sources page from it; a validator fails the build on any unsourced or malformed edit. A scroll controller triggers each section once (GSAP ScrollTrigger) and plays its edits through one effect module per edit type; played edits never reverse.

**Tech Stack:** Vite 5, vanilla ES modules, GSAP 3 (+ ScrollTrigger), Vitest + jsdom, Google Fonts (EB Garamond, UnifrakturMaguntia, IBM Plex Sans, Caveat).

**Spec:** `docs/superpowers/specs/2026-10-02-vetus-to-novus-design.md`

## Global Constraints

- Ordinary of the Mass with rubrics and postures only; Propers and Leonine prayers out of scope.
- English only. 1962 English is our own translation of the Latin in "thee/thou" register; scripture from Douay-Rheims (Challoner). 1970 English is our own literal modern translation of the 1970 Latin. No ICEL 1973/2011 text, no modern hand-missal translations, no quotation of the official English GIRM.
- Vetus = Missale Romanum 1962, Low Mass. Novus = Missale Romanum 1970 + GIRM 1969/1970.
- Every edit has `source.vetus`, `source.novus`, `source.stage`; the build fails otherwise.
- No commentary text anywhere on the main page. Margin marks are editorial only ("omit", "ad lib.", "→", "1x", "see p.").
- Edits are one-way: once a section is triggered it is never reversed; reload resets.
- Invisible hand: no tools, hands or shadows of hands.
- All assets made for this project; nothing from existing missals or the inspiration video.
- Animate only `transform`, `opacity`, `clip-path`, SVG strokes (except `added` height, batched).
- Phone layout: 16 px desk gutter, icons inline.
- `prefers-reduced-motion: reduce` → final states with a short fade.
- No AI attribution in commits.

## Review Focus

1. A section scrolled past before its edits finish — on return it must show the final edited state, never a half state (Task 5 test: `leave()` while playing completes the timeline).
2. Fast flick from top to bottom — every passed section must end edited, none skipped (Task 5 test: `trigger()` on many controllers in sequence then `leave()` all → all `played`).
3. A `phrase` that does not occur in its target block's text — validator must reject it rather than silently render nothing (Task 1 test).
4. Window resize after edits played (rotate phone) — overlay strikes/bars must stay over their text (Task 6: overlays positioned in `em`-relative wrappers inside the phrase span, not absolute page pixels; test checks overlay is a child of the phrase span).
5. Reduced motion — no timelines run, final state applied (Task 13 test).

---

## File Structure

```
package.json, vite.config.js, index.html, sources.html
scripts/validate.js               CLI: run validateMissal on missal.js, exit 1 on errors
src/content/schema.js             EDIT_TYPES, BLOCK_KINDS, POSTURES, validateMissal()
src/content/missal.js             the content (sections, blocks, edits)
src/render/book.js                renderBook(missal, doc) → HTMLElement
src/render/srnote.js              srNote(edit) → string (screen-reader change note)
src/render/sources.js             buildSources(missal) → entries; renderSources(entries, doc)
src/effects/index.js              getEffect(type) → { play, finish }
src/effects/util.js               lineRects(), seededRandom(), raggedPolygon()
src/effects/strike.js             shortened, repetition
src/effects/redact.js             rubric
src/effects/paste.js              rewritten
src/effects/add.js                added
src/effects/tear.js               removed
src/effects/optional.js           optional
src/effects/move.js               moved
src/effects/posture.js            posture
src/effects/mark.js               margin marks (edit.mark)
src/scroll/controller.js          createSectionController(), pure play-state logic
src/scroll/engine.js              wires controllers to ScrollTrigger + opening animation
src/icons/postures.js             inline SVG strings per posture
src/styles/*.css                  desk, page, type, initials, scraps, effects, mobile
src/main.js, src/sources-main.js  entry points
docs/research/change-table.md     the fact base (user-approved)
tests/*.test.js
```

## Shared data shapes (used by every task)

```js
// Section
{ id: "foot-of-altar", title: "Prayers at the Foot of the Altar", initial: "I",
  blocks: [Block], edits: [Edit] }

// Block — kind ∈ BLOCK_KINDS
{ id: "foot.sign", kind: "prayer", speaker: "P", text: "In the name of the Father, ✠ and …",
  postures: ["sign-cross"] }        // speaker and postures optional

// Edit — type ∈ EDIT_TYPES
{ id: "e-foot-psalm", type: "removed", target: "foot.psalm",
  targets: ["foot.psalm", "foot.gloria"],  // removed only: optional extra blocks torn with target
  phrase: "…",                     // shortened | repetition | rubric: exact substring of target text
  replacement: [Block],            // rewritten | added | optional (optional: first is label row)
  options: ["I","II","III","IV"],  // optional only
  destination: "block-id",         // moved: insert after this block
  icon: "genuflect", action: "remove" | "change", to: "bow-profound",   // posture
  mark: "omit",                    // optional margin mark
  source: { vetus: "…", novus: "…", stage: "1970", note: "…" } }
```

DOM contract from the renderer: section → `<section class="sec" data-section="ID">`; block → `<p class="blk blk--KIND" data-block="ID">`; phrase → `<span class="ph" data-edit="EDIT_ID">`; posture icon → `<span class="posture" data-icon="NAME" data-block="ID">` inside a `.margin` element at the start of the block.

---

### Task 1: Scaffold + schema validator

**Files:**
- Create: `package.json`, `vite.config.js`, `src/content/schema.js`, `scripts/validate.js`, `tests/schema.test.js`, `src/content/missal.js` (stub)

**Interfaces:**
- Produces: `EDIT_TYPES: string[]`, `BLOCK_KINDS: string[]`, `POSTURES: string[]`, `validateMissal(missal) → string[]` (empty = valid).

- [ ] **Step 1: Scaffold**

```bash
npm init -y
npm i gsap
npm i -D vite vitest jsdom
```

`package.json` scripts:
```json
"scripts": {
  "dev": "vite",
  "validate": "node scripts/validate.js",
  "build": "node scripts/validate.js && vite build",
  "test": "vitest run"
},
"type": "module"
```

`vite.config.js`:
```js
import { defineConfig } from "vite";
export default defineConfig({
  build: { rollupOptions: { input: { main: "index.html", sources: "sources.html" } } },
  test: { environment: "jsdom" },
});
```

- [ ] **Step 2: Write failing tests** — `tests/schema.test.js`

```js
import { describe, it, expect } from "vitest";
import { validateMissal } from "../src/content/schema.js";

const src = { vetus: "MR1962 OM 1", novus: "MR1970 OM 1", stage: "1970" };
const base = () => ({
  sections: [{
    id: "s", title: "S", initial: "I",
    blocks: [{ id: "b1", kind: "prayer", text: "In the name of the Father" },
             { id: "b2", kind: "rubric", text: "The priest bows." }],
    edits: [{ id: "e1", type: "shortened", target: "b1", phrase: "the Father", source: src }],
  }],
});

describe("validateMissal", () => {
  it("accepts valid data", () => expect(validateMissal(base())).toEqual([]));
  it("rejects missing source fields", () => {
    const m = base(); delete m.sections[0].edits[0].source.stage;
    expect(validateMissal(m).join()).toMatch(/e1.*source\.stage/);
  });
  it("rejects unknown type", () => {
    const m = base(); m.sections[0].edits[0].type = "deleted";
    expect(validateMissal(m).join()).toMatch(/e1.*type/);
  });
  it("rejects unknown target", () => {
    const m = base(); m.sections[0].edits[0].target = "nope";
    expect(validateMissal(m).join()).toMatch(/e1.*target/);
  });
  it("rejects phrase not found in target text", () => {
    const m = base(); m.sections[0].edits[0].phrase = "the Son";
    expect(validateMissal(m).join()).toMatch(/e1.*phrase/);
  });
  it("requires phrase for shortened/repetition/rubric", () => {
    const m = base(); delete m.sections[0].edits[0].phrase;
    expect(validateMissal(m).join()).toMatch(/e1.*phrase/);
  });
  it("requires replacement for rewritten/added/optional", () => {
    const m = base(); m.sections[0].edits[0] = { id: "e1", type: "rewritten", target: "b1", source: src };
    expect(validateMissal(m).join()).toMatch(/e1.*replacement/);
  });
  it("requires known destination for moved", () => {
    const m = base(); m.sections[0].edits[0] = { id: "e1", type: "moved", target: "b1", destination: "zz", source: src };
    expect(validateMissal(m).join()).toMatch(/e1.*destination/);
  });
  it("validates posture edits", () => {
    const m = base();
    m.sections[0].blocks[0].postures = ["genuflect"];
    m.sections[0].edits[0] = { id: "e1", type: "posture", target: "b1", icon: "genuflect", action: "change", to: "bow-profound", source: src };
    expect(validateMissal(m)).toEqual([]);
    m.sections[0].edits[0].icon = "kneel";
    expect(validateMissal(m).join()).toMatch(/e1.*icon/);
  });
  it("rejects duplicate ids and unknown block kinds", () => {
    const m = base(); m.sections[0].blocks[1].id = "b1"; m.sections[0].blocks[1].kind = "song";
    const errs = validateMissal(m).join();
    expect(errs).toMatch(/duplicate.*b1/); expect(errs).toMatch(/kind/);
  });
});
```

- [ ] **Step 3: Run — expect FAIL** (`npm test` → module not found)

- [ ] **Step 4: Implement** — `src/content/schema.js`

```js
export const EDIT_TYPES = ["removed", "rewritten", "shortened", "optional", "moved", "added", "rubric", "repetition", "posture"];
export const BLOCK_KINDS = ["rubric", "versicle", "response", "prayer", "scripture", "heading"];
export const POSTURES = ["kneel", "genuflect", "bow-profound", "bow-head", "strike-breast", "sign-cross", "stand", "face-altar"];
const NEEDS_PHRASE = ["shortened", "repetition", "rubric"];
const NEEDS_REPLACEMENT = ["rewritten", "added", "optional"];

export function validateMissal(missal) {
  const errs = [];
  const ids = new Set();
  const blocks = new Map();
  const seen = (id, what) => {
    if (ids.has(id)) errs.push(`duplicate id ${id} (${what})`);
    ids.add(id);
  };
  const checkBlock = (b, where) => {
    seen(b.id, where);
    if (!BLOCK_KINDS.includes(b.kind)) errs.push(`${b.id}: unknown kind ${b.kind}`);
    if (typeof b.text !== "string" || !b.text) errs.push(`${b.id}: missing text`);
    for (const p of b.postures ?? []) if (!POSTURES.includes(p)) errs.push(`${b.id}: unknown posture ${p}`);
  };
  for (const s of missal.sections) {
    seen(s.id, "section");
    for (const b of s.blocks) { checkBlock(b, "block"); blocks.set(b.id, b); }
  }
  for (const s of missal.sections) {
    for (const e of s.edits) {
      seen(e.id, "edit");
      const E = (msg) => errs.push(`${e.id}: ${msg}`);
      if (!EDIT_TYPES.includes(e.type)) E(`unknown type ${e.type}`);
      const t = blocks.get(e.target);
      if (!t) E(`unknown target ${e.target}`);
      for (const x of e.targets ?? []) if (!blocks.has(x)) E(`unknown target ${x}`);
      for (const k of ["vetus", "novus", "stage"]) if (!e.source?.[k]) E(`missing source.${k}`);
      if (NEEDS_PHRASE.includes(e.type)) {
        if (!e.phrase) E("missing phrase");
        else if (t && !t.text.includes(e.phrase)) E(`phrase not found in ${e.target}`);
      }
      if (NEEDS_REPLACEMENT.includes(e.type)) {
        if (!Array.isArray(e.replacement) || !e.replacement.length) E("missing replacement");
        else e.replacement.forEach((b) => checkBlock(b, "replacement"));
      }
      if (e.type === "optional" && !e.options?.length) E("missing options");
      if (e.type === "moved" && !blocks.has(e.destination)) E(`unknown destination ${e.destination}`);
      if (e.type === "posture") {
        if (!t?.postures?.includes(e.icon)) E(`icon ${e.icon} not on ${e.target}`);
        if (!["remove", "change"].includes(e.action)) E(`bad action ${e.action}`);
        if (e.action === "change" && !POSTURES.includes(e.to)) E(`bad to ${e.to}`);
      }
    }
  }
  return errs;
}
```

Stub `src/content/missal.js`: `export const missal = { sections: [] };`

`scripts/validate.js`:
```js
import { missal } from "../src/content/missal.js";
import { validateMissal } from "../src/content/schema.js";
const errs = validateMissal(missal);
if (errs.length) { console.error(errs.join("\n")); process.exit(1); }
console.log(`missal OK: ${missal.sections.length} sections, ${missal.sections.reduce((n, s) => n + s.edits.length, 0)} edits`);
```

- [ ] **Step 5: Run — expect PASS** (`npm test`, `npm run validate`)
- [ ] **Step 6: Commit** — `git add -A && git commit -m "Scaffold project and missal schema validator"`

---

### Task 2: Research — change table (USER GATE)

**Files:**
- Create: `docs/research/change-table.md`

**Interfaces:**
- Produces: the approved fact base Task 4 encodes.

- [ ] **Step 1: Gather primary texts.** Latin Ordo Missae 1962 and 1970 and GIRM 1969 from primary-source transcriptions (e.g. the Vatican editions as reproduced on reputable liturgical sites; cross-check two sources per claim). Note interim documents: *Inter Oecumenici* (1964), the 1965 Ordo, *Tres abhinc annos* (1967).
- [ ] **Step 2: Write the table**, one H2 per section of the Mass in 1962 order (Foot of the Altar, Introit/Kyrie, Gloria, Collect, Epistle–Gospel, Creed, Offertory, Lavabo, Orate Fratres/Secret, Preface/Sanctus, Canon, Pater Noster–Fraction, Agnus Dei/Pax, Communion, Ablutions–Postcommunion, Dismissal/Blessing, Last Gospel) plus new 1970 elements. Columns:

`| # | Change | Type | Vetus ref | Novus ref | Stage | Confidence | Notes |`

Type ∈ the nine EDIT_TYPES. Confidence ∈ high / medium / low. Low-confidence rows are excluded from the site unless resolved.
- [ ] **Step 3: Self-check honesty rules** (spec 3.2): nothing kept/moved/optional typed as `removed`; options shown as their real range; stages dated.
- [ ] **Step 4: Commit** — `git commit -m "Add researched 1962→1970 change table"`
- [ ] **Step 5: STOP for user review.** Tasks 3, 5–13 may proceed with fixture data while waiting; Task 4 may not start until approval.

---

### Task 3: Renderer + base styles

**Files:**
- Create: `src/render/book.js`, `src/render/srnote.js`, `src/styles/base.css`, `index.html`, `src/main.js`, `tests/render.test.js`, `tests/fixture.js`

**Interfaces:**
- Consumes: data shapes; `POSTURES`.
- Produces: `renderBook(missal, doc) → HTMLElement` (`<div class="book">` with title page + sections), `renderBlock(block, doc, edits) → HTMLElement`, `srNote(edit) → string`.

- [ ] **Step 1: Fixture** — `tests/fixture.js`

```js
const src = { vetus: "MR1962", novus: "MR1970", stage: "1970" };
export const fixture = { sections: [{
  id: "foot", title: "Prayers at the Foot of the Altar", initial: "I",
  blocks: [
    { id: "foot.rub", kind: "rubric", text: "The Priest makes the sign of the Cross, saying:" },
    { id: "foot.sign", kind: "prayer", speaker: "P", text: "In the name of the Father, ✠ and of the Son, and of the Holy Ghost. Amen.", postures: ["sign-cross"] },
    { id: "foot.ant", kind: "versicle", speaker: "P", text: "I will go in unto the altar of God." },
  ],
  edits: [
    { id: "e1", type: "rubric", target: "foot.rub", phrase: "makes the sign of the Cross", source: src },
    { id: "e2", type: "removed", target: "foot.ant", mark: "omit", source: src },
  ],
}]};
```

- [ ] **Step 2: Failing tests** — `tests/render.test.js`

```js
import { describe, it, expect } from "vitest";
import { renderBook } from "../src/render/book.js";
import { srNote } from "../src/render/srnote.js";
import { fixture } from "./fixture.js";

describe("renderBook", () => {
  const book = renderBook(fixture, document);
  it("renders sections and blocks with data attributes", () => {
    const sec = book.querySelector('section.sec[data-section="foot"]');
    expect(sec.querySelector("h2").textContent).toBe("Prayers at the Foot of the Altar");
    expect(sec.querySelectorAll(".blk")).toHaveLength(3);
    expect(sec.querySelector('[data-block="foot.rub"]').classList).toContain("blk--rubric");
  });
  it("wraps edit phrases in spans, keeping the text intact", () => {
    const blk = book.querySelector('[data-block="foot.rub"]');
    expect(blk.querySelector('.ph[data-edit="e1"]').textContent).toBe("makes the sign of the Cross");
    expect(blk.querySelector(".txt").textContent).toBe("The Priest makes the sign of the Cross, saying:");
  });
  it("renders the illuminated initial on the first prayer-like block", () => {
    expect(book.querySelector(".initial").textContent).toBe("I");
  });
  it("renders speaker and posture icons", () => {
    const blk = book.querySelector('[data-block="foot.sign"]');
    expect(blk.querySelector(".spk").textContent).toBe("P.");
    expect(blk.querySelector('.margin .posture[data-icon="sign-cross"]')).not.toBeNull();
  });
  it("adds screen-reader change notes per section", () => {
    const notes = book.querySelector('[data-section="foot"] .sr-only').textContent;
    expect(notes).toContain("Removed in 1970");
  });
  it("escapes text", () => {
    const b = renderBook({ sections: [{ id: "x", title: "<b>", initial: "A", blocks: [{ id: "x1", kind: "prayer", text: "<img>" }], edits: [] }] }, document);
    expect(b.querySelector("img")).toBeNull();
  });
});

describe("srNote", () => {
  it("describes each type", () => {
    expect(srNote({ type: "removed" })).toBe("Removed in 1970.");
    expect(srNote({ type: "rewritten", replacement: [{ text: "New." }] })).toBe("Replaced in 1970 by: New.");
    expect(srNote({ type: "posture", action: "change", icon: "genuflect", to: "bow-profound" })).toBe("Posture changed in 1970: genuflect → profound bow.");
  });
});
```

- [ ] **Step 3: Run — expect FAIL**

- [ ] **Step 4: Implement** — `src/render/srnote.js`

```js
export const POSTURE_LABEL = {
  kneel: "kneel", genuflect: "genuflect", "bow-profound": "profound bow", "bow-head": "bow of the head",
  "strike-breast": "strike the breast", "sign-cross": "sign of the cross", stand: "stand", "face-altar": "facing the altar",
};
const join = (blocks) => blocks.map((b) => b.text).join(" ");
export function srNote(e) {
  switch (e.type) {
    case "removed": return "Removed in 1970.";
    case "rewritten": return `Replaced in 1970 by: ${join(e.replacement)}`;
    case "shortened": return `Shortened in 1970: “${e.phrase}” omitted.`;
    case "repetition": return `Repetition reduced in 1970: “${e.phrase}” omitted.`;
    case "rubric": return `Rubric dropped in 1970: “${e.phrase}”.`;
    case "optional": return `Made one option among ${e.options.length} in 1970.`;
    case "moved": return "Moved in 1970.";
    case "added": return `Added in 1970: ${join(e.replacement)}`;
    case "posture":
      return e.action === "change"
        ? `Posture changed in 1970: ${POSTURE_LABEL[e.icon]} → ${POSTURE_LABEL[e.to]}.`
        : `Posture removed in 1970: ${POSTURE_LABEL[e.icon]}.`;
  }
}
```

`src/render/book.js`:
```js
import { srNote } from "./srnote.js";
import { postureSvg } from "../icons/postures.js";

const el = (doc, tag, cls, text) => {
  const n = doc.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

function textWithPhrases(doc, text, phraseEdits) {
  const txt = el(doc, "span", "txt");
  let rest = text;
  const sorted = phraseEdits
    .map((e) => ({ e, i: text.indexOf(e.phrase) }))
    .sort((a, b) => a.i - b.i);
  let cursor = 0;
  for (const { e, i } of sorted) {
    if (i < cursor) continue; // overlapping phrases: first wins
    txt.append(doc.createTextNode(text.slice(cursor, i)));
    const ph = el(doc, "span", "ph", e.phrase);
    ph.dataset.edit = e.id;
    txt.append(ph);
    cursor = i + e.phrase.length;
  }
  txt.append(doc.createTextNode(text.slice(cursor)));
  return txt;
}

export function renderBlock(block, doc, edits = [], { initial } = {}) {
  const p = el(doc, "p", `blk blk--${block.kind}`);
  p.dataset.block = block.id;
  const margin = el(doc, "span", "margin");
  for (const icon of block.postures ?? []) {
    const s = el(doc, "span", "posture");
    s.dataset.icon = icon;
    s.dataset.block = block.id;
    s.innerHTML = postureSvg(icon);
    margin.append(s);
  }
  p.append(margin);
  if (initial) p.append(el(doc, "span", "initial", initial));
  if (block.speaker) p.append(el(doc, "span", "spk", `${block.speaker}.`), doc.createTextNode(" "));
  const phraseEdits = edits.filter((e) => e.phrase && e.target === block.id);
  let text = block.text;
  if (initial) text = text.slice(initial.length);
  p.append(textWithPhrases(doc, initial ? text : block.text,
    initial ? phraseEdits.filter((e) => text.includes(e.phrase)) : phraseEdits));
  return p;
}

export function renderBook(missal, doc) {
  const book = el(doc, "div", "book");
  const title = el(doc, "header", "title-page");
  title.append(el(doc, "p", "tp-kicker", "Missale Romanum"), el(doc, "h1", "tp-title", "Ordo Missae"), el(doc, "p", "tp-year", "MCMLXII"));
  book.append(title);
  for (const s of missal.sections) {
    const sec = el(doc, "section", "sec");
    sec.dataset.section = s.id;
    sec.append(el(doc, "h2", "sec-title", s.title));
    let initialUsed = false;
    for (const b of s.blocks) {
      const takesInitial = !initialUsed && b.kind !== "rubric" && b.text.startsWith(s.initial);
      if (takesInitial) initialUsed = true;
      sec.append(renderBlock(b, doc, s.edits, { initial: takesInitial ? s.initial : null }));
    }
    const sr = el(doc, "div", "sr-only");
    for (const e of s.edits) sr.append(el(doc, "p", null, srNote(e)));
    sec.append(sr);
    book.append(sec);
  }
  return book;
}
```

Note: the initial's letter is removed from the start of the text so "In the name…" renders as initial "I" + "n the name…"; phrase edits only match within the remaining text. The test fixture's `foot.sign` takes the initial (rubric block is skipped).

`src/icons/postures.js` is created in Task 10; for this task create it with a placeholder-free minimal version that Task 10 replaces:
```js
export const postureSvg = (name) => `<svg class="ico" viewBox="0 0 24 24" aria-label="${name}"><circle cx="12" cy="12" r="3"/></svg>`;
```

`index.html`:
```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Ordo Missae</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=UnifrakturMaguntia&family=IBM+Plex+Sans:wght@400;500&family=Caveat&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/src/styles/base.css" />
</head>
<body>
  <a class="sources-link" href="sources.html">Sources</a>
  <main id="desk" class="desk"></main>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

`src/main.js`:
```js
import { missal } from "./content/missal.js";
import { renderBook } from "./render/book.js";
document.getElementById("desk").append(renderBook(missal, document));
```

`src/styles/base.css`:
```css
:root {
  --desk-0: #3a2a1c; --desk-1: #1a120b; --desk-2: #0c0805;
  --paper-0: #fbf3df; --paper-1: #efe2c4; --paper-2: #d8c49c;
  --ink: #1d1a16; --rubric: #b3261e; --note: #2b4a8a;
  --initial-a: #1f3f8a; --initial-b: #3a5fbf; --gold: #c9a23a;
  --measure: 38rem;
}
* { box-sizing: border-box; }
html, body { margin: 0; }
body {
  background: var(--desk-2);
  background-image: radial-gradient(ellipse at 50% 30%, var(--desk-0) 0%, var(--desk-1) 55%, var(--desk-2) 100%);
  background-attachment: fixed;
  color: var(--ink);
  font: 400 1.125rem/1.55 "EB Garamond", Georgia, serif;
}
.desk { padding: 12vh 1rem 30vh; overflow-x: clip; }
.book {
  max-width: var(--measure); margin: 0 auto; padding: 3rem 3rem 4rem 4rem;
  background: radial-gradient(ellipse at 40% 20%, var(--paper-0) 0%, var(--paper-1) 65%, var(--paper-2) 100%);
  box-shadow: 0 20px 60px rgba(0,0,0,.65), 0 0 120px rgba(255,190,110,.10);
  transform: rotate(-.4deg);
  position: relative;
}
.title-page { text-align: center; padding: 4rem 0 5rem; }
.tp-kicker { color: var(--rubric); letter-spacing: .3em; text-transform: uppercase; font-size: .9rem; margin: 0; }
.tp-title { font-weight: 600; font-variant: small-caps; letter-spacing: .1em; font-size: 2.6rem; margin: .4rem 0; }
.tp-year { color: var(--rubric); letter-spacing: .25em; margin: 0; }
.sec { position: relative; padding: 1.5rem 0 2rem; }
.sec-title { color: var(--rubric); font-variant: small-caps; letter-spacing: .12em; font-weight: 600; font-size: 1.35rem; margin: 0 0 .8rem; text-align: center; }
.blk { position: relative; margin: 0 0 .6rem; }
.blk--rubric { color: var(--rubric); font-style: italic; font-size: .95rem; }
.blk--scripture { font-style: italic; }
.spk { color: var(--rubric); font-weight: 600; }
.ph { position: relative; }
.initial {
  float: left; font-family: "UnifrakturMaguntia", serif; font-size: 3.6rem; line-height: .85;
  color: #fff8e6; background: linear-gradient(135deg, var(--initial-a), var(--initial-b));
  border: 2px solid var(--gold); box-shadow: 0 0 0 3px var(--rubric);
  padding: .45rem .6rem .3rem; margin: .2rem .7rem 0 0;
}
.margin { position: absolute; left: -2.6rem; top: .15rem; display: flex; flex-direction: column; gap: .2rem; }
.posture { display: block; width: 1.4rem; height: 1.4rem; color: var(--rubric); position: relative; }
.posture .ico { width: 100%; height: 100%; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.sources-link { position: fixed; right: 1rem; bottom: 1rem; z-index: 50; color: #c9b48a; font: 500 .75rem "IBM Plex Sans", sans-serif; letter-spacing: .08em; text-transform: uppercase; text-decoration: none; opacity: .6; }
.sources-link:hover { opacity: 1; }
```

- [ ] **Step 5: Run — expect PASS**; run `npm run dev` with `missal.js` temporarily importing the fixture and eyeball the page.
- [ ] **Step 6: Commit** — `git commit -m "Render missal book from data with base styles"`

---

### Task 4: Encode content from approved change table

**Files:**
- Modify: `src/content/missal.js`

**Interfaces:**
- Consumes: approved `docs/research/change-table.md`; schema from Task 1.
- Produces: `export const missal = { sections: [...] }` passing `validateMissal`.

- [ ] **Step 1:** For each section in the change table, translate the 1962 Latin of every line into the traditional register (our wording), as blocks in order with ids `<section>.<n>`; attach `postures` from the 1962 rubrics.
- [ ] **Step 2:** For each table row, add one edit with the row's type, target, `source` copied from the row's refs/stage, `note` summarising in our own words, and `replacement` translated literally from the 1970 Latin (modern register) where required. Add `mark` only from the allowed list.
- [ ] **Step 3:** After the last 1962 section, add a final section `novus-close` whose blocks are the 1970 dismissal in our translation (no edits), so the page ends there.
- [ ] **Step 4:** `npm run validate` → expect `missal OK`. `npm test` → PASS.
- [ ] **Step 5:** Commit — `git commit -m "Encode Ordinary of the Mass and researched edits"`

---

### Task 5: One-way section controller

**Files:**
- Create: `src/scroll/controller.js`, `tests/controller.test.js`

**Interfaces:**
- Produces: `createSectionController({ edits, buildTimeline, finishAll }) → { trigger(), leave(), state }` where `state ∈ "idle" | "playing" | "played"`; `buildTimeline(edits) → { progress(n), eventCallback("onComplete", fn), play() }` (a GSAP timeline); `finishAll(edits)` applies final states instantly.

- [ ] **Step 1: Failing tests**

```js
import { describe, it, expect, vi } from "vitest";
import { createSectionController } from "../src/scroll/controller.js";

function fakeTl() {
  const tl = { done: null, p: 0, play: vi.fn(), progress(n) { this.p = n; if (n === 1) this.done?.(); }, eventCallback(_, fn) { this.done = fn; return this; } };
  return tl;
}

describe("section controller", () => {
  it("plays once on trigger and becomes played on completion", () => {
    const tl = fakeTl(); const build = vi.fn(() => tl);
    const c = createSectionController({ edits: [1], buildTimeline: build, finishAll: vi.fn() });
    c.trigger(); expect(c.state).toBe("playing"); expect(tl.play).toHaveBeenCalled();
    tl.progress(1); expect(c.state).toBe("played");
    c.trigger(); expect(build).toHaveBeenCalledTimes(1);
  });
  it("leaving while playing completes instantly", () => {
    const tl = fakeTl();
    const c = createSectionController({ edits: [1], buildTimeline: () => tl, finishAll: vi.fn() });
    c.trigger(); c.leave();
    expect(tl.p).toBe(1); expect(c.state).toBe("played");
  });
  it("leaving before trigger (fast flick past) finishes without animating", () => {
    const finishAll = vi.fn(); const build = vi.fn();
    const c = createSectionController({ edits: [1], buildTimeline: build, finishAll });
    c.leave();
    expect(finishAll).toHaveBeenCalledWith([1]); expect(build).not.toHaveBeenCalled(); expect(c.state).toBe("played");
  });
  it("fast flick through many sections leaves all played", () => {
    const cs = Array.from({ length: 5 }, () => createSectionController({ edits: [1], buildTimeline: fakeTl, finishAll: vi.fn() }));
    cs.forEach((c) => c.trigger()); cs.forEach((c) => c.leave());
    expect(cs.every((c) => c.state === "played")).toBe(true);
  });
  it("never reverses: leave and trigger after played are no-ops", () => {
    const finishAll = vi.fn(); const tl = fakeTl();
    const c = createSectionController({ edits: [1], buildTimeline: () => tl, finishAll });
    c.trigger(); tl.progress(1); c.leave(); c.trigger();
    expect(finishAll).not.toHaveBeenCalled(); expect(c.state).toBe("played");
  });
});
```

- [ ] **Step 2: Run — expect FAIL**
- [ ] **Step 3: Implement**

```js
export function createSectionController({ edits, buildTimeline, finishAll }) {
  let tl = null;
  const c = {
    state: "idle",
    trigger() {
      if (c.state !== "idle") return;
      c.state = "playing";
      tl = buildTimeline(edits);
      tl.eventCallback("onComplete", () => { c.state = "played"; });
      tl.play();
    },
    leave() {
      if (c.state === "playing") tl.progress(1);
      else if (c.state === "idle") { finishAll(edits); c.state = "played"; }
    },
  };
  return c;
}
```

"Leave" means the section has scrolled fully above the viewport (reader went past it). Leaving downward-to-upward (reader scrolls up before reaching it) is not a leave — Task 11 only calls `leave()` from ScrollTrigger's `onLeave` (scrolling down past the end).

- [ ] **Step 4: Run — expect PASS**
- [ ] **Step 5: Commit** — `git commit -m "Add one-way section play controller"`

---

### Task 6: Effect infrastructure + strike + redact

**Files:**
- Create: `src/effects/index.js`, `src/effects/util.js`, `src/effects/strike.js`, `src/effects/redact.js`, `src/styles/effects.css`, `tests/effects.test.js`

**Interfaces:**
- Produces: effect module shape `{ play(edit, ctx) → gsap.core.Timeline, finish(edit, ctx) → void }`; `ctx = { section: HTMLElement, root: HTMLElement, gsap }`; `getEffect(type)`; `seededRandom(seed: string) → () => number`; `raggedPolygon(rand, { w, h, edges, amp, step }) → string` (CSS `polygon(...)` in %).

- [ ] **Step 1: Failing tests**

```js
import { describe, it, expect } from "vitest";
import { gsap } from "gsap";
import { getEffect } from "../src/effects/index.js";
import { seededRandom, raggedPolygon } from "../src/effects/util.js";
import { renderBook } from "../src/render/book.js";
import { fixture } from "./fixture.js";
import { EDIT_TYPES } from "../src/content/schema.js";

const setup = () => {
  document.body.innerHTML = "";
  const book = renderBook(fixture, document); document.body.append(book);
  return { section: book.querySelector(".sec"), root: book, gsap };
};

describe("util", () => {
  it("seededRandom is deterministic", () => {
    const a = seededRandom("x"), b = seededRandom("x");
    expect([a(), a()]).toEqual([b(), b()]);
  });
  it("raggedPolygon produces a polygon", () => {
    expect(raggedPolygon(seededRandom("y"), { edges: ["top", "bottom"] })).toMatch(/^polygon\(/);
  });
});

describe("registry", () => {
  it("has an effect for every edit type", () => {
    for (const t of EDIT_TYPES) expect(typeof getEffect(t).play).toBe("function");
  });
});

describe("rubric redaction", () => {
  it("finish adds a bar inside the phrase span (survives resize)", () => {
    const ctx = setup(); const e = fixture.sections[0].edits[0];
    getEffect("rubric").finish(e, ctx);
    const ph = ctx.section.querySelector('.ph[data-edit="e1"]');
    expect(ph.querySelector(".fx-redact")).not.toBeNull();
    expect(ph.classList).toContain("is-edited");
  });
});
```

- [ ] **Step 2: Run — expect FAIL**
- [ ] **Step 3: Implement**

`src/effects/util.js`:
```js
export function seededRandom(seed) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

// Ragged edge polygon in % units over a box; `edges` lists which sides are torn.
export function raggedPolygon(rand, { edges = ["top", "right", "bottom", "left"], amp = 3, step = 4 } = {}) {
  const pts = [];
  const j = (on) => (on ? (rand() - 0.5) * 2 * amp : 0);
  const has = (e) => edges.includes(e);
  for (let x = 0; x <= 100; x += step) pts.push([x, Math.max(0, j(has("top")) + (has("top") ? amp : 0))]);
  for (let y = step; y <= 100; y += step) pts.push([100 - Math.max(0, j(has("right")) + (has("right") ? amp : 0)), y]);
  for (let x = 100 - step; x >= 0; x -= step) pts.push([x, 100 - Math.max(0, j(has("bottom")) + (has("bottom") ? amp : 0))]);
  for (let y = 100 - step; y > 0; y -= step) pts.push([Math.max(0, j(has("left")) + (has("left") ? amp : 0)), y]);
  return `polygon(${pts.map(([x, y]) => `${x.toFixed(2)}% ${y.toFixed(2)}%`).join(", ")})`;
}

export const phraseOf = (edit, ctx) => ctx.section.querySelector(`.ph[data-edit="${edit.id}"]`);
export const blockOf = (id, ctx) => ctx.root.querySelector(`[data-block="${CSS.escape(id)}"]`);
```

(jsdom lacks `CSS.escape`; guard: `const esc = globalThis.CSS?.escape ?? ((s) => s.replace(/"/g, '\\"'));` and use `esc(id)`.)

`src/effects/strike.js` (shortened, repetition) — strokes are SVG lines inside the phrase span sized with `width:100%`, so they follow line wraps via `box-decoration-break` fallback: one `.fx-strike` per span using a repeating linear-gradient underline at mid-height, animated by `background-size`:
```js
import { phraseOf, seededRandom } from "./util.js";
function mount(edit, ctx) {
  const ph = phraseOf(edit, ctx);
  let s = ph.querySelector(".fx-strike");
  if (!s) {
    s = document.createElement("span");
    s.className = "fx-strike";
    s.style.setProperty("--tilt", `${(seededRandom(edit.id)() - 0.5) * 1.6}deg`);
    ph.append(s);
  }
  ph.classList.add("is-edited");
  return s;
}
export default {
  play(edit, ctx) {
    const s = mount(edit, ctx);
    return ctx.gsap.timeline({ paused: true }).fromTo(s, { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: "power2.inOut" });
  },
  finish(edit, ctx) { ctx.gsap.set(mount(edit, ctx), { scaleX: 1 }); },
};
```

`src/effects/redact.js` (rubric) — same structure with class `fx-redact`, `duration: 0.55`, `ease: "power1.out"`, two sweeps on long phrases (`phrase.length > 40` → `scaleX` 0→0.55→1 with a 0.1s pause between).

`src/effects/index.js`:
```js
import strike from "./strike.js";
import redact from "./redact.js";
import paste from "./paste.js";
import add from "./add.js";
import tear from "./tear.js";
import optional from "./optional.js";
import move from "./move.js";
import posture from "./posture.js";
const MAP = { shortened: strike, repetition: strike, rubric: redact, rewritten: paste, added: add, removed: tear, optional, moved: move, posture };
export const getEffect = (type) => MAP[type];
```
Until Tasks 7–10 land, create each of `paste.js add.js tear.js optional.js move.js posture.js` as `export default { play: (e, ctx) => ctx.gsap.timeline({ paused: true }), finish() {} };` — each later task replaces its file.

`src/styles/effects.css`:
```css
.fx-strike, .fx-redact { position: absolute; left: -.15em; right: -.2em; pointer-events: none; transform-origin: left center; transform: scaleX(0); }
.fx-strike { top: 52%; height: .12em; background: #c0392b; border-radius: .1em; rotate: var(--tilt, -1deg); opacity: .9; mix-blend-mode: multiply; }
.fx-redact { top: .05em; bottom: -.05em; background: #141210; border-radius: .08em; box-shadow: 0 0 .5px .5px rgba(20,18,16,.6); }
.ph { -webkit-box-decoration-break: clone; box-decoration-break: clone; }
```
Multi-line phrases: the absolute overlay covers the span's bounding box only for single-line phrases; for phrases that wrap, `mount` instead sets `ph.classList.add("fx-inline-strike")` and animates a CSS custom property `--p` 0→1 used in `background: linear-gradient(#c0392b,#c0392b) no-repeat 0 55% / calc(var(--p)*100%) .12em` with `box-decoration-break: clone` (detect wrap via `ph.getClientRects().length > 1`).

Add `@import "./effects.css";` to `base.css`.

- [ ] **Step 4: Run — expect PASS**
- [ ] **Step 5: Commit** — `git commit -m "Add effect registry, strike and redaction effects"`

---

### Task 7: Paste (rewritten), add (added)

**Files:**
- Create: `src/effects/paste.js`, `src/effects/add.js`, `src/styles/scraps.css`; Modify: `tests/effects.test.js`

**Interfaces:**
- Consumes: `renderBlock` (Task 3), util (Task 6).
- Produces: `.scrap` element factory `makeScrap(blocks, doc, seed) → HTMLElement` exported from `paste.js`.

- [ ] **Step 1: Failing tests** (append)

```js
describe("paste and add", () => {
  it("rewritten: scrap covers target block and block reserves its height", () => {
    const ctx = setup();
    const e = { id: "p1", type: "rewritten", target: "foot.ant", replacement: [{ id: "n1", kind: "prayer", text: "New words." }], source: {} };
    getEffect("rewritten").finish(e, ctx);
    const blk = ctx.section.querySelector('[data-block="foot.ant"]');
    expect(blk.querySelector(".scrap").textContent).toContain("New words.");
  });
  it("added: scrap inserted after target block", () => {
    const ctx = setup();
    const e = { id: "a1", type: "added", target: "foot.sign", replacement: [{ id: "n2", kind: "prayer", text: "Added." }], source: {} };
    getEffect("added").finish(e, ctx);
    expect(ctx.section.querySelector('[data-block="foot.sign"]').nextElementSibling.classList).toContain("scrap-slot");
  });
});
```

- [ ] **Step 2: Run — expect FAIL**
- [ ] **Step 3: Implement** — `src/effects/paste.js`

```js
import { renderBlock } from "../render/book.js";
import { blockOf, seededRandom } from "./util.js";

export function makeScrap(blocks, doc, seed) {
  const r = seededRandom(seed);
  const s = doc.createElement("div");
  s.className = "scrap";
  s.style.setProperty("--rot", `${(r() - 0.5) * 3.2}deg`);
  s.style.setProperty("--tape-x", `${25 + r() * 45}%`);
  for (const b of blocks) s.append(renderBlock(b, doc));
  return s;
}

function mount(edit, ctx) {
  const blk = blockOf(edit.target, ctx);
  let s = blk.querySelector(":scope > .scrap");
  if (!s) { s = makeScrap(edit.replacement, document, edit.id); blk.append(s); blk.classList.add("is-pasted"); }
  return { blk, s };
}
const settle = (blk, s) => { blk.style.minHeight = `${s.offsetHeight}px`; };

export default {
  play(edit, ctx) {
    const { blk, s } = mount(edit, ctx);
    return ctx.gsap.timeline({ paused: true, onComplete: () => settle(blk, s) })
      .fromTo(s, { opacity: 0, y: -40, rotation: -8, scale: 1.12, "--shadow": 1 },
        { opacity: 1, y: 0, rotation: "var(--rot)", scale: 1, "--shadow": 0, duration: 0.9, ease: "power3.out" });
  },
  finish(edit, ctx) {
    const { blk, s } = mount(edit, ctx);
    ctx.gsap.set(s, { opacity: 1, y: 0, scale: 1, "--shadow": 0 });
    settle(blk, s);
  },
};
```

(GSAP cannot tween `rotation` to a CSS var; set `rotation: parseFloat(s.style.getPropertyValue("--rot"))` instead.)

`src/effects/add.js`:
```js
import { makeScrap } from "./paste.js";
import { blockOf } from "./util.js";
function mount(edit, ctx) {
  const after = blockOf(edit.target, ctx);
  let slot = after.nextElementSibling;
  if (!slot?.classList.contains("scrap-slot") || slot.dataset.edit !== edit.id) {
    slot = document.createElement("div");
    slot.className = "scrap-slot";
    slot.dataset.edit = edit.id;
    slot.append(makeScrap(edit.replacement, document, edit.id));
    after.after(slot);
  }
  return { slot, s: slot.firstElementChild };
}
export default {
  play(edit, ctx) {
    const { slot, s } = mount(edit, ctx);
    return ctx.gsap.timeline({ paused: true })
      .fromTo(slot, { height: 0 }, { height: "auto", duration: 0.5, ease: "power2.inOut" })
      .fromTo(s, { opacity: 0, x: 60, rotation: 6 }, { opacity: 1, x: 0, rotation: parseFloat(s.style.getPropertyValue("--rot")) || 0, duration: 0.7, ease: "power3.out" }, "-=0.2");
  },
  finish(edit, ctx) { const { slot, s } = mount(edit, ctx); ctx.gsap.set(slot, { height: "auto" }); ctx.gsap.set(s, { opacity: 1, x: 0 }); },
};
```

`src/styles/scraps.css`:
```css
.is-pasted { position: relative; }
.is-pasted > .scrap { position: absolute; left: 4%; right: 2%; top: -.2rem; }
.scrap-slot { overflow: visible; }
.scrap-slot > .scrap { margin: .4rem 2% .9rem 6%; }
.scrap {
  --shadow: 0;
  position: relative; z-index: 2; padding: .7rem .9rem; background: #fbfbf8; color: #222;
  font: 400 .88rem/1.5 "IBM Plex Sans", system-ui, sans-serif;
  rotate: var(--rot);
  box-shadow: 0 calc(2px + var(--shadow) * 22px) calc(6px + var(--shadow) * 24px) rgba(0,0,0,calc(.28 - var(--shadow) * .08));
  background-image: linear-gradient(rgba(0,0,0,.025) 1px, transparent 1px); background-size: 100% 1.32rem;
}
.scrap::before { content: ""; position: absolute; top: -.55rem; left: var(--tape-x); width: 3.4rem; height: 1.1rem; background: rgba(232,221,178,.78); rotate: 4deg; box-shadow: 0 1px 1px rgba(0,0,0,.08); }
.scrap .blk { margin: 0 0 .25rem; } .scrap .blk--rubric { color: #8a3a32; font-style: normal; font-size: .78rem; }
.scrap .spk { color: #555; font-weight: 500; } .scrap .margin { display: none; }
```
Import from `base.css`.

- [ ] **Step 4: Run — expect PASS**
- [ ] **Step 5: Commit** — `git commit -m "Add paste-over and inserted scrap effects"`

---

### Task 8: Tear (removed)

**Files:**
- Create: `src/effects/tear.js`, `src/styles/tear.css`; Modify: `tests/effects.test.js`

**Interfaces:**
- Consumes: `raggedPolygon`, `seededRandom`, `blockOf`.

- [ ] **Step 1: Failing test**

```js
it("removed: blocks become torn holes and a falling piece is created", () => {
  const ctx = setup();
  getEffect("removed").finish(fixture.sections[0].edits[1], ctx);
  const blk = ctx.section.querySelector('[data-block="foot.ant"]');
  expect(blk.classList).toContain("is-torn");
  expect(blk.querySelector(".hole")).not.toBeNull();
});
```

- [ ] **Step 2: Run — expect FAIL**
- [ ] **Step 3: Implement**

The torn region spans the target plus `targets`. Wrap them: insert a `.tear-zone` before the first block, move the blocks into it. Inside the zone add `.hole` (desk gradient visible through a ragged clip-path, inner shadow) behind, and the original blocks become `.tear-piece` content which falls away.

```js
import { blockOf, raggedPolygon, seededRandom } from "./util.js";
function mount(edit, ctx) {
  const first = blockOf(edit.target, ctx);
  let zone = first.closest(".tear-zone");
  if (!zone) {
    zone = document.createElement("div");
    zone.className = "tear-zone";
    first.before(zone);
    const piece = document.createElement("div");
    piece.className = "tear-piece";
    for (const id of [edit.target, ...(edit.targets ?? [])]) piece.append(blockOf(id, ctx));
    const r = seededRandom(edit.id);
    const shape = raggedPolygon(r, { edges: ["top", "bottom"], amp: 6, step: 3 });
    const hole = document.createElement("div");
    hole.className = "hole";
    hole.style.clipPath = shape;
    piece.style.clipPath = shape;
    zone.append(hole, piece);
    zone.querySelectorAll(".blk").forEach((b) => b.classList.add("is-torn"));
    first.classList.add("is-torn");
  }
  return zone;
}
export default {
  play(edit, ctx) {
    const zone = mount(edit, ctx);
    const piece = zone.querySelector(".tear-piece"), hole = zone.querySelector(".hole");
    const r = seededRandom(edit.id + "fall");
    const dir = r() > 0.5 ? 1 : -1;
    return ctx.gsap.timeline({ paused: true })
      .set(hole, { opacity: 1 })
      .to(piece, { rotation: dir * 1.5, y: -6, duration: 0.25, ease: "power1.out" })
      .to(piece, { rotation: dir * (14 + r() * 10), rotationX: 25, x: dir * 80, y: "+=320", opacity: 0, duration: 1.1, ease: "power2.in" })
      .set(piece, { visibility: "hidden" });
  },
  finish(edit, ctx) {
    const zone = mount(edit, ctx);
    ctx.gsap.set(zone.querySelector(".hole"), { opacity: 1 });
    ctx.gsap.set(zone.querySelector(".tear-piece"), { opacity: 0, visibility: "hidden" });
  },
};
```

Note on fixture: in `finish` the test checks `blk.classList` contains `is-torn` and that `.hole` exists in the zone — adjust assertion to `blk.closest(".tear-zone").querySelector(".hole")`.

`src/styles/tear.css`:
```css
.tear-zone { position: relative; margin: .3rem -1rem; padding: .4rem 1rem; perspective: 900px; }
.tear-piece { position: relative; z-index: 3; padding: .5rem 1rem; margin: -.5rem -1rem;
  background: radial-gradient(ellipse at 40% 20%, var(--paper-0), var(--paper-1)); transform-origin: 50% 0; }
.hole { position: absolute; inset: 0; opacity: 0; z-index: 1;
  background: radial-gradient(ellipse at 50% 40%, var(--desk-0), var(--desk-1) 70%);
  box-shadow: inset 0 3px 8px rgba(0,0,0,.7), inset 0 -2px 6px rgba(0,0,0,.5); }
.hole::after { content: ""; position: absolute; inset: 0; border-top: 2px dotted rgba(240,228,200,.55); border-bottom: 2px dotted rgba(240,228,200,.55); filter: blur(.4px); } /* paper fibres at the torn edge */
```

- [ ] **Step 4: Run — expect PASS**; visually check in `npm run dev`.
- [ ] **Step 5: Commit** — `git commit -m "Add torn-out effect for removed passages"`

---

### Task 9: Optional + moved

**Files:**
- Create: `src/effects/optional.js`, `src/effects/move.js`; Modify: `src/styles/effects.css`, `tests/effects.test.js`

- [ ] **Step 1: Failing tests**

```js
it("optional: clip and option tabs attached to target, labelled with options", () => {
  const ctx = setup();
  const e = { id: "o1", type: "optional", target: "foot.sign", options: ["I", "II", "III", "IV"], replacement: [{ id: "o1r", kind: "rubric", text: "Or another Eucharistic Prayer." }], source: {} };
  getEffect("optional").finish(e, ctx);
  const blk = ctx.section.querySelector('[data-block="foot.sign"]');
  expect([...blk.querySelectorAll(".opt-tab")].map((t) => t.textContent)).toEqual(["I", "II", "III", "IV"]);
  expect(blk.querySelector(".opt-clip")).not.toBeNull();
});
it("moved: block relocated after destination, ghost left behind", () => {
  const ctx = setup();
  const e = { id: "m1", type: "moved", target: "foot.rub", destination: "foot.ant", source: {} };
  getEffect("moved").finish(e, ctx);
  const ant = ctx.section.querySelector('[data-block="foot.ant"]');
  expect(ant.nextElementSibling.dataset.block).toBe("foot.rub");
  expect(ctx.section.querySelector(".move-ghost")).not.toBeNull();
});
```

- [ ] **Step 2: Run — expect FAIL**
- [ ] **Step 3: Implement** — `src/effects/optional.js`

```js
import { blockOf } from "./util.js";
import { makeScrap } from "./paste.js";
function mount(edit, ctx) {
  const blk = blockOf(edit.target, ctx);
  let fan = blk.querySelector(":scope > .opt-fan");
  if (!fan) {
    blk.classList.add("is-optional");
    const clip = document.createElement("span"); clip.className = "opt-clip";
    fan = document.createElement("div"); fan.className = "opt-fan";
    edit.options.forEach((label, i) => {
      const t = document.createElement("span"); t.className = "opt-tab"; t.textContent = label;
      t.style.setProperty("--i", i); fan.append(t);
    });
    fan.append(makeScrap(edit.replacement, document, edit.id));
    blk.append(clip, fan);
  }
  return { clip: blk.querySelector(".opt-clip"), tabs: [...fan.querySelectorAll(".opt-tab")], note: fan.querySelector(".scrap") };
}
export default {
  play(edit, ctx) {
    const { clip, tabs, note } = mount(edit, ctx);
    return ctx.gsap.timeline({ paused: true })
      .fromTo(clip, { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "back.out(2)" })
      .fromTo(tabs, { x: -20, opacity: 0, rotation: 0 }, { x: 0, opacity: 1, rotation: (i) => i * 4 - 4, duration: 0.5, stagger: 0.12, ease: "power2.out" })
      .fromTo(note, { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, "-=0.2");
  },
  finish(edit, ctx) {
    const { clip, tabs, note } = mount(edit, ctx);
    ctx.gsap.set([clip, ...tabs, note], { opacity: 1, x: 0, y: 0 });
  },
};
```

`src/effects/move.js` (FLIP):
```js
import { blockOf } from "./util.js";
function relocate(edit, ctx) {
  const blk = blockOf(edit.target, ctx);
  if (blk.dataset.moved) return { blk, dx: 0, dy: 0 };
  const before = blk.getBoundingClientRect();
  const ghost = document.createElement("div");
  ghost.className = "move-ghost";
  ghost.style.height = `${before.height}px`;
  blk.before(ghost);
  blockOf(edit.destination, ctx).after(blk);
  blk.dataset.moved = "1";
  blk.classList.add("is-moved");
  const after = blk.getBoundingClientRect();
  return { blk, dx: before.left - after.left, dy: before.top - after.top };
}
export default {
  play(edit, ctx) {
    const blk = blockOf(edit.target, ctx);
    const tl = ctx.gsap.timeline({ paused: true });
    tl.fromTo(blk, { "--cut": 0 }, { "--cut": 1, duration: 0.7, ease: "none" }) // dashed scissor outline draws
      .add(() => {
        const { dx, dy } = relocate(edit, ctx);
        ctx.gsap.fromTo(blk, { x: dx, y: dy, rotation: -2 }, { x: 0, y: 0, rotation: 0.6, duration: 1.1, ease: "power2.inOut" });
      })
      .to({}, { duration: 1.1 });
    return tl;
  },
  finish(edit, ctx) { const { blk } = relocate(edit, ctx); ctx.gsap.set(blk, { x: 0, y: 0, "--cut": 1 }); },
};
```

Append to `effects.css`:
```css
.is-optional { position: relative; }
.opt-clip { position: absolute; left: -1.1rem; top: -.6rem; width: .9rem; height: 2.4rem; border: 2px solid #b8a06a; border-radius: .5rem; opacity: 0; box-shadow: 1px 2px 2px rgba(0,0,0,.25); }
.opt-fan { position: absolute; right: -4.6rem; top: 0; display: flex; flex-direction: column; gap: .3rem; width: 4rem; }
.opt-tab { display: inline-block; padding: .1rem .5rem; background: #fbfbf8; font: 500 .72rem "IBM Plex Sans", sans-serif; box-shadow: 0 1px 3px rgba(0,0,0,.3); opacity: 0; }
.opt-fan .scrap { position: absolute; top: 7rem; right: 0; width: 13rem; opacity: 0; }
.is-moved { position: relative; --cut: 1; outline: 1.5px dashed rgba(40,40,40,calc(.6 * var(--cut))); outline-offset: .35rem; }
.move-ghost { background: rgba(255,255,255,.18); box-shadow: inset 0 0 0 1px rgba(120,100,60,.15); margin: 0 0 .6rem; }
@media (max-width: 720px) { .opt-fan { position: static; flex-direction: row; width: auto; margin-top: .5rem; } .opt-fan .scrap { position: relative; top: 0; width: auto; } }
```

- [ ] **Step 4: Run — expect PASS**
- [ ] **Step 5: Commit** — `git commit -m "Add optional and moved effects"`

---

### Task 10: Posture icons, posture effect, margin marks

**Files:**
- Modify: `src/icons/postures.js`; Create: `src/effects/posture.js`, `src/effects/mark.js`; Modify: `src/styles/effects.css`, `tests/effects.test.js`

**Interfaces:**
- Produces: `postureSvg(name) → string`; `mark.play(edit, ctx)` / `mark.finish(edit, ctx)` for edits with a `mark` (called by Task 11's timeline builder after each edit's effect).

- [ ] **Step 1: Failing tests**

```js
import mark from "../src/effects/mark.js";
import { postureSvg } from "../src/icons/postures.js";
import { POSTURES } from "../src/content/schema.js";
it("every posture has an icon", () => { for (const p of POSTURES) expect(postureSvg(p)).toMatch(/<svg[\s\S]*path/); });
it("posture change scribbles old and adds new icon", () => {
  const ctx = setup();
  const e = { id: "pc", type: "posture", target: "foot.sign", icon: "sign-cross", action: "change", to: "bow-head", source: {} };
  getEffect("posture").finish(e, ctx);
  const m = ctx.section.querySelector('[data-block="foot.sign"] .margin');
  expect(m.querySelector('.posture[data-icon="sign-cross"] .scribble')).not.toBeNull();
  expect(m.querySelector('.posture.is-new[data-icon="bow-head"]')).not.toBeNull();
});
it("mark writes a margin note", () => {
  const ctx = setup();
  mark.finish(fixture.sections[0].edits[1], ctx);
  expect(ctx.section.querySelector(".mark").textContent).toBe("omit");
});
```

- [ ] **Step 2: Run — expect FAIL**
- [ ] **Step 3: Implement** — `src/icons/postures.js` (original pictograms, 24×24, stroke-only)

```js
const P = {
  stand:          '<circle cx="12" cy="4" r="2"/><path d="M12 6v8M12 9l-3 3M12 9l3 3M12 14l-2.5 7M12 14l2.5 7"/>',
  kneel:          '<circle cx="11" cy="4" r="2"/><path d="M11 6v7M11 9l3 2M11 13h-4l-2 6M11 13l3 6h4"/>',
  genuflect:      '<circle cx="11" cy="4" r="2"/><path d="M11 6v8M11 9l3 2M11 14l4 1v5M11 14l-3 6h-2"/>',
  "bow-profound": '<circle cx="17" cy="10" r="2"/><path d="M15 11L8 9M11 10l2 4M8 9v6l-1 6M8 15l2 6"/>',
  "bow-head":     '<circle cx="13" cy="5" r="2"/><path d="M12 7v7M12 9l-3 3M12 9l3 3M12 14l-2.5 7M12 14l2.5 7"/>',
  "strike-breast":'<circle cx="12" cy="4" r="2"/><path d="M12 6v8M12 9l-3 3M12 9l2 1 1-1M12 14l-2.5 7M12 14l2.5 7"/><path d="M17 7l-1.5 1.5M18.5 9l-2 .5"/>',
  "sign-cross":   '<path d="M12 3v18M6 9h12"/>',
  "face-altar":   '<path d="M4 20h16M6 20v-6h12v6M12 14V9M10 11h4"/><circle cx="12" cy="5" r="1.4"/>',
};
export const postureSvg = (name) =>
  `<svg class="ico" viewBox="0 0 24 24" role="img" aria-label="${name.replace("-", " ")}">${P[name]}</svg>`;
```

`src/effects/posture.js`:
```js
import { postureSvg } from "../icons/postures.js";
import { blockOf, seededRandom } from "./util.js";
const NS = "http://www.w3.org/2000/svg";
function scribblePath(seed) {
  const r = seededRandom(seed);
  let d = "M2 6";
  for (let i = 0; i < 7; i++) d += ` L${22 - (i % 2) * 20 + (r() - 0.5) * 3} ${6 + i * 2 + (r() - 0.5) * 2}`;
  return d;
}
function mount(edit, ctx) {
  const m = blockOf(edit.target, ctx).querySelector(".margin");
  const icon = m.querySelector(`.posture[data-icon="${edit.icon}"]`);
  let scr = icon.querySelector(".scribble");
  if (!scr) {
    scr = document.createElementNS(NS, "svg");
    scr.setAttribute("class", "scribble"); scr.setAttribute("viewBox", "0 0 24 24");
    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", scribblePath(edit.id)); p.setAttribute("pathLength", "1");
    scr.append(p); icon.append(scr);
  }
  let neu = null;
  if (edit.action === "change") {
    neu = m.querySelector(`.posture.is-new[data-icon="${edit.to}"]`);
    if (!neu) {
      neu = document.createElement("span");
      neu.className = "posture is-new"; neu.dataset.icon = edit.to; neu.innerHTML = postureSvg(edit.to);
      icon.after(neu);
    }
  }
  return { path: scr.querySelector("path"), neu };
}
export default {
  play(edit, ctx) {
    const { path, neu } = mount(edit, ctx);
    const tl = ctx.gsap.timeline({ paused: true })
      .fromTo(path, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.6, ease: "none" });
    if (neu) tl.fromTo(neu, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.6, ease: "power1.inOut" }, "+=0.15");
    return tl;
  },
  finish(edit, ctx) {
    const { path, neu } = mount(edit, ctx);
    ctx.gsap.set(path, { strokeDashoffset: 0 });
    if (neu) ctx.gsap.set(neu, { clipPath: "inset(0 0% 0 0)" });
  },
};
```

`src/effects/mark.js`:
```js
import { blockOf, seededRandom } from "./util.js";
function mount(edit, ctx) {
  const blk = blockOf(edit.target, ctx);
  let m = ctx.section.querySelector(`.mark[data-edit="${edit.id}"]`);
  if (!m) {
    m = document.createElement("span");
    m.className = "mark"; m.dataset.edit = edit.id; m.textContent = edit.mark;
    m.style.setProperty("--rot", `${(seededRandom(edit.id + "m")() - 0.5) * 10}deg`);
    m.style.top = `${blk.offsetTop}px`;
    ctx.section.append(m);
  }
  return m;
}
export default {
  play(edit, ctx) {
    return ctx.gsap.timeline({ paused: true })
      .fromTo(mount(edit, ctx), { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.5, ease: "power1.inOut" });
  },
  finish(edit, ctx) { ctx.gsap.set(mount(edit, ctx), { clipPath: "inset(0 0% 0 0)" }); },
};
```

Append to `effects.css`:
```css
.scribble { position: absolute; inset: -15%; width: 130%; height: 130%; overflow: visible; }
.scribble path { fill: none; stroke: #1b1714; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 1; stroke-dashoffset: 1; }
.posture.is-new { color: var(--note); clip-path: inset(0 100% 0 0); }
.mark { position: absolute; right: -3.2rem; font: 400 1.35rem "Caveat", cursive; color: var(--note); rotate: var(--rot); clip-path: inset(0 100% 0 0); white-space: nowrap; }
@media (max-width: 720px) { .mark { right: .2rem; } }
```

- [ ] **Step 4: Run — expect PASS**
- [ ] **Step 5: Commit** — `git commit -m "Add posture icons, posture scribbles and margin marks"`

---

### Task 11: Scroll engine + opening

**Files:**
- Create: `src/scroll/engine.js`, `src/styles/opening.css`; Modify: `src/main.js`, `index.html`

**Interfaces:**
- Consumes: `createSectionController`, `getEffect`, `mark`, `renderBook`.
- Produces: `startEngine(missal, bookEl, { reduced }) → void`; `buildSectionTimeline(edits, ctx) → gsap.core.Timeline`.

- [ ] **Step 1: Implement** — `src/scroll/engine.js`

```js
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createSectionController } from "./controller.js";
import { getEffect } from "../effects/index.js";
import mark from "../effects/mark.js";
gsap.registerPlugin(ScrollTrigger);

export function buildSectionTimeline(edits, ctx) {
  const tl = gsap.timeline({ paused: true });
  edits.forEach((e, i) => {
    tl.add(getEffect(e.type).play(e, ctx).play(), i === 0 ? 0.6 : "+=0.35");
    if (e.mark) tl.add(mark.play(e, ctx).play(), "-=0.1");
  });
  return tl;
}
export function finishSection(edits, ctx) {
  for (const e of edits) { getEffect(e.type).finish(e, ctx); if (e.mark) mark.finish(e, ctx); }
}

export function startEngine(missal, book, { reduced = false } = {}) {
  for (const s of missal.sections) {
    if (!s.edits.length) continue;
    const section = book.querySelector(`[data-section="${s.id}"]`);
    const ctx = { section, root: book, gsap };
    const c = createSectionController({
      edits: s.edits,
      buildTimeline: (edits) => reduced
        ? gsap.timeline({ paused: true }).add(() => finishSection(edits, ctx)).fromTo(section, { opacity: 0.6 }, { opacity: 1, duration: 0.4 })
        : buildSectionTimeline(edits, ctx),
      finishAll: (edits) => finishSection(edits, ctx),
    });
    ScrollTrigger.create({ trigger: section, start: "top 35%", end: "bottom top", onEnter: () => c.trigger(), onLeave: () => c.leave() });
  }
}

export function startOpening(cover) {
  gsap.timeline({ scrollTrigger: { trigger: cover, start: "top top", end: "+=90%", scrub: 0.6, pin: true } })
    .to(cover.querySelector(".cover-front"), { rotationY: -165, transformOrigin: "left center", ease: "power1.inOut" })
    .to(cover.querySelector(".scroll-hint"), { opacity: 0, duration: 0.2 }, 0);
}
```

Note: nested `.play()` on child timelines inside a paused parent: GSAP child timelines are controlled by their parent's playhead, so `tl.progress(1)` in the controller completes all children too. (Child `play()` only unpauses them.)

`index.html` body: add before `#desk` content via `main.js`:
```js
import { missal } from "./content/missal.js";
import { renderBook } from "./render/book.js";
import { startEngine, startOpening } from "./scroll/engine.js";

const desk = document.getElementById("desk");
const cover = document.createElement("div");
cover.className = "cover";
cover.innerHTML = `<div class="cover-front"><span class="cover-cross">✠</span><span class="cover-title">Missale Romanum</span></div><p class="scroll-hint">scroll</p>`;
const book = renderBook(missal, document);
desk.append(cover, book);
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
if (!reduced) startOpening(cover);
startEngine(missal, book, { reduced });
```

`src/styles/opening.css`:
```css
.cover { height: 100vh; display: grid; place-items: center; perspective: 1600px; position: relative; }
.cover-front {
  width: min(78vw, 26rem); aspect-ratio: 3 / 4.2; display: grid; place-items: center; align-content: center; gap: 1.2rem;
  background: radial-gradient(ellipse at 35% 25%, #5a1d18, #3b110d 70%, #250906);
  border-radius: .3rem .6rem .6rem .3rem; box-shadow: inset 6px 0 10px rgba(0,0,0,.45), 0 30px 60px rgba(0,0,0,.7);
  color: var(--gold); backface-visibility: hidden;
}
.cover-cross { font-size: 3rem; } .cover-title { font-variant: small-caps; letter-spacing: .25em; font-size: 1.1rem; }
.scroll-hint { position: absolute; bottom: 2rem; color: #a8946a; font: 400 .8rem "IBM Plex Sans", sans-serif; letter-spacing: .3em; text-transform: uppercase; animation: hint 2.4s ease-in-out infinite; }
@keyframes hint { 50% { transform: translateY(6px); opacity: .5; } }
```

- [ ] **Step 2: Verify** — `npm test` (all pass), `npm run dev`; scroll through the fixture or real content: cover opens, sections edit once when they reach 35% from top, scrolling up shows edited state, fast flick leaves all sections edited.
- [ ] **Step 3: Commit** — `git commit -m "Wire scroll engine, one-way triggers and opening cover"`

---

### Task 12: Sources page

**Files:**
- Create: `src/render/sources.js`, `sources.html`, `src/sources-main.js`, `src/styles/sources.css`, `tests/sources.test.js`

**Interfaces:**
- Produces: `buildSources(missal) → [{ section, sectionTitle, editId, type, summary, vetus, novus, stage, note }]`; `renderSources(entries, doc) → HTMLElement`.

- [ ] **Step 1: Failing test**

```js
import { describe, it, expect } from "vitest";
import { buildSources, renderSources } from "../src/render/sources.js";
import { fixture } from "./fixture.js";
describe("sources", () => {
  it("has exactly one entry per edit, in page order", () => {
    const entries = buildSources(fixture);
    expect(entries.map((e) => e.editId)).toEqual(["e1", "e2"]);
    expect(entries[1]).toMatchObject({ sectionTitle: "Prayers at the Foot of the Altar", type: "removed", stage: "1970" });
  });
  it("renders a table row per entry", () => {
    const el = renderSources(buildSources(fixture), document);
    expect(el.querySelectorAll("tbody tr")).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**
- [ ] **Step 3: Implement**

```js
import { srNote } from "./srnote.js";
export function buildSources(missal) {
  return missal.sections.flatMap((s) => s.edits.map((e) => ({
    section: s.id, sectionTitle: s.title, editId: e.id, type: e.type,
    summary: srNote(e), vetus: e.source.vetus, novus: e.source.novus, stage: e.source.stage, note: e.source.note ?? "",
  })));
}
export function renderSources(entries, doc) {
  const wrap = doc.createElement("article"); wrap.className = "sources";
  const h = doc.createElement("h1"); h.textContent = "Sources"; wrap.append(h);
  const intro = doc.createElement("p");
  intro.textContent = "Every change shown is listed here with references to the 1962 and 1970 editions of the Missale Romanum and the General Instruction. Translations of both missals are our own, from the Latin.";
  wrap.append(intro);
  const t = doc.createElement("table");
  t.innerHTML = "<thead><tr><th>Section</th><th>Change</th><th>1962</th><th>1970</th><th>When</th><th>Notes</th></tr></thead><tbody></tbody>";
  for (const e of entries) {
    const tr = doc.createElement("tr");
    for (const v of [e.sectionTitle, e.summary, e.vetus, e.novus, e.stage, e.note]) {
      const td = doc.createElement("td"); td.textContent = v; tr.append(td);
    }
    t.tBodies[0].append(tr);
  }
  wrap.append(t);
  return wrap;
}
```

`sources.html`: same head as `index.html` (title "Sources — Ordo Missae", stylesheet `/src/styles/sources.css`), body `<a href="index.html" class="back">← Missal</a><main id="sources"></main><script type="module" src="/src/sources-main.js"></script>`.

`src/sources-main.js`:
```js
import { missal } from "./content/missal.js";
import { buildSources, renderSources } from "./render/sources.js";
document.getElementById("sources").append(renderSources(buildSources(missal), document));
```

`src/styles/sources.css`: cream page, EB Garamond, table with 1px rubric-red rules, `font-size: .9rem`, horizontally scrollable wrapper on phones (`.sources table { display: block; overflow-x: auto; }` under 720px).

- [ ] **Step 4: Run — expect PASS**
- [ ] **Step 5: Commit** — `git commit -m "Generate sources page from missal data"`

---

### Task 13: Phones, reduced motion, accessibility

**Files:**
- Create: `src/styles/mobile.css`, `tests/engine.test.js`; Modify: `src/styles/base.css`

- [ ] **Step 1: Failing test** — reduced motion applies final state without running effect timelines

```js
import { describe, it, expect, vi } from "vitest";
vi.mock("gsap/ScrollTrigger", () => ({ ScrollTrigger: { create: vi.fn((o) => o) } }));
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { startEngine } from "../src/scroll/engine.js";
import { renderBook } from "../src/render/book.js";
import * as effects from "../src/effects/index.js";
import { fixture } from "./fixture.js";

describe("reduced motion", () => {
  it("applies final state with no effect timelines", () => {
    const book = renderBook(fixture, document); document.body.append(book);
    const spy = vi.spyOn(effects.getEffect("removed"), "play");
    startEngine(fixture, book, { reduced: true });
    const trig = ScrollTrigger.create.mock.calls[0][0];
    trig.onEnter(); trig.onLeave();
    expect(spy).not.toHaveBeenCalled();
    expect(book.querySelector('[data-block="foot.ant"]').classList).toContain("is-torn");
  });
});
```

- [ ] **Step 2: Run — expect FAIL or PASS**; if PASS already (engine from Task 11 handles it), keep the test as a regression pin.
- [ ] **Step 3: Phone styles** — `src/styles/mobile.css`

```css
@media (max-width: 720px) {
  .desk { padding: 8vh 16px 25vh; }
  .book { padding: 1.6rem 1.1rem 2.5rem; transform: none; }
  html { font-size: 15px; }
  .margin { position: static; display: inline-flex; flex-direction: row; vertical-align: -.25rem; margin-right: .35rem; }
  .posture { width: 1.15rem; height: 1.15rem; }
  .initial { font-size: 2.8rem; }
  .tear-piece { clip-path: none !important; }
  .scrap { box-shadow: 0 2px 5px rgba(0,0,0,.25); }
}
```
Import from `base.css`. Confirm contrast: rubric `#b3261e` on `#efe2c4` ≥ 4.5:1 (measured ≈ 5.6:1); note blue `#2b4a8a` on paper ≈ 7:1; scrap `#222` on `#fbfbf8` > 15:1.
- [ ] **Step 4: Run — expect PASS**
- [ ] **Step 5: Commit** — `git commit -m "Phone layout, reduced-motion pin and contrast"`

---

### Task 14: Visual verification pass

- [ ] **Step 1:** `npm run build && npx vite preview`; open in Chrome at 1440×900 and 390×844.
- [ ] **Step 2:** For each section, screenshot intact (before trigger) and edited (after) states; check: no half-edited sections after flick-scrolling to bottom and back up; tears show desk; scraps legible; icons scribbled; no horizontal scroll at phone width; no console errors.
- [ ] **Step 3:** Fix any defects found (each fix with a regression test where testable) and commit.
- [ ] **Step 4:** Share screenshots with the user.
