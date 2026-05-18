const MEMO_MAX_H = 400; // ~6 rows (6 * 21px line-height + 16px padding)

export function resizeTitle(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

export function resizeMemo(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = `${Math.min(el.scrollHeight, MEMO_MAX_H)}px`;
  el.style.overflowY = el.scrollHeight > MEMO_MAX_H ? "auto" : "hidden";
}
