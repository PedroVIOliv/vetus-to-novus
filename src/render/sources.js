import { srNote } from "./srnote.js";

export function buildSources(missal) {
  return missal.sections.flatMap((s) => s.edits.map((e) => ({
    section: s.id, sectionTitle: s.title, editId: e.id, type: e.type,
    summary: srNote(e), vetus: e.source.vetus, novus: e.source.novus, stage: e.source.stage,
    note: e.source.note ?? "", confidence: e.source.confidence ?? "high",
  })));
}

const INTRO = [
  "Every change shown in the missal is listed here, in the order it appears, with references to the 1962 and 1970 editions of the Missale Romanum.",
  "The page shows a Low Mass. Translations of both missals are our own, made from the Latin; scripture in the 1962 text follows the Douay-Rheims.",
  "Many changes came in stages before 1970: IO = Inter Oecumenici (1964, in force 1965); TAA = Tres abhinc annos (1967). The “When” column gives the first stage.",
];

export function renderSources(entries, doc) {
  const wrap = doc.createElement("article");
  wrap.className = "sources";
  const h = doc.createElement("h1");
  h.textContent = "Sources";
  wrap.append(h);
  for (const t of INTRO) {
    const p = doc.createElement("p");
    p.textContent = t;
    wrap.append(p);
  }
  const table = doc.createElement("table");
  table.innerHTML = "<thead><tr><th>Section</th><th>Change</th><th>1962</th><th>1970</th><th>When</th><th>Notes</th></tr></thead><tbody></tbody>";
  for (const e of entries) {
    const tr = doc.createElement("tr");
    const note = e.confidence === "high" ? e.note : `${e.note} (to be verified against the editio typica)`.trim();
    for (const v of [e.sectionTitle, e.summary, e.vetus, e.novus, e.stage, note]) {
      const td = doc.createElement("td");
      td.textContent = v;
      tr.append(td);
    }
    table.tBodies[0].append(tr);
  }
  const scroller = doc.createElement("div");
  scroller.className = "table-wrap";
  scroller.append(table);
  wrap.append(scroller);
  return wrap;
}
