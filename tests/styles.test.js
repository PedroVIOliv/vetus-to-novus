import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

describe("base.css", () => {
  it("has every @import before the first rule (later imports are ignored by browsers)", () => {
    const lines = readFileSync("src/styles/base.css", "utf8").split("\n").map((l) => l.trim()).filter(Boolean);
    const firstRule = lines.findIndex((l) => !l.startsWith("@import"));
    const lateImports = lines.slice(firstRule).filter((l) => l.startsWith("@import"));
    expect(lateImports).toEqual([]);
  });
});
