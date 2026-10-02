import { blockOf, raggedPolygon, seededRandom } from "./util.js";

function mount(edit, ctx) {
  const first = blockOf(edit.target, ctx);
  let zone = first.closest(".tear-zone");
  if (!zone) {
    zone = document.createElement("div");
    zone.className = "tear-zone";
    first.before(zone);
    const piece = document.createElement("div");
    piece.className = "tear-piece";
    for (const id of [edit.target, ...(edit.targets ?? [])]) {
      const b = blockOf(id, ctx);
      b.classList.add("is-torn");
      piece.append(b);
    }
    const shape = raggedPolygon(seededRandom(edit.id), { edges: ["top", "bottom"], amp: 7, step: 2.5 });
    const hole = document.createElement("div");
    hole.className = "hole";
    hole.style.clipPath = shape;
    piece.style.clipPath = shape;
    zone.append(hole, piece);
  }
  return { hole: zone.querySelector(".hole"), piece: zone.querySelector(".tear-piece") };
}

export default {
  play(edit, ctx) {
    const { hole, piece } = mount(edit, ctx);
    const r = seededRandom(`${edit.id}:fall`);
    const dir = r() > 0.5 ? 1 : -1;
    return ctx.gsap.timeline({ paused: true })
      .set(hole, { opacity: 1 })
      .to(piece, { rotation: dir * 1.5, y: -6, duration: 0.25, ease: "power1.out" })
      .to(piece, { rotation: dir * (14 + r() * 10), rotationX: 25, x: dir * 80, y: "+=320", opacity: 0, duration: 1.1, ease: "power2.in" })
      .set(piece, { visibility: "hidden" });
  },
  finish(edit, ctx) {
    const { hole, piece } = mount(edit, ctx);
    ctx.gsap.set(hole, { opacity: 1 });
    ctx.gsap.set(piece, { opacity: 0, visibility: "hidden" });
  },
};
