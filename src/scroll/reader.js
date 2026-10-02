// Decides when each passage is edited: only after the reader has had it in the middle of the
// screen long enough to read it, one passage at a time, in page order.

// The band of the screen (fractions of its height) where a passage counts as being read.
export const READ_BAND = [0.12, 0.88];
const MS_PER_WORD = 120; // skimming pace, about 500 words a minute
const MIN_MS = 800;
const MAX_MS = 3500;

export const readTime = (words) => Math.min(MAX_MS, Math.max(MIN_MS, words * MS_PER_WORD));

export function zoneState(rect, vh) {
  if (rect.bottom <= 0) return "passed";
  if (rect.top < vh * READ_BAND[1] && rect.bottom > vh * READ_BAND[0]) return "reading";
  return "away";
}

// passages: [{ controller, need (ms), measure() → { top, bottom } }], in page order.
export function createReader(passages) {
  const ps = passages.map((p) => ({ ...p, dwell: 0, zone: "away" }));
  let playing = null;
  return {
    tick(dt, vh) {
      if (playing && playing.controller.state === "played") playing = null;
      for (const p of ps) {
        const c = p.controller;
        if (c.state === "played") continue;
        p.zone = zoneState(p.measure(), vh);
        if (p.zone === "passed") {
          c.leave();
          if (playing === p) playing = null;
        } else if (c.state === "idle" && p.zone === "reading") {
          p.dwell += dt;
        }
      }
      if (!playing) {
        const next = ps.find((p) => p.controller.state === "idle" && p.zone === "reading" && p.dwell >= p.need);
        if (next) {
          playing = next;
          next.controller.trigger();
        }
      }
    },
  };
}
