import { blockOf, seededRandom } from "./util.js";

function mount(edit, ctx) {
  let m = ctx.section.querySelector(`.mark[data-edit="${edit.id}"]`);
  if (!m) {
    const blk = blockOf(edit.target, ctx);
    m = document.createElement("span");
    m.className = "mark";
    m.dataset.edit = edit.id;
    m.textContent = edit.mark;
    m.style.setProperty("--rot", `${((seededRandom(`${edit.id}:m`)() - 0.5) * 10).toFixed(1)}deg`);
    // Placed inside the block so it travels with it if the block moves or is torn.
    blk.append(m);
  }
  return m;
}

export default {
  play(edit, ctx) {
    return ctx.gsap.timeline({ paused: true })
      .fromTo(mount(edit, ctx), { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.5, ease: "power1.inOut" });
  },
  finish(edit, ctx) { ctx.gsap.set(mount(edit, ctx), { clipPath: "inset(0 0% 0 0)" }); },
};
