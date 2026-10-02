import { describe, it, expect, vi } from "vitest";
import { readTime, zoneState, createReader } from "../src/scroll/reader.js";

const vh = 1000;
const ctrl = () => {
  const c = { state: "idle", trigger: vi.fn(() => { c.state = "playing"; }), leave: vi.fn(() => { c.state = "played"; }) };
  return c;
};
const passage = (rect, need = 2000) => {
  const p = { controller: ctrl(), need, rect, measure: () => p.rect };
  return p;
};

describe("readTime", () => {
  it("allows skimming pace, ~500 words a minute, between 0.8 s and 3.5 s", () => {
    expect(readTime(2)).toBe(800);
    expect(readTime(20)).toBe(2400);
    expect(readTime(400)).toBe(3500);
  });
});

describe("zoneState", () => {
  it("is reading while the passage overlaps the middle band of the screen", () => {
    expect(zoneState({ top: 400, bottom: 500 }, vh)).toBe("reading");
    expect(zoneState({ top: 950, bottom: 1200 }, vh)).toBe("away");
    expect(zoneState({ top: -300, bottom: 50 }, vh)).toBe("away");
    expect(zoneState({ top: -300, bottom: -1 }, vh)).toBe("passed");
  });
});

describe("reader", () => {
  it("does not play a passage until it has been on screen long enough to read", () => {
    const p = passage({ top: 400, bottom: 500 });
    const r = createReader([p]);
    r.tick(1500, vh);
    expect(p.controller.trigger).not.toHaveBeenCalled();
    r.tick(600, vh);
    expect(p.controller.trigger).toHaveBeenCalledTimes(1);
  });
  it("pauses the reading time while the passage is off the band, and resumes it", () => {
    const p = passage({ top: 400, bottom: 500 });
    const r = createReader([p]);
    r.tick(1500, vh);
    p.rect = { top: 1200, bottom: 1300 };
    r.tick(5000, vh);
    expect(p.controller.trigger).not.toHaveBeenCalled();
    p.rect = { top: 400, bottom: 500 };
    r.tick(600, vh);
    expect(p.controller.trigger).toHaveBeenCalledTimes(1);
  });
  it("plays one passage at a time, in page order", () => {
    const a = passage({ top: 200, bottom: 300 }), b = passage({ top: 400, bottom: 500 });
    const r = createReader([a, b]);
    r.tick(2500, vh);
    expect(a.controller.trigger).toHaveBeenCalled();
    expect(b.controller.trigger).not.toHaveBeenCalled();
    a.controller.state = "played";
    r.tick(16, vh);
    expect(b.controller.trigger).toHaveBeenCalled();
  });
  it("a ready passage waits while it is off screen, and plays when it comes back", () => {
    const p = passage({ top: 400, bottom: 500 });
    const r = createReader([p]);
    r.tick(1999, vh);
    p.rect = { top: 1200, bottom: 1300 };
    r.tick(16, vh);
    r.tick(16, vh);
    expect(p.controller.trigger).not.toHaveBeenCalled();
    p.rect = { top: 400, bottom: 500 };
    r.tick(16, vh);
    expect(p.controller.trigger).toHaveBeenCalled();
  });
  it("a passage scrolled past before it played is finished at once", () => {
    const a = passage({ top: -400, bottom: -10 });
    const r = createReader([a]);
    r.tick(16, vh);
    expect(a.controller.leave).toHaveBeenCalled();
    expect(a.controller.trigger).not.toHaveBeenCalled();
  });
  it("a passage scrolled past while playing completes, and frees the next one", () => {
    const a = passage({ top: 200, bottom: 300 }), b = passage({ top: 400, bottom: 500 });
    const r = createReader([a, b]);
    r.tick(2500, vh);
    a.rect = { top: -400, bottom: -10 };
    r.tick(16, vh);
    expect(a.controller.leave).toHaveBeenCalled();
    expect(b.controller.trigger).toHaveBeenCalled();
  });
});
