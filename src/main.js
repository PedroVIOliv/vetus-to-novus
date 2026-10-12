import { missal } from "./content/missal.js";
import { renderBook } from "./render/book.js";
import { startEngine, startOpening } from "./scroll/engine.js";

const desk = document.getElementById("desk");
const stage = document.createElement("div");
stage.className = "stage";
const book = renderBook(missal, document);
stage.append(book);
desk.append(stage);

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
if (!reduced) {
  const cover = document.createElement("div");
  cover.className = "cover";
  cover.innerHTML = `<span class="cover-cross">✠</span><span class="cover-title">Missale Romanum</span>`;
  const hint = document.createElement("p");
  hint.className = "scroll-hint";
  hint.textContent = "scroll";
  stage.append(cover);
  document.body.append(hint);
  startOpening({ desk, stage, book, cover, hint });
}
startEngine(missal, book, { reduced });
