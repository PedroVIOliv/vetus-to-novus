import { phraseOf, seededRandom } from "./util.js";

// Shared by strike and redaction: an overlay inside the phrase span so it follows
// the text on resize. Wrapped phrases use a background on the span instead,
// because a single absolute box cannot follow a line break.
export function lineEffect(cls, { duration, ease, hideText = false }) {
  function mount(edit, ctx) {
    const ph = phraseOf(edit, ctx);
    let bar = ph.querySelector(`:scope > .${cls}`);
    if (!bar) {
      bar = document.createElement("span");
      bar.className = cls;
      bar.style.setProperty("--tilt", `${(seededRandom(edit.id)() - 0.5) * 1.6}deg`);
      ph.append(bar);
      if (ph.getClientRects().length > 1) ph.classList.add("fx-wrap", `${cls}-wrap`);
    }
    ph.classList.add("is-edited");
    return { ph, bar };
  }
  return {
    play(edit, ctx) {
      const { ph, bar } = mount(edit, ctx);
      const tl = ctx.gsap.timeline({ paused: true })
        .fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration, ease }, 0)
        .fromTo(ph, { "--p": 0 }, { "--p": 1, duration, ease }, 0);
      if (hideText) tl.set(ph, { color: "transparent" });
      return tl;
    },
    finish(edit, ctx) {
      const { ph, bar } = mount(edit, ctx);
      ctx.gsap.set(bar, { scaleX: 1 });
      ctx.gsap.set(ph, hideText ? { "--p": 1, color: "transparent" } : { "--p": 1 });
    },
  };
}
