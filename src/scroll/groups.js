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

// Scroll positions (document px) at which a passage spanning top..bottom starts and stops:
// it starts once its first line is within the top 20% of the screen.
export const TRIGGER_LINE = 0.2;

export function triggerRange({ top, bottom, vh }) {
  const start = Math.max(0, top - vh * TRIGGER_LINE);
  return { start, end: Math.max(start + 1, bottom) };
}
