import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createSectionController } from "./controller.js";
import { getEffect } from "../effects/index.js";
import mark from "../effects/mark.js";

gsap.registerPlugin(ScrollTrigger);

// Effect timelines are created paused; unpausing them hands control to the parent's playhead.
export function buildSectionTimeline(edits, ctx) {
  const tl = gsap.timeline({ paused: true });
  edits.forEach((e, i) => {
    tl.add(getEffect(e.type).play(e, ctx).play(), i === 0 ? 0.6 : "+=0.35");
    if (e.mark) tl.add(mark.play(e, ctx).play(), "-=0.1");
  });
  return tl;
}

export function finishSection(edits, ctx) {
  for (const e of edits) {
    getEffect(e.type).finish(e, ctx);
    if (e.mark) mark.finish(e, ctx);
  }
}

export function startEngine(missal, book, { reduced = false } = {}) {
  for (const s of missal.sections) {
    if (!s.edits.length) continue;
    const section = book.querySelector(`[data-section="${s.id}"]`);
    const ctx = { section, root: book, gsap };
    const c = createSectionController({
      edits: s.edits,
      buildTimeline: (edits) => reduced
        ? gsap.timeline({ paused: true })
          .add(() => finishSection(edits, ctx))
          .fromTo(section, { opacity: 0.6 }, { opacity: 1, duration: 0.4 })
        : buildSectionTimeline(edits, ctx),
      finishAll: (edits) => finishSection(edits, ctx),
    });
    ScrollTrigger.create({
      trigger: section, start: "top 35%", end: "bottom top",
      onEnter: () => c.trigger(), onLeave: () => c.leave(),
    });
  }
}

export function startOpening(cover) {
  gsap.timeline({ scrollTrigger: { trigger: cover, start: "top top", end: "+=90%", scrub: 0.6, pin: true } })
    .to(cover.querySelector(".cover-front"), { rotationY: -165, transformOrigin: "left center", ease: "power1.inOut" })
    .to(cover.querySelector(".scroll-hint"), { opacity: 0, duration: 0.2 }, 0);
}
