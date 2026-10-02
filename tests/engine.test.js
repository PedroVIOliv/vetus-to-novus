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
  it("creates one trigger per section with edits, wired to the controller", () => {
    const book = mountBook();
    startEngine(fixture, book);
    expect(ScrollTrigger.create).toHaveBeenCalledTimes(1);
    const t = ScrollTrigger.create.mock.calls[0][0];
    t.onLeave(); // flicked past before it triggered
    expect(book.querySelector('[data-block="foot.ant"]').classList).toContain("is-torn");
  });
});
