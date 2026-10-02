import { describe, it, expect, vi } from "vitest";
import { createSectionController } from "../src/scroll/controller.js";

function fakeTl() {
  return {
    done: null, p: 0, play: vi.fn(),
    progress(n) { this.p = n; if (n === 1) this.done?.(); },
    eventCallback(_, fn) { if (fn === undefined) return this.done; this.done = fn; return this; },
  };
}

describe("section controller", () => {
  it("plays once on trigger and becomes played on completion", () => {
    const tl = fakeTl(); const build = vi.fn(() => tl);
    const c = createSectionController({ edits: [1], buildTimeline: build, finishAll: vi.fn() });
    c.trigger(); expect(c.state).toBe("playing"); expect(tl.play).toHaveBeenCalled();
    tl.progress(1); expect(c.state).toBe("played");
    c.trigger(); expect(build).toHaveBeenCalledTimes(1);
  });
  it("keeps an onComplete callback the timeline already had (GSAP holds only one)", () => {
    const tl = fakeTl(); const refresh = vi.fn();
    tl.eventCallback("onComplete", refresh);
    const c = createSectionController({ edits: [1], buildTimeline: () => tl, finishAll: vi.fn() });
    c.trigger(); tl.progress(1);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(c.state).toBe("played");
  });
  it("leaving while playing completes instantly", () => {
    const tl = fakeTl();
    const c = createSectionController({ edits: [1], buildTimeline: () => tl, finishAll: vi.fn() });
    c.trigger(); c.leave();
    expect(tl.p).toBe(1); expect(c.state).toBe("played");
  });
  it("leaving before trigger (fast flick past) finishes without animating", () => {
    const finishAll = vi.fn(); const build = vi.fn();
    const c = createSectionController({ edits: [1], buildTimeline: build, finishAll });
    c.leave();
    expect(finishAll).toHaveBeenCalledWith([1]); expect(build).not.toHaveBeenCalled(); expect(c.state).toBe("played");
  });
  it("fast flick through many sections leaves all played", () => {
    const cs = Array.from({ length: 5 }, () => createSectionController({ edits: [1], buildTimeline: fakeTl, finishAll: vi.fn() }));
    cs.forEach((c) => c.trigger()); cs.forEach((c) => c.leave());
    expect(cs.every((c) => c.state === "played")).toBe(true);
  });
  it("never reverses: leave and trigger after played are no-ops", () => {
    const finishAll = vi.fn(); const tl = fakeTl();
    const c = createSectionController({ edits: [1], buildTimeline: () => tl, finishAll });
    c.trigger(); tl.progress(1); c.leave(); c.trigger();
    expect(finishAll).not.toHaveBeenCalled(); expect(c.state).toBe("played");
  });
});
