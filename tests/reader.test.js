import { describe, it, expect, vi } from "vitest";
import { createReader } from "../src/scroll/reader.js";

const vh = 1000;
const ctrl = () => {
  const c = { state: "idle", trigger: vi.fn(() => { c.state = "playing"; }), leave: vi.fn(() => { c.state = "played"; }) };
  return c;
};
const passage = (rect, strikeOnly = false) => {
  const p = { controller: ctrl(), strikeOnly, rect, measure: () => p.rect };
  return p;
};

describe("reader", () => {
  it("waits until the passage's last line has reached the top 20% of the screen", () => {
    const p = passage({ top: 100, bottom: 300 });
    const r = createReader([p]);
    r.tick(vh);
    expect(p.controller.trigger).not.toHaveBeenCalled();
    p.rect = { top: -10, bottom: 190 };
    r.tick(vh);
    expect(p.controller.trigger).toHaveBeenCalledTimes(1);
  });
  it("a passage that is only struck through plays once its last line reaches the top 40%", () => {
    const struck = passage({ top: 200, bottom: 390 }, true), other = passage({ top: 200, bottom: 390 });
    createReader([struck]).tick(vh);
    createReader([other]).tick(vh);
    expect(struck.controller.trigger).toHaveBeenCalledTimes(1);
    expect(other.controller.trigger).not.toHaveBeenCalled();
  });
  it("a passage taller than the screen waits until its last line is near the top", () => {
    const p = passage({ top: -400, bottom: 850 });
    const r = createReader([p]);
    r.tick(vh);
    expect(p.controller.trigger).not.toHaveBeenCalled();
    p.rect = { top: -1050, bottom: 200 };
    r.tick(vh);
    expect(p.controller.trigger).toHaveBeenCalledTimes(1);
  });
  it("plays one passage at a time, in page order", () => {
    const a = passage({ top: 100, bottom: 180 }), b = passage({ top: 120, bottom: 190 });
    const r = createReader([a, b]);
    r.tick(vh);
    expect(a.controller.trigger).toHaveBeenCalled();
    expect(b.controller.trigger).not.toHaveBeenCalled();
    a.controller.state = "played";
    r.tick(vh);
    expect(b.controller.trigger).toHaveBeenCalled();
  });
  it("a passage scrolled past before it played is finished at once", () => {
    const a = passage({ top: -400, bottom: -10 });
    const r = createReader([a]);
    r.tick(vh);
    expect(a.controller.leave).toHaveBeenCalled();
    expect(a.controller.trigger).not.toHaveBeenCalled();
  });
  it("a passage scrolled past while playing completes, and frees the next one", () => {
    const a = passage({ top: 100, bottom: 180 }), b = passage({ top: 120, bottom: 190 });
    const r = createReader([a, b]);
    r.tick(vh);
    a.rect = { top: -400, bottom: -10 };
    r.tick(vh);
    expect(a.controller.leave).toHaveBeenCalled();
    expect(b.controller.trigger).toHaveBeenCalled();
  });
});
