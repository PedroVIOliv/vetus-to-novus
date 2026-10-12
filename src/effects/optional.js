import { blockOf } from "./util.js";
import { makeScrap } from "./paste.js";

// The options follow the block and any notes added to its text, which belong to the text itself.
function mount(edit, ctx) {
  let fan = ctx.root.querySelector(`.opt-fan[data-edit="${edit.id}"]`);
  if (!fan) {
    fan = document.createElement("div");
    fan.className = "opt-fan";
    fan.dataset.edit = edit.id;
    const tabs = document.createElement("div");
    tabs.className = "opt-tabs";
    for (const label of edit.options) {
      const t = document.createElement("span");
      t.className = "opt-tab";
      t.textContent = label;
      tabs.append(t);
    }
    fan.append(tabs, makeScrap(edit.replacement, document, edit.id));
    let anchor = blockOf(edit.target, ctx);
    while (anchor.nextElementSibling?.classList.contains("scrap-slot")) anchor = anchor.nextElementSibling;
    anchor.after(fan);
  }
  return { tabs: [...fan.querySelectorAll(".opt-tab")], note: fan.querySelector(".scrap") };
}

export default {
  prepare: mount,
  play(edit, ctx) {
    const { tabs, note } = mount(edit, ctx);
    return ctx.gsap.timeline({ paused: true })
      .fromTo(tabs, { x: -20, opacity: 0, rotation: 0 }, { x: 0, opacity: 1, rotation: (i) => i * 4 - 4, duration: 0.5, stagger: 0.12, ease: "power2.out" })
      .fromTo(note, { opacity: 0, y: -16 }, { opacity: 1, y: 0, rotation: +note.dataset.rot, duration: 0.6, ease: "power3.out" }, "-=0.2");
  },
  finish(edit, ctx) {
    const { tabs, note } = mount(edit, ctx);
    tabs.forEach((t, i) => ctx.gsap.set(t, { opacity: 1, x: 0, rotation: i * 4 - 4 }));
    ctx.gsap.set(note, { opacity: 1, y: 0, rotation: +note.dataset.rot });
  },
};
