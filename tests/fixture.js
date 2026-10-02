const src = { vetus: "MR1962", novus: "MR1970", stage: "1970" };

export const fixture = { sections: [{
  id: "foot", title: "Prayers at the Foot of the Altar", initial: "I",
  blocks: [
    { id: "foot.rub", kind: "rubric", text: "The Priest makes the sign of the Cross, saying:" },
    { id: "foot.sign", kind: "prayer", speaker: "P", text: "In the name of the Father, ✠ and of the Son, and of the Holy Ghost. Amen.", postures: ["sign-cross"] },
    { id: "foot.ant", kind: "versicle", speaker: "P", text: "I will go in unto the altar of God." },
  ],
  edits: [
    { id: "e1", type: "rubric", target: "foot.rub", phrase: "makes the sign of the Cross", source: src },
    { id: "e2", type: "removed", target: "foot.ant", mark: "omit", source: src },
  ],
}]};
