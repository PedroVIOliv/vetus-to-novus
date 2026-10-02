import { missal } from "./content/missal.js";
import { buildSources, renderSources } from "./render/sources.js";

document.getElementById("sources").append(renderSources(buildSources(missal), document));
