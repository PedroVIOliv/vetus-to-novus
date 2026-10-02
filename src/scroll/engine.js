import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createSectionController } from "./controller.js";
import { groupEdits } from "./groups.js";
import { createReader, readTime } from "./reader.js";
import { getEffect } from "../effects/index.js";
import mark from "../effects/mark.js";

gsap.registerPlugin(ScrollTrigger);

// Effect timelines are created paused; unpausing them hands control to the parent's playhead.
export function buildSectionTimeline(edits, ctx) {
  const tl = gsap.timeline({ paused: true });
  edits.forEach((e, i) => {
    tl.add(getEffect(e.type).play(e, ctx).play(), i === 0 ? 0.8 : "+=0.35");
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

// Positions are measured live each frame, so edits that grow or move the page never leave
// a passage's position stale.
function spanRect(els) {
  const rects = els.map((el) => el.getBoundingClientRect());
  return { top: Math.min(...rects.map((r) => r.top)), bottom: Math.max(...rects.map((r) => r.bottom)) };
}

const wordCount = (els) => els.reduce((n, el) => n + el.textContent.trim().split(/\s+/).length, 0);

export function startEngine(missal, book, { reduced = false, measure = spanRect, autostart = true } = {}) {
  const passages = [];
  for (const s of missal.sections) {
    const section = book.querySelector(`[data-section="${s.id}"]`);
    const ctx = { section, root: book, gsap };
    for (const { span, edits } of groupEdits(s.edits)) {
      const els = span.map((id) => book.querySelector(`[data-block="${id}"]`));
      const controller = createSectionController({
        edits,
        buildTimeline: (es) => reduced
          ? gsap.timeline({ paused: true }).add(() => finishSection(es, ctx)).fromTo(els, { opacity: 0.6 }, { opacity: 1, duration: 0.4 })
          : buildSectionTimeline(es, ctx),
        finishAll: (es) => finishSection(es, ctx),
      });
      passages.push({ controller, need: readTime(wordCount(els)), measure: () => measure(els) });
    }
  }
  const reader = createReader(passages);
  if (autostart) {
    let last = performance.now();
    const loop = (now) => {
      // Capped so a long pause (hidden tab) doesn't count as reading time.
      reader.tick(Math.min(now - last, 100), window.innerHeight);
      last = now;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
  return reader;
}

export function startOpening(cover) {
  gsap.timeline({ scrollTrigger: { trigger: cover, start: "top top", end: "+=90%", scrub: 0.6, pin: true } })
    .to(cover.querySelector(".cover-front"), { rotationY: -165, transformOrigin: "left center", ease: "power1.inOut" })
    .to(cover.querySelector(".scroll-hint"), { opacity: 0, duration: 0.2 }, 0);
}
