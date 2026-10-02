import { describe, it, expect, vi, beforeEach } from "vitest";
vi.mock("gsap/ScrollTrigger", () => ({ ScrollTrigger: { create: vi.fn((o) => o) } }));
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { startEngine, buildSectionTimeline } from "../src/scroll/engine.js";
import { renderBook } from "../src/render/book.js";
import { fixture } from "./fixture.js";

const mountBook = () => {
  document.body.innerHTML = "";
  const book = renderBook(fixture, document);
  document.body.append(book);
  return book;
};

beforeEach(() => ScrollTrigger.create.mockClear());

describe("engine", () => {
  it("section timeline jumped to the end leaves every edit in its final state", () => {
    const book = mountBook();
    const s = fixture.sections[0];
    const tl = buildSectionTimeline(s.edits, { section: book.querySelector(".sec"), root: book, gsap });
    tl.progress(1);
    expect(book.querySelector('[data-block="foot.ant"]').classList).toContain("is-torn");
    expect(book.querySelector(".tear-piece").style.visibility).toBe("hidden");
    expect(book.querySelector(".mark").textContent).toBe("omit");
  });
  it("creates one trigger per edited passage, wired to its controller", () => {
    const book = mountBook();
    startEngine(fixture, book);
    expect(ScrollTrigger.create).toHaveBeenCalledTimes(2);
    const tear = ScrollTrigger.create.mock.calls[1][0];
    tear.onLeave(); // flicked past before it triggered
    expect(book.querySelector('[data-block="foot.ant"]').classList).toContain("is-torn");
    expect(book.querySelector(".fx-redact")).toBeNull(); // the other passage is untouched
  });
  it("mounts nothing until a passage's trigger fires", () => {
    const book = mountBook();
    startEngine(fixture, book);
    expect(book.querySelector(".tear-zone")).toBeNull();
    ScrollTrigger.create.mock.calls[1][0].onEnter();
    expect(book.querySelector(".tear-zone")).not.toBeNull();
  });
  it("trigger positions are computed from the passage, in document px", () => {
    const book = mountBook();
    startEngine(fixture, book);
    const t = ScrollTrigger.create.mock.calls[0][0];
    expect(typeof t.start).toBe("function");
    expect(typeof t.end).toBe("function");
    expect(t.end()).toBeGreaterThanOrEqual(t.start());
  });
});

import * as effects from "../src/effects/index.js";

describe("reduced motion", () => {
  it("applies final state with no effect timelines", () => {
    const book = mountBook();
    const spy = vi.spyOn(effects.getEffect("removed"), "play");
    startEngine(fixture, book, { reduced: true });
    const t = ScrollTrigger.create.mock.calls[1][0];
    t.onEnter(); t.onLeave();
    expect(spy).not.toHaveBeenCalled();
    expect(book.querySelector('[data-block="foot.ant"]').classList).toContain("is-torn");
    spy.mockRestore();
  });
});
