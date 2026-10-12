import { describe, it, expect } from "vitest";
import { groupEdits } from "../src/scroll/groups.js";

describe("groupEdits", () => {
  it("groups edits by the passage they act on, keeping order", () => {
    const edits = [
      { id: "a", target: "b1" }, { id: "b", target: "b2", targets: ["b3", "b4"] },
      { id: "c", target: "b1" }, { id: "d", target: "b5" },
    ];
    expect(groupEdits(edits)).toEqual([
      { span: ["b1"], edits: [edits[0], edits[2]], strikeOnly: false },
      { span: ["b2", "b3", "b4"], edits: [edits[1]], strikeOnly: false },
      { span: ["b5"], edits: [edits[3]], strikeOnly: false },
    ]);
  });
  it("splits a block's strike-throughs into their own passage, played first", () => {
    const edits = [
      { id: "add", type: "added", target: "b1" }, { id: "s1", type: "shortened", target: "b1" },
      { id: "bow", type: "posture", target: "b1" }, { id: "s2", type: "repetition", target: "b1" },
    ];
    expect(groupEdits(edits)).toEqual([
      { span: ["b1"], edits: [edits[1], edits[3]], strikeOnly: true },
      { span: ["b1"], edits: [edits[0], edits[2]], strikeOnly: false },
    ]);
  });
});

