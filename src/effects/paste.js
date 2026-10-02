import { renderBlock } from "../render/book.js";
import { blockOf, seededRandom } from "./util.js";

export function makeScrap(blocks, doc, seed) {
  const r = seededRandom(seed);
  const s = doc.createElement("div");
  s.className = "scrap";
  s.dataset.rot = ((r() - 0.5) * 3.2).toFixed(2);
  s.style.setProperty("--tape-x", `${25 + r() * 45}%`);
  for (const b of blocks) s.append(renderBlock(b, doc));
  return s;
}

function mount(edit, ctx) {
  const blk = blockOf(edit.target, ctx);
  let s = blk.querySelector(":scope > .scrap");
  if (!s) {
    s = makeScrap(edit.replacement, document, edit.id);
    blk.append(s);
    blk.classList.add("is-pasted");
  }
  return { blk, s };
}

// The scrap is absolutely positioned, so the block must grow to fit a longer replacement.
const settle = (blk, s) => { blk.style.minHeight = `${s.offsetHeight}px`; };

export default {
  play(edit, ctx) {
    const { blk, s } = mount(edit, ctx);
    return ctx.gsap.timeline({ paused: true, onComplete: () => settle(blk, s) })
      .fromTo(s, { opacity: 0, y: -40, rotation: -8, scale: 1.12, "--shadow": 1 },
        { opacity: 1, y: 0, rotation: +s.dataset.rot, scale: 1, "--shadow": 0, duration: 0.9, ease: "power3.out" });
  },
  finish(edit, ctx) {
    const { blk, s } = mount(edit, ctx);
    ctx.gsap.set(s, { opacity: 1, y: 0, scale: 1, rotation: +s.dataset.rot, "--shadow": 0 });
    settle(blk, s);
  },
};
