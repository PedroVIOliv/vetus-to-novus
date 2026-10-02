import { nthIndex } from "./text.js";

export const EDIT_TYPES = ["removed", "rewritten", "shortened", "optional", "moved", "added", "rubric", "repetition", "posture"];
export const BLOCK_KINDS = ["rubric", "versicle", "response", "prayer", "scripture", "heading"];
export const POSTURES = ["kneel", "genuflect", "bow-profound", "bow-head", "strike-breast", "sign-cross", "stand", "face-altar"];
const NEEDS_PHRASE = ["shortened", "repetition", "rubric"];
const NEEDS_REPLACEMENT = ["rewritten", "added", "optional"];

export function validateMissal(missal) {
  const errs = [];
  const ids = new Set();
  const phraseSlots = new Set();
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
        else if (t && nthIndex(t.text, e.phrase, e.occurrence ?? 1) < 0) E(`occurrence ${e.occurrence} of phrase not in ${e.target}`);
        const slot = `${e.target}|${e.phrase}|${e.occurrence ?? 1}`;
        if (phraseSlots.has(slot)) E(`same phrase occurrence as another edit`);
        phraseSlots.add(slot);
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
