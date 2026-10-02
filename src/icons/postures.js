// Woodcut-style silhouettes of the priest in alb and chasuble, in profile facing right.
const HEAD = '<circle cx="16" cy="5.4" r="2.7"/>';
const VESTED = '<path d="M12.6 9 Q16 7.8 19.4 9 L21.2 20.2 Q16 21.6 10.8 20.2 Z"/><path d="M11.8 20.6 L20.2 20.6 L21.4 29 L10.6 29 Z"/>';

const P = {
  stand: HEAD + VESTED,
  "bow-head": '<circle cx="19.2" cy="8.2" r="2.6"/><path d="M12.6 9.2 Q16.6 7.9 20.6 10.4 L21.2 20.2 Q16 21.6 10.8 20.2 Z"/><path d="M11.8 20.6 L20.2 20.6 L21.4 29 L10.6 29 Z"/>',
  "bow-profound": '<circle cx="27.4" cy="14.6" r="2.6"/><path d="M11.2 18.6 L18.8 19.4 L26 16.4 L23.4 10.2 Q17 10.4 11.2 18.6 Z"/><path d="M11.4 19 L19 19.8 L20.4 29 L10.6 29 Z"/>',
  genuflect: '<circle cx="14.6" cy="5" r="2.7"/><path d="M11.2 8.6 Q14.6 7.4 18 8.6 L19.6 18.6 Q14.6 20 9.6 18.6 Z"/><path d="M10 19 L19.4 19 L25.4 19.6 Q26.6 20 26.4 21.4 L25.6 28.8 L22.6 28.8 L23 22.8 L15.6 23.2 L14.2 29 L5.4 29 L6.2 26.6 L10.8 26.2 Z"/>',
  kneel: '<circle cx="15.4" cy="8.6" r="2.7"/><path d="M12 12.2 Q15.4 11 18.8 12.2 L20.2 22 Q15.4 23.4 10.6 22 Z"/><path d="M18.6 13.6 Q22.6 15 21.8 17.6 L20.4 17.6 Q20.8 15.8 18.4 15.4 Z"/><path d="M10.8 22.4 L20 22.4 L20.4 29 L5.6 29 L6.6 26.6 L11 26.2 Z"/><path d="M4.4 29.4 H22.4 V30.8 H4.4 Z"/>',
  "sign-cross": '<path d="M12.4 3 h7.2 l-2 10.2 L28 11.4 v9.2 l-10.4-1.8 2 10.2 h-7.2 l2-10.2 L4 20.6 v-9.2 l10.4 1.8 Z"/>',
  "face-altar": '<path d="M15.1 5 h1.8 v4 h3 v1.6 h-3 v8.6 h-1.8 v-8.6 h-3 v-1.6 h3 Z"/><path d="M9 12.6 h1.6 v6.6 h-1.6 Z M21.4 12.6 h1.6 v6.6 h-1.6 Z"/><path d="M9.8 10.4 q1 1.2 0 2 q-1-.8 0-2 Z M22.2 10.4 q1 1.2 0 2 q-1-.8 0-2 Z"/><path d="M4.6 19.4 h22.8 v1.8 H4.6 Z M6.2 21.2 h19.6 v7.6 H6.2 Z"/>',
};

// Front view, so the bent arm and the fist on the chest can be seen. A mask cuts a thin
// paper-coloured gap around them, as a woodcut would, so they don't merge with the vestments.
const SB_BODY = '<circle cx="16" cy="5.2" r="2.7"/><path d="M11.8 8.8 Q16 7.6 20.2 8.8 L22.6 20.6 Q16 22.2 9.4 20.6 Z"/><path d="M10.6 21 L21.4 21 L22.2 29 L9.8 29 Z"/>';
const SB_ARM = "M11.6 9.1 L13 9.7 L10.8 14.6 L14.4 12.3 L14.8 13.6 L9.9 16.4 Q8.8 16.4 9.1 15.2 Z";
const SB_FIST = "M14.5 12.1 Q14.8 11.5 15.6 11.6 L16.8 11.8 Q17.4 11.9 17.3 12.6 L17.1 13.8 Q17 14.5 16.3 14.4 L15.1 14.3 Q14.4 14.2 14.4 13.5 Z";
let maskCount = 0;
function strikeBreast() {
  const id = `sb-gap-${++maskCount}`;
  const cut = (d) => `<path d="${d}" fill="black" stroke="black" stroke-width="1.1" stroke-linejoin="round"/>`;
  return `<defs><mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="32" height="32">`
    + `<rect width="32" height="32" fill="white"/>${cut(SB_ARM)}${cut(SB_FIST)}</mask></defs>`
    + `<g mask="url(#${id})">${SB_BODY}</g><path d="${SB_ARM}"/><path d="${SB_FIST}"/>`;
}

export const postureSvg = (name) =>
  `<svg class="ico" viewBox="0 0 32 32" role="img" aria-label="${name.replace("-", " ")}">${name === "strike-breast" ? strikeBreast() : P[name]}</svg>`;
