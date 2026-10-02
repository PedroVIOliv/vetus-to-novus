import { missal } from "../src/content/missal.js";
import { validateMissal } from "../src/content/schema.js";

const errs = validateMissal(missal);
if (errs.length) {
  console.error(errs.join("\n"));
  process.exit(1);
}
console.log(`missal OK: ${missal.sections.length} sections, ${missal.sections.reduce((n, s) => n + s.edits.length, 0)} edits`);
