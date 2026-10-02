import { describe, it, expect } from "vitest";
import { buildSources, renderSources } from "../src/render/sources.js";
import { fixture } from "./fixture.js";

describe("sources", () => {
  it("has exactly one entry per edit, in page order", () => {
    const entries = buildSources(fixture);
    expect(entries.map((e) => e.editId)).toEqual(["e1", "e2"]);
    expect(entries[1]).toMatchObject({ sectionTitle: "Prayers at the Foot of the Altar", type: "removed", stage: "1970" });
  });
  it("renders a table row per entry", () => {
    const el = renderSources(buildSources(fixture), document);
    expect(el.querySelectorAll("tbody tr")).toHaveLength(2);
  });
  it("flags entries whose confidence is not high", () => {
    const m = structuredClone(fixture);
    m.sections[0].edits[0].source.confidence = "medium";
    const el = renderSources(buildSources(m), document);
    expect(el.querySelector("tbody tr").textContent).toContain("to be verified");
  });
});
