import { describe, it, expect } from "vitest";
import { groupEdits, triggerRange } from "../src/scroll/groups.js";

describe("groupEdits", () => {
  it("groups edits by the passage they act on, keeping order", () => {
    const edits = [
      { id: "a", target: "b1" }, { id: "b", target: "b2", targets: ["b3", "b4"] },
      { id: "c", target: "b1" }, { id: "d", target: "b5" },
    ];
    expect(groupEdits(edits)).toEqual([
      { span: ["b1"], edits: [edits[0], edits[2]] },
      { span: ["b2", "b3", "b4"], edits: [edits[1]] },
      { span: ["b5"], edits: [edits[3]] },
    ]);
  });
});

describe("triggerRange", () => {
  const vh = 1000;
  it("a short passage plays once all of it is in the top half of the screen", () => {
    // passage spans 5000–5200 in the document: its bottom reaches mid-screen at scroll 4700
    expect(triggerRange({ top: 5000, bottom: 5200, vh }).start).toBe(4700);
  });
  it("a passage taller than half the screen plays once its start is near the top", () => {
    // spans 5000–6200: bottom-at-midline would be 5700, past the point the start leaves view
    expect(triggerRange({ top: 5000, bottom: 6200, vh }).start).toBe(4850);
  });
  it("never starts before the page top and ends when the passage leaves the top", () => {
    const r = triggerRange({ top: 100, bottom: 200, vh });
    expect(r.start).toBe(0);
    expect(r.end).toBe(200);
  });
});
