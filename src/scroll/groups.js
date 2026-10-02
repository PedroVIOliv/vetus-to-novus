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

// Scroll positions (document px) at which a passage spanning top..bottom starts and stops.
// It starts once the whole passage is in the top half of the screen, or, for a passage
// taller than that, once its first line is near the top, so it has been read either way.
export function triggerRange({ top, bottom, vh }) {
  const start = Math.max(0, Math.min(bottom - vh * 0.5, top - vh * 0.15));
  return { start, end: Math.max(start + 1, bottom) };
}
