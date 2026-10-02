export function seededRandom(seed) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

// Ragged-edge polygon; `edges` lists which sides are torn. Positions along an edge are in %,
// the tear depth `amp` is in px so tall and short pieces tear equally deep.
export function raggedPolygon(rand, { edges = ["top", "right", "bottom", "left"], amp = 6, step = 4 } = {}) {
  const depth = (edge) => (edges.includes(edge) ? (amp * (0.4 + rand() * 1.2)).toFixed(1) : "0");
  const pts = [];
  for (let x = 0; x <= 100; x += step) pts.push(`${x}% calc(0% + ${depth("top")}px)`);
  for (let y = step; y <= 100; y += step) pts.push(`calc(100% - ${depth("right")}px) ${y}%`);
  for (let x = 100 - step; x >= 0; x -= step) pts.push(`${x}% calc(100% - ${depth("bottom")}px)`);
  for (let y = 100 - step; y > 0; y -= step) pts.push(`calc(0% + ${depth("left")}px) ${y}%`);
  return `polygon(${pts.join(", ")})`;
}

const esc = (s) => globalThis.CSS?.escape?.(s) ?? s.replace(/["\\]/g, "\\$&");
export const phraseOf = (edit, ctx) => ctx.section.querySelector(`.ph[data-edit="${esc(edit.id)}"]`);
export const blockOf = (id, ctx) => ctx.root.querySelector(`[data-block="${esc(id)}"]`);
