import { makeScrap } from "./paste.js";
import { blockOf } from "./util.js";

function mount(edit, ctx) {
  const after = blockOf(edit.target, ctx);
  let slot = ctx.root.querySelector(`.scrap-slot[data-edit="${edit.id}"]`);
  if (!slot) {
    slot = document.createElement("div");
    slot.className = "scrap-slot";
    slot.dataset.edit = edit.id;
    slot.append(makeScrap(edit.replacement, document, edit.id));
    after.after(slot);
  }
  return { slot, s: slot.firstElementChild };
}

export default {
  prepare(edit, ctx) {
    ctx.gsap.set(mount(edit, ctx).s, { opacity: 0 });
  },
  play(edit, ctx) {
    const { s } = mount(edit, ctx);
    return ctx.gsap.timeline({ paused: true })
      .fromTo(s, { opacity: 0, x: 60, rotation: 6 }, { opacity: 1, x: 0, rotation: +s.dataset.rot, duration: 0.7, ease: "power3.out" });
  },
  finish(edit, ctx) {
    const { s } = mount(edit, ctx);
    ctx.gsap.set(s, { opacity: 1, x: 0, rotation: +s.dataset.rot });
  },
};
