import { describe, it, expect } from "vitest";
import { renderBook } from "../src/render/book.js";
import { srNote } from "../src/render/srnote.js";
import { fixture } from "./fixture.js";

describe("renderBook", () => {
  const book = renderBook(fixture, document);
  it("renders sections and blocks with data attributes", () => {
    const sec = book.querySelector('section.sec[data-section="foot"]');
    expect(sec.querySelector("h2").textContent).toBe("Prayers at the Foot of the Altar");
    expect(sec.querySelectorAll(".blk")).toHaveLength(3);
    expect(sec.querySelector('[data-block="foot.rub"]').classList).toContain("blk--rubric");
  });
  it("wraps edit phrases in spans, keeping the text intact", () => {
    const blk = book.querySelector('[data-block="foot.rub"]');
    expect(blk.querySelector('.ph[data-edit="e1"]').textContent).toBe("makes the sign of the Cross");
    expect(blk.querySelector(".txt").textContent).toBe("The Priest makes the sign of the Cross, saying:");
  });
  it("renders the illuminated initial on the first non-rubric block starting with it", () => {
    const blk = book.querySelector('[data-block="foot.sign"]');
    expect(blk.querySelector(".initial").textContent).toBe("I");
    expect(blk.querySelector(".txt").textContent.startsWith("n the name")).toBe(true);
  });
  it("renders speaker and posture icons", () => {
    const blk = book.querySelector('[data-block="foot.sign"]');
    expect(blk.querySelector(".spk").textContent).toBe("P.");
    expect(blk.querySelector('.margin .posture[data-icon="sign-cross"]')).not.toBeNull();
  });
  it("adds screen-reader change notes per section", () => {
    const notes = book.querySelector('[data-section="foot"] .sr-only').textContent;
    expect(notes).toContain("Removed in 1970");
  });
  it("escapes text", () => {
    const b = renderBook({ sections: [{ id: "x", title: "<b>", initial: "A", blocks: [{ id: "x1", kind: "prayer", text: "<img>" }], edits: [] }] }, document);
    expect(b.querySelector("img")).toBeNull();
  });
});

describe("srNote", () => {
  it("describes each type", () => {
    expect(srNote({ type: "removed" })).toBe("Removed in 1970.");
    expect(srNote({ type: "rewritten", replacement: [{ text: "New." }] })).toBe("Replaced in 1970 by: New.");
    expect(srNote({ type: "posture", action: "change", icon: "genuflect", to: "bow-profound" })).toBe("Posture changed in 1970: genuflect → profound bow.");
  });
});
