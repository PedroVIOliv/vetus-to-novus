export function createSectionController({ edits, buildTimeline, finishAll }) {
  let tl = null;
  const c = {
    state: "idle",
    trigger() {
      if (c.state !== "idle") return;
      c.state = "playing";
      tl = buildTimeline(edits);
      // GSAP keeps one onComplete per timeline; chain onto any the builder already set.
      const prev = tl.eventCallback("onComplete");
      tl.eventCallback("onComplete", () => { prev?.(); c.state = "played"; });
      tl.play();
    },
    // Called only when the reader scrolls down past the section's end.
    leave() {
      if (c.state === "playing") tl.progress(1);
      else if (c.state === "idle") { finishAll(edits); c.state = "played"; }
    },
  };
  return c;
}
