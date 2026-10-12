import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createSectionController } from "./controller.js";
import { groupEdits } from "./groups.js";
import { createReader } from "./reader.js";
import { getEffect } from "../effects/index.js";
import mark from "../effects/mark.js";

gsap.registerPlugin(ScrollTrigger);

// Effect timelines are created paused; unpausing them hands control to the parent's playhead.
export function buildSectionTimeline(edits, ctx) {
  const tl = gsap.timeline({ paused: true });
  edits.forEach((e, i) => {
    tl.add(getEffect(e.type).play(e, ctx).play(), i === 0 ? 0.3 : "+=0.35");
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
// a passage's position stale. Only the passage's own words count: blocks also hold space
// reserved for scraps that have not appeared yet.
function spanRect(els) {
  const rects = els.flatMap((el) => {
    const words = el.querySelectorAll(":scope > .initial, :scope > .txt");
    return words.length ? [...words].map((w) => w.getBoundingClientRect()) : [el.getBoundingClientRect()];
  });
  return { top: Math.min(...rects.map((r) => r.top)), bottom: Math.max(...rects.map((r) => r.bottom)) };
}

// Every edit that adds or moves page content takes its final space up front, hidden, so
// playing an edit never changes the height of the page. Moves go last so they land after
// scraps attached to their destination.
export function preparePage(missal, book) {
  const ctxs = missal.sections.map((s) => ({ section: book.querySelector(`[data-section="${s.id}"]`), root: book, gsap }));
  for (const moves of [false, true]) {
    missal.sections.forEach((s, i) => {
      for (const e of s.edits) if ((e.type === "moved") === moves) getEffect(e.type).prepare?.(e, ctxs[i]);
    });
  }
}

export function startEngine(missal, book, { reduced = false, measure = spanRect, autostart = true } = {}) {
  preparePage(missal, book);
  const passages = [];
  for (const s of missal.sections) {
    const section = book.querySelector(`[data-section="${s.id}"]`);
    const ctx = { section, root: book, gsap };
    for (const { span, edits, strikeOnly } of groupEdits(s.edits)) {
      const els = span.map((id) => book.querySelector(`[data-block="${id}"]`));
      const controller = createSectionController({
        edits,
        buildTimeline: (es) => reduced
          ? gsap.timeline({ paused: true }).add(() => finishSection(es, ctx)).fromTo(els, { opacity: 0.6 }, { opacity: 1, duration: 0.4 })
          : buildSectionTimeline(es, ctx),
        finishAll: (es) => finishSection(es, ctx),
      });
      passages.push({ controller, strikeOnly, measure: () => measure(els) });
    }
  }
  const reader = createReader(passages);
  if (autostart) {
    const loop = () => {
      reader.tick(window.innerHeight);
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
