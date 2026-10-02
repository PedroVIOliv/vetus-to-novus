import { missal } from "./content/missal.js";
import { renderBook } from "./render/book.js";
import { startEngine, startOpening } from "./scroll/engine.js";

const desk = document.getElementById("desk");
const cover = document.createElement("div");
cover.className = "cover";
cover.innerHTML = `<div class="cover-front"><span class="cover-cross">✠</span><span class="cover-title">Missale Romanum</span></div><p class="scroll-hint">scroll</p>`;
const book = renderBook(missal, document);
desk.append(cover, book);

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
if (!reduced) startOpening(cover);
startEngine(missal, book, { reduced });
