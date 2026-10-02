import { describe, it, expect } from "vitest";
import { validateMissal } from "../src/content/schema.js";

const src = { vetus: "MR1962 OM 1", novus: "MR1970 OM 1", stage: "1970" };
const base = () => ({
  sections: [{
    id: "s", title: "S", initial: "I",
    blocks: [{ id: "b1", kind: "prayer", text: "In the name of the Father" },
             { id: "b2", kind: "rubric", text: "The priest bows." }],
    edits: [{ id: "e1", type: "shortened", target: "b1", phrase: "the Father", source: { ...src } }],
  }],
});

describe("validateMissal", () => {
  it("accepts valid data", () => expect(validateMissal(base())).toEqual([]));
  it("rejects missing source fields", () => {
    const m = base(); delete m.sections[0].edits[0].source.stage;
    expect(validateMissal(m).join()).toMatch(/e1.*source\.stage/);
  });
  it("rejects unknown type", () => {
    const m = base(); m.sections[0].edits[0].type = "deleted";
    expect(validateMissal(m).join()).toMatch(/e1.*type/);
  });
  it("rejects unknown target", () => {
    const m = base(); m.sections[0].edits[0].target = "nope";
    expect(validateMissal(m).join()).toMatch(/e1.*target/);
  });
  it("rejects phrase not found in target text", () => {
    const m = base(); m.sections[0].edits[0].phrase = "the Son";
    expect(validateMissal(m).join()).toMatch(/e1.*phrase/);
  });
  it("requires phrase for shortened/repetition/rubric", () => {
    const m = base(); delete m.sections[0].edits[0].phrase;
    expect(validateMissal(m).join()).toMatch(/e1.*phrase/);
  });
  it("requires replacement for rewritten/added/optional", () => {
    const m = base(); m.sections[0].edits[0] = { id: "e1", type: "rewritten", target: "b1", source: src };
    expect(validateMissal(m).join()).toMatch(/e1.*replacement/);
  });
  it("requires known destination for moved", () => {
    const m = base(); m.sections[0].edits[0] = { id: "e1", type: "moved", target: "b1", destination: "zz", source: src };
    expect(validateMissal(m).join()).toMatch(/e1.*destination/);
  });
  it("validates posture edits", () => {
    const m = base();
    m.sections[0].blocks[0].postures = ["genuflect"];
    m.sections[0].edits[0] = { id: "e1", type: "posture", target: "b1", icon: "genuflect", action: "change", to: "bow-profound", source: src };
    expect(validateMissal(m)).toEqual([]);
    m.sections[0].edits[0].icon = "kneel";
    expect(validateMissal(m).join()).toMatch(/e1.*icon/);
  });
  it("rejects duplicate ids and unknown block kinds", () => {
    const m = base(); m.sections[0].blocks[1].id = "b1"; m.sections[0].blocks[1].kind = "song";
    const errs = validateMissal(m).join();
    expect(errs).toMatch(/duplicate.*b1/); expect(errs).toMatch(/kind/);
  });
});
