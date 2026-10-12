import { blockOf } from "./util.js";

const slotFor = (id, ctx) => ctx.root.querySelector(`.move-slot[data-for="${id}"]`);

// A destination that is itself still waiting to move lands at its own slot.
function landing(edit, ctx) {
  let anchor = slotFor(edit.destination, ctx) ?? blockOf(edit.destination, ctx);
  while (anchor.nextElementSibling?.classList.contains("scrap-slot")) anchor = anchor.nextElementSibling;
  return anchor;
}

// An invisible copy holds the block's space at its destination, so the move changes no heights.
// Ids are dropped so the copy is never found in place of the block, its phrases or its icons' masks.
function prepare(edit, ctx) {
  const blk = blockOf(edit.target, ctx);
  if (blk.dataset.moved || slotFor(edit.target, ctx)) return;
  const slot = blk.cloneNode(true);
  for (const n of [slot, ...slot.querySelectorAll("[data-block], [data-edit], [id]")]) {
    n.removeAttribute("data-block");
    n.removeAttribute("data-edit");
    n.removeAttribute("id");
  }
  slot.classList.add("move-slot");
  slot.dataset.for = edit.target;
  slot.setAttribute("aria-hidden", "true");
  landing(edit, ctx).after(slot);
}

// FLIP: measure, move the node, then animate from the old position to the new one.
function relocate(edit, ctx) {
  const blk = blockOf(edit.target, ctx);
  if (blk.dataset.moved) return { blk, dx: 0, dy: 0 };
  const before = blk.getBoundingClientRect();
  const ghost = document.createElement("div");
  ghost.className = "move-ghost";
  ghost.style.height = getComputedStyle(blk).height; // layout height: the rect includes the block's tilt
  blk.before(ghost);
  const slot = slotFor(edit.target, ctx);
  if (slot) slot.replaceWith(blk);
  else landing(edit, ctx).after(blk);
  blk.dataset.moved = "1";
  blk.classList.add("is-moved");
  const after = blk.getBoundingClientRect();
  return { blk, dx: before.left - after.left, dy: before.top - after.top };
}

export default {
  prepare,
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
