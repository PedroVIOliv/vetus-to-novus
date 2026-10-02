import { blockOf } from "./util.js";

// FLIP: measure, move the node, then animate from the old position to the new one.
function relocate(edit, ctx) {
  const blk = blockOf(edit.target, ctx);
  if (blk.dataset.moved) return { blk, dx: 0, dy: 0 };
  const before = blk.getBoundingClientRect();
  const ghost = document.createElement("div");
  ghost.className = "move-ghost";
  ghost.style.height = `${before.height}px`;
  blk.before(ghost);
  blockOf(edit.destination, ctx).after(blk);
  blk.dataset.moved = "1";
  blk.classList.add("is-moved");
  const after = blk.getBoundingClientRect();
  return { blk, dx: before.left - after.left, dy: before.top - after.top };
}

export default {
  play(edit, ctx) {
    const blk = blockOf(edit.target, ctx);
    blk.classList.add("is-cutting");
    return ctx.gsap.timeline({ paused: true })
      .fromTo(blk, { "--cut": 0 }, { "--cut": 1, duration: 0.7, ease: "none" })
      .add(() => {
        const { dx, dy } = relocate(edit, ctx);
        ctx.gsap.fromTo(blk, { x: dx, y: dy, rotation: -2 }, { x: 0, y: 0, rotation: 0.6, duration: 1.1, ease: "power2.inOut" });
      })
      .to({}, { duration: 1.1 });
  },
  finish(edit, ctx) {
    const { blk } = relocate(edit, ctx);
    blk.classList.add("is-cutting");
    ctx.gsap.set(blk, { x: 0, y: 0, rotation: 0.6, "--cut": 1 });
  },
};
