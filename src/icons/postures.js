const P = {
  stand: '<circle cx="12" cy="4" r="2"/><path d="M12 6v8M12 9l-3 3M12 9l3 3M12 14l-2.5 7M12 14l2.5 7"/>',
  kneel: '<circle cx="11" cy="4" r="2"/><path d="M11 6v7M11 9l3 2M11 13h-4l-2 6M11 13l3 6h4"/>',
  genuflect: '<circle cx="11" cy="4" r="2"/><path d="M11 6v8M11 9l3 2M11 14l4 1v5M11 14l-3 6h-2"/>',
  "bow-profound": '<circle cx="17" cy="10" r="2"/><path d="M15 11L8 9M11 10l2 4M8 9v6l-1 6M8 15l2 6"/>',
  "bow-head": '<circle cx="13" cy="5" r="2"/><path d="M12 7v7M12 9l-3 3M12 9l3 3M12 14l-2.5 7M12 14l2.5 7"/>',
  "strike-breast": '<circle cx="12" cy="4" r="2"/><path d="M12 6v8M12 9l-3 3M12 9l2 1 1-1M12 14l-2.5 7M12 14l2.5 7M17 7l-1.5 1.5M18.5 9l-2 .5"/>',
  "sign-cross": '<path d="M12 3v18M6 9h12"/>',
  "face-altar": '<path d="M4 20h16M6 20v-6h12v6M12 14V9M10 11h4"/><circle cx="12" cy="5" r="1.4"/>',
};

export const postureSvg = (name) =>
  `<svg class="ico" viewBox="0 0 24 24" role="img" aria-label="${name.replace("-", " ")}">${P[name]}</svg>`;
