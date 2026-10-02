import { missal } from "./content/missal.js";
import { renderBook } from "./render/book.js";

document.getElementById("desk").append(renderBook(missal, document));
