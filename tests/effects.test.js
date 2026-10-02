import { describe, it, expect } from "vitest";
import { gsap } from "gsap";
import { getEffect } from "../src/effects/index.js";
import { seededRandom, raggedPolygon } from "../src/effects/util.js";
import { renderBook } from "../src/render/book.js";
import { fixture } from "./fixture.js";
import { EDIT_TYPES } from "../src/content/schema.js";

const setup = () => {
  document.body.innerHTML = "";
  const book = renderBook(fixture, document);
  document.body.append(book);
  return { section: book.querySelector(".sec"), root: book, gsap };
};

describe("util", () => {
  it("seededRandom is deterministic", () => {
    const a = seededRandom("x"), b = seededRandom("x");
    expect([a(), a()]).toEqual([b(), b()]);
  });
  it("raggedPolygon produces a polygon", () => {
    expect(raggedPolygon(seededRandom("y"), { edges: ["top", "bottom"] })).toMatch(/^polygon\(/);
  });
});

describe("registry", () => {
  it("has an effect for every edit type", () => {
    for (const t of EDIT_TYPES) expect(typeof getEffect(t).play).toBe("function");
  });
});

describe("rubric redaction", () => {
  it("finish adds a bar inside the phrase span (survives resize)", () => {
    const ctx = setup();
    getEffect("rubric").finish(fixture.sections[0].edits[0], ctx);
    const ph = ctx.section.querySelector('.ph[data-edit="e1"]');
    expect(ph.querySelector(".fx-redact")).not.toBeNull();
    expect(ph.classList).toContain("is-edited");
  });
  it("play returns a paused timeline", () => {
    const ctx = setup();
    const tl = getEffect("rubric").play(fixture.sections[0].edits[0], ctx);
    expect(tl.paused()).toBe(true);
  });
});

describe("strike", () => {
  it("finish adds a strike inside the phrase span", () => {
    const ctx = setup();
    getEffect("shortened").finish({ ...fixture.sections[0].edits[0], type: "shortened" }, ctx);
    expect(ctx.section.querySelector('.ph[data-edit="e1"] .fx-strike')).not.toBeNull();
  });
});
