// Edits are played per passage: all edits on one block (or one torn span) together.
export function groupEdits(edits) {
  const groups = new Map();
  for (const e of edits) {
    if (!groups.has(e.target)) groups.set(e.target, { span: [e.target], edits: [] });
    const g = groups.get(e.target);
    for (const t of e.targets ?? []) if (!g.span.includes(t)) g.span.push(t);
    g.edits.push(e);
  }
  return [...groups.values()];
}
