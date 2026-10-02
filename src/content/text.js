// Index of the nth (1-based) occurrence of `phrase` in `text`, or -1.
export function nthIndex(text, phrase, n = 1) {
  let i = -1;
  for (let k = 0; k < n; k++) {
    i = text.indexOf(phrase, i + 1);
    if (i < 0) return -1;
  }
  return i;
}
