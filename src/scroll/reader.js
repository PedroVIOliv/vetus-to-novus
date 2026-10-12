// Decides when each passage is edited: only after the reader has read to its end, one passage
// at a time, in page order.

// A passage is only edited once its last line has risen above READ_DONE (fraction of the
// screen height from the top). A strike leaves the text readable, so a passage that is only
// struck through can be edited sooner.
export const READ_DONE = 0.2;
export const READ_DONE_STRIKE = 0.4;

// passages: [{ controller, strikeOnly, measure() → { top, bottom } }], in page order.
export function createReader(passages) {
  let playing = null;
  return {
    tick(vh) {
      if (playing && playing.controller.state === "played") playing = null;
      const ready = [];
      for (const p of passages) {
        const c = p.controller;
        if (c.state === "played") continue;
        const { bottom } = p.measure();
        if (bottom <= 0) {
          c.leave();
          if (playing === p) playing = null;
        } else if (c.state === "idle" && bottom <= vh * (p.strikeOnly ? READ_DONE_STRIKE : READ_DONE)) {
          ready.push(p);
        }
      }
      if (!playing && ready.length) {
        playing = ready[0];
        playing.controller.trigger();
      }
    },
  };
}
