/** Insert an editing key without changing parsing or grading rules. */
export function insertAnswerSymbol(text: string, start: number | null, end: number | null, symbol: '/' | '−', maxLength = -1) {
  const from = Math.max(0, Math.min(text.length, start ?? text.length));
  const to = Math.max(from, Math.min(text.length, end ?? from));
  const value = text.slice(0, from) + symbol + text.slice(to);
  if (maxLength >= 0 && value.length > maxLength) return null;
  return { value, cursor: from + 1 };
}
export function insertFractionSlash(text: string, start: number | null, end: number | null, maxLength = -1) {
  return insertAnswerSymbol(text, start, end, '/', maxLength);
}
