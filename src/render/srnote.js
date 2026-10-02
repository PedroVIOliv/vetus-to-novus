export const POSTURE_LABEL = {
  kneel: "kneel", genuflect: "genuflect", "bow-profound": "profound bow", "bow-head": "bow of the head",
  "strike-breast": "strike the breast", "sign-cross": "sign of the cross", stand: "stand", "face-altar": "facing the altar",
};

const join = (blocks) => blocks.map((b) => b.text).join(" ");

export function srNote(e) {
  switch (e.type) {
    case "removed": return "Removed in 1970.";
    case "rewritten": return `Replaced in 1970 by: ${join(e.replacement)}`;
    case "shortened": return `Shortened in 1970: “${e.phrase}” omitted.`;
    case "repetition": return `Repetition reduced in 1970: “${e.phrase}” omitted.`;
    case "rubric": return `Rubric dropped in 1970: “${e.phrase}”.`;
    case "optional": return `Made one option among ${e.options.length} in 1970.`;
    case "moved": return "Moved in 1970.";
    case "added": return `Added in 1970: ${join(e.replacement)}`;
    case "posture":
      return e.action === "change"
        ? `Posture changed in 1970: ${POSTURE_LABEL[e.icon]} → ${POSTURE_LABEL[e.to]}.`
        : `Posture removed in 1970: ${POSTURE_LABEL[e.icon]}.`;
  }
}
