import { blockOf } from "./util.js";
import { makeScrap } from "./paste.js";

function mount(edit, ctx) {
  const blk = blockOf(edit.target, ctx);
  let fan = blk.querySelector(":scope > .opt-fan");
  if (!fan) {
    blk.classList.add("is-optional");
    const clip = document.createElement("span");
    clip.className = "opt-clip";
    fan = document.createElement("div");
    fan.className = "opt-fan";
    const tabs = document.createElement("div");
    tabs.className = "opt-tabs";
    for (const label of edit.options) {
      const t = document.createElement("span");
      t.className = "opt-tab";
      t.textContent = label;
      tabs.append(t);
    }
    fan.append(tabs, makeScrap(edit.replacement, document, edit.id));
    blk.append(clip, fan);
  }
  return { clip: blk.querySelector(":scope > .opt-clip"), tabs: [...fan.querySelectorAll(".opt-tab")], note: fan.querySelector(".scrap") };
}

export default {
  play(edit, ctx) {
    const { clip, tabs, note } = mount(edit, ctx);
    return ctx.gsap.timeline({ paused: true })
      .fromTo(clip, { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "back.out(2)" })
      .fromTo(tabs, { x: -20, opacity: 0, rotation: 0 }, { x: 0, opacity: 1, rotation: (i) => i * 4 - 4, duration: 0.5, stagger: 0.12, ease: "power2.out" })
      .fromTo(note, { opacity: 0, y: -16 }, { opacity: 1, y: 0, rotation: +note.dataset.rot, duration: 0.6, ease: "power3.out" }, "-=0.2");
  },
  finish(edit, ctx) {
    const { clip, tabs, note } = mount(edit, ctx);
    ctx.gsap.set(clip, { opacity: 1, y: 0 });
    tabs.forEach((t, i) => ctx.gsap.set(t, { opacity: 1, x: 0, rotation: i * 4 - 4 }));
    ctx.gsap.set(note, { opacity: 1, y: 0, rotation: +note.dataset.rot });
  },
};
