import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createSectionController } from "./controller.js";
import { groupEdits, triggerRange } from "./groups.js";
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

// Edits move, insert and remove blocks, so trigger positions are recalculated after each passage.
let refreshQueued = false;
function queueRefresh() {
  if (refreshQueued || !ScrollTrigger.refresh) return;
  refreshQueued = true;
  requestAnimationFrame(() => { refreshQueued = false; ScrollTrigger.refresh(); });
}

function passageRange(els) {
  const rects = els.map((el) => el.getBoundingClientRect());
  return triggerRange({
    top: Math.min(...rects.map((r) => r.top)) + window.scrollY,
    bottom: Math.max(...rects.map((r) => r.bottom)) + window.scrollY,
    vh: window.innerHeight,
  });
}

export function startEngine(missal, book, { reduced = false } = {}) {
  for (const s of missal.sections) {
    const section = book.querySelector(`[data-section="${s.id}"]`);
    const ctx = { section, root: book, gsap };
    for (const { span, edits } of groupEdits(s.edits)) {
      const els = span.map((id) => book.querySelector(`[data-block="${id}"]`));
      const c = createSectionController({
        edits,
        buildTimeline: (es) => {
          const tl = reduced
            ? gsap.timeline({ paused: true }).add(() => finishSection(es, ctx)).fromTo(els, { opacity: 0.6 }, { opacity: 1, duration: 0.4 })
            : buildSectionTimeline(es, ctx);
          return tl.eventCallback("onComplete", queueRefresh);
        },
        finishAll: (es) => { finishSection(es, ctx); queueRefresh(); },
      });
      ScrollTrigger.create({
        trigger: els[0],
        start: () => passageRange(els).start,
        end: () => passageRange(els).end,
        onEnter: () => c.trigger(),
        onLeave: () => c.leave(),
      });
    }
  }
}

export function startOpening(cover) {
  gsap.timeline({ scrollTrigger: { trigger: cover, start: "top top", end: "+=90%", scrub: 0.6, pin: true } })
    .to(cover.querySelector(".cover-front"), { rotationY: -165, transformOrigin: "left center", ease: "power1.inOut" })
    .to(cover.querySelector(".scroll-hint"), { opacity: 0, duration: 0.2 }, 0);
}
