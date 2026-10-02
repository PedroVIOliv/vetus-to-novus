import strike from "./strike.js";
import redact from "./redact.js";
import paste from "./paste.js";
import add from "./add.js";
import tear from "./tear.js";
import optional from "./optional.js";
import move from "./move.js";
import posture from "./posture.js";

const MAP = { shortened: strike, repetition: strike, rubric: redact, rewritten: paste, added: add, removed: tear, optional, moved: move, posture };
export const getEffect = (type) => MAP[type];
