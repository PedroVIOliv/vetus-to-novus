export function seededRandom(seed) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

// Ragged-edge polygon in % units; `edges` lists which sides are torn.
export function raggedPolygon(rand, { edges = ["top", "right", "bottom", "left"], amp = 3, step = 4 } = {}) {
  const off = (edge) => (edges.includes(edge) ? amp + (rand() - 0.5) * 2 * amp : 0);
  const pts = [];
  for (let x = 0; x <= 100; x += step) pts.push([x, off("top")]);
  for (let y = step; y <= 100; y += step) pts.push([100 - off("right"), y]);
  for (let x = 100 - step; x >= 0; x -= step) pts.push([x, 100 - off("bottom")]);
  for (let y = 100 - step; y > 0; y -= step) pts.push([off("left"), y]);
  return `polygon(${pts.map(([x, y]) => `${x.toFixed(2)}% ${y.toFixed(2)}%`).join(", ")})`;
}

const esc = (s) => globalThis.CSS?.escape?.(s) ?? s.replace(/["\\]/g, "\\$&");
export const phraseOf = (edit, ctx) => ctx.section.querySelector(`.ph[data-edit="${esc(edit.id)}"]`);
export const blockOf = (id, ctx) => ctx.root.querySelector(`[data-block="${esc(id)}"]`);
