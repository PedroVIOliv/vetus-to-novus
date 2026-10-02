import { describe, it, expect } from "vitest";
import { groupEdits } from "../src/scroll/groups.js";

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

