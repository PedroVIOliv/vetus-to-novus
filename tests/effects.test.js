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
  it("raggedPolygon keeps torn top/bottom edges a fixed pixel depth on any height", () => {
    const poly = raggedPolygon(seededRandom("z"), { edges: ["top", "bottom"], amp: 6 });
    expect(poly).toMatch(/calc\(0% \+ [\d.]+px\)/);
    expect(poly).toMatch(/calc\(100% - [\d.]+px\)/);
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
  it("finish hides the redacted text itself, so wrapped phrases are unreadable too", () => {
    const ctx = setup();
    getEffect("rubric").finish(fixture.sections[0].edits[0], ctx);
    expect(ctx.section.querySelector('.ph[data-edit="e1"]').style.color).toBe("transparent");
  });
  it("strike leaves the text readable", () => {
    const ctx = setup();
    getEffect("shortened").finish({ ...fixture.sections[0].edits[0], type: "shortened" }, ctx);
    expect(ctx.section.querySelector('.ph[data-edit="e1"]').style.color).toBe("");
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

describe("optional and moved", () => {
  it("optional: clip and option tabs attached to target, labelled with options", () => {
    const ctx = setup();
    const e = { id: "o1", type: "optional", target: "foot.sign", options: ["I", "II", "III", "IV"], replacement: [{ id: "o1r", kind: "rubric", text: "Or another Eucharistic Prayer." }], source: {} };
    getEffect("optional").finish(e, ctx);
    const blk = ctx.section.querySelector('[data-block="foot.sign"]');
    expect([...blk.querySelectorAll(".opt-tab")].map((t) => t.textContent)).toEqual(["I", "II", "III", "IV"]);
    expect(blk.querySelector(".opt-clip")).not.toBeNull();
  });
  it("moved: block relocated after destination, ghost left behind", () => {
    const ctx = setup();
    const e = { id: "m1", type: "moved", target: "foot.rub", destination: "foot.ant", source: {} };
    getEffect("moved").finish(e, ctx);
    const ant = ctx.section.querySelector('[data-block="foot.ant"]');
    expect(ant.nextElementSibling.dataset.block).toBe("foot.rub");
    expect(ctx.section.querySelector(".move-ghost")).not.toBeNull();
  });
  it("moved: finishing twice moves only once", () => {
    const ctx = setup();
    const e = { id: "m2", type: "moved", target: "foot.rub", destination: "foot.ant", source: {} };
    getEffect("moved").finish(e, ctx); getEffect("moved").finish(e, ctx);
    expect(ctx.section.querySelectorAll(".move-ghost")).toHaveLength(1);
  });
});

import mark from "../src/effects/mark.js";
import { postureSvg } from "../src/icons/postures.js";
import { POSTURES } from "../src/content/schema.js";

describe("postures and marks", () => {
  it("every posture has a drawn icon", () => {
    for (const p of POSTURES) expect(postureSvg(p)).toMatch(/<svg[\s\S]*<path/);
  });
  it("posture change scribbles old and adds new icon", () => {
    const ctx = setup();
    const e = { id: "pc", type: "posture", target: "foot.sign", icon: "sign-cross", action: "change", to: "bow-head", source: {} };
    getEffect("posture").finish(e, ctx);
    const m = ctx.section.querySelector('[data-block="foot.sign"] .margin');
    expect(m.querySelector('.posture[data-icon="sign-cross"] .scribble')).not.toBeNull();
    expect(m.querySelector('.posture.is-new[data-icon="bow-head"]')).not.toBeNull();
  });
  it("posture remove scribbles without adding an icon", () => {
    const ctx = setup();
    const e = { id: "pr", type: "posture", target: "foot.sign", icon: "sign-cross", action: "remove", source: {} };
    getEffect("posture").finish(e, ctx);
    expect(ctx.section.querySelectorAll(".posture.is-new")).toHaveLength(0);
    expect(ctx.section.querySelector(".scribble")).not.toBeNull();
  });
  it("mark writes a margin note", () => {
    const ctx = setup();
    mark.finish(fixture.sections[0].edits[1], ctx);
    expect(ctx.section.querySelector(".mark").textContent).toBe("omit");
  });
});

describe("repeated posture icons", () => {
  it("two remove edits on the same icon scribble two different icons", () => {
    document.body.innerHTML = "";
    const m = { sections: [{ id: "g", title: "G", initial: "Z", blocks: [{ id: "g1", kind: "rubric", text: "He genuflects, elevates, genuflects.", postures: ["genuflect", "genuflect"] }], edits: [] }] };
    const book = renderBook(m, document); document.body.append(book);
    const ctx = { section: book.querySelector(".sec"), root: book, gsap };
    getEffect("posture").finish({ id: "g-a", type: "posture", target: "g1", icon: "genuflect", action: "remove" }, ctx);
    getEffect("posture").finish({ id: "g-b", type: "posture", target: "g1", icon: "genuflect", action: "remove" }, ctx);
    getEffect("posture").finish({ id: "g-a", type: "posture", target: "g1", icon: "genuflect", action: "remove" }, ctx);
    expect(book.querySelectorAll(".scribble")).toHaveLength(2);
  });
});

describe("mark on a torn passage", () => {
  it("stays visible on the tear zone, not inside the falling piece", () => {
    const ctx = setup();
    const e = fixture.sections[0].edits[1];
    getEffect("removed").finish(e, ctx);
    mark.finish(e, ctx);
    const m = ctx.section.querySelector(".mark");
    expect(m.closest(".tear-piece")).toBeNull();
    expect(m.parentElement.classList).toContain("tear-zone");
  });
});
