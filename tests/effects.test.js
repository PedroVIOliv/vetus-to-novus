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

describe("paste and add", () => {
  it("rewritten: scrap covers target block", () => {
    const ctx = setup();
    const e = { id: "p1", type: "rewritten", target: "foot.ant", replacement: [{ id: "n1", kind: "prayer", text: "New words." }], source: {} };
    getEffect("rewritten").finish(e, ctx);
    const blk = ctx.section.querySelector('[data-block="foot.ant"]');
    expect(blk.querySelector(":scope > .scrap").textContent).toContain("New words.");
    expect(blk.classList).toContain("is-pasted");
  });
  it("rewritten: finishing twice does not duplicate the scrap", () => {
    const ctx = setup();
    const e = { id: "p2", type: "rewritten", target: "foot.ant", replacement: [{ id: "n3", kind: "prayer", text: "X." }], source: {} };
    getEffect("rewritten").finish(e, ctx); getEffect("rewritten").finish(e, ctx);
    expect(ctx.section.querySelectorAll(".scrap")).toHaveLength(1);
  });
  it("added: scrap inserted after target block", () => {
    const ctx = setup();
    const e = { id: "a1", type: "added", target: "foot.sign", replacement: [{ id: "n2", kind: "prayer", text: "Added." }], source: {} };
    getEffect("added").finish(e, ctx);
    const next = ctx.section.querySelector('[data-block="foot.sign"]').nextElementSibling;
    expect(next.classList).toContain("scrap-slot");
    expect(next.textContent).toContain("Added.");
  });
});

describe("tear", () => {
  it("removed: blocks move into a tear zone with a hole behind them", () => {
    const ctx = setup();
    getEffect("removed").finish(fixture.sections[0].edits[1], ctx);
    const blk = ctx.section.querySelector('[data-block="foot.ant"]');
    expect(blk.classList).toContain("is-torn");
    expect(blk.closest(".tear-zone").querySelector(".hole")).not.toBeNull();
  });
  it("removed with extra targets tears all of them together", () => {
    const ctx = setup();
    const e = { id: "t2", type: "removed", target: "foot.sign", targets: ["foot.ant"], source: {} };
    getEffect("removed").finish(e, ctx);
    const zone = ctx.section.querySelector(".tear-zone");
    expect([...zone.querySelectorAll(".blk")].map((b) => b.dataset.block)).toEqual(["foot.sign", "foot.ant"]);
  });
});
