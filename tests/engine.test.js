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
  it("mounts nothing until a passage has been on screen long enough to read", () => {
    const book = mountBook();
    const reader = startEngine(fixture, book, { autostart: false, measure: () => ({ top: 400, bottom: 500 }) });
    reader.tick(500, 1000);
    expect(book.querySelector(".fx-redact")).toBeNull();
    expect(book.querySelector(".tear-zone")).toBeNull();
    reader.tick(3000, 1000);
    expect(book.querySelector(".fx-redact")).not.toBeNull(); // first passage, in page order
    expect(book.querySelector(".tear-zone")).toBeNull(); // the next waits its turn
  });
  it("a passage scrolled past before it played is finished at once", () => {
    const book = mountBook();
    const reader = startEngine(fixture, book, { autostart: false, measure: () => ({ top: -400, bottom: -10 }) });
    reader.tick(16, 1000);
    expect(book.querySelector('[data-block="foot.ant"]').classList).toContain("is-torn");
  });
});

import * as effects from "../src/effects/index.js";

describe("reduced motion", () => {
  it("applies final state with no effect timelines", () => {
    const book = mountBook();
    const spy = vi.spyOn(effects.getEffect("removed"), "play");
    let rect = { top: 400, bottom: 500 };
    const reader = startEngine(fixture, book, { reduced: true, autostart: false, measure: () => rect });
    reader.tick(10000, 1000);
    rect = { top: -400, bottom: -10 };
    reader.tick(16, 1000);
    expect(spy).not.toHaveBeenCalled();
    expect(book.querySelector('[data-block="foot.ant"]').classList).toContain("is-torn");
    spy.mockRestore();
  });
});
