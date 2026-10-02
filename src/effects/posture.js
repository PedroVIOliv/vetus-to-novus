import { postureSvg } from "../icons/postures.js";
import { blockOf, seededRandom } from "./util.js";

const NS = "http://www.w3.org/2000/svg";

function scribblePath(seed) {
  const r = seededRandom(seed);
  let d = "M2 6";
  for (let i = 0; i < 7; i++) d += ` L${(22 - (i % 2) * 20 + (r() - 0.5) * 3).toFixed(1)} ${(6 + i * 2 + (r() - 0.5) * 2).toFixed(1)}`;
  return d;
}

function mount(edit, ctx) {
  const m = blockOf(edit.target, ctx).querySelector(".margin");
  const icon = m.querySelector(`.posture[data-icon="${edit.icon}"]:not(.is-new)`);
  let scr = icon.querySelector(".scribble");
  if (!scr) {
    scr = document.createElementNS(NS, "svg");
    scr.setAttribute("class", "scribble");
    scr.setAttribute("viewBox", "0 0 24 24");
    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", scribblePath(edit.id));
    p.setAttribute("pathLength", "1");
    scr.append(p);
    icon.append(scr);
  }
  let neu = null;
  if (edit.action === "change") {
    neu = m.querySelector(`.posture.is-new[data-icon="${edit.to}"]`);
    if (!neu) {
      neu = document.createElement("span");
      neu.className = "posture is-new";
      neu.dataset.icon = edit.to;
      neu.innerHTML = postureSvg(edit.to);
      icon.after(neu);
    }
  }
  return { path: scr.querySelector("path"), neu };
}

export default {
  play(edit, ctx) {
    const { path, neu } = mount(edit, ctx);
    const tl = ctx.gsap.timeline({ paused: true })
      .fromTo(path, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.6, ease: "none" });
    if (neu) tl.fromTo(neu, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.6, ease: "power1.inOut" }, "+=0.15");
    return tl;
  },
  finish(edit, ctx) {
    const { path, neu } = mount(edit, ctx);
    ctx.gsap.set(path, { strokeDashoffset: 0 });
    if (neu) ctx.gsap.set(neu, { clipPath: "inset(0 0% 0 0)" });
  },
};
