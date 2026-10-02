import { srNote } from "./srnote.js";
import { postureSvg } from "../icons/postures.js";
import { nthIndex } from "../content/text.js";

const el = (doc, tag, cls, text) => {
  const n = doc.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

function textWithPhrases(doc, text, phraseEdits) {
  const txt = el(doc, "span", "txt");
  const found = phraseEdits
    .map((e) => ({ e, i: nthIndex(text, e.phrase, e.occurrence ?? 1) }))
    .filter(({ i }) => i >= 0)
    .sort((a, b) => a.i - b.i);
  let cursor = 0;
  for (const { e, i } of found) {
    if (i < cursor) continue; // overlapping phrases: the earlier one wins
    txt.append(doc.createTextNode(text.slice(cursor, i)));
    const ph = el(doc, "span", "ph", e.phrase);
    ph.dataset.edit = e.id;
    txt.append(ph);
    cursor = i + e.phrase.length;
  }
  txt.append(doc.createTextNode(text.slice(cursor)));
  return txt;
}

export function renderBlock(block, doc, edits = [], { initial = null } = {}) {
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
  const text = initial ? block.text.slice(initial.length) : block.text;
  p.append(textWithPhrases(doc, text, edits.filter((e) => e.phrase && e.target === block.id)));
  return p;
}

export function renderBook(missal, doc) {
  const book = el(doc, "div", "book");
  const title = el(doc, "header", "title-page");
  title.append(
    el(doc, "p", "tp-kicker", "Missale Romanum"),
    el(doc, "h1", "tp-title", "Ordo Missae"),
    el(doc, "p", "tp-year", "MCMLXII"),
  );
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
