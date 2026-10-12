const STRIKES = ["shortened", "repetition"];

// Edits are played per passage: all edits on one block (or one torn span) together, except
// that a block's strike-throughs are their own passage, played before the block's other edits.
export function groupEdits(edits) {
  const groups = new Map();
  for (const e of edits) {
    const strikeOnly = STRIKES.includes(e.type);
    const key = `${e.target}|${strikeOnly}`;
    if (!groups.has(key)) groups.set(key, { span: [e.target], edits: [], strikeOnly });
    const g = groups.get(key);
    for (const t of e.targets ?? []) if (!g.span.includes(t)) g.span.push(t);
    g.edits.push(e);
  }
  const firstSeen = [...new Set(edits.map((e) => e.target))];
  return [...groups.values()].sort((a, b) =>
    firstSeen.indexOf(a.span[0]) - firstSeen.indexOf(b.span[0]) || b.strikeOnly - a.strikeOnly);
}
