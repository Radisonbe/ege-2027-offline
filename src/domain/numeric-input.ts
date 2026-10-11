/** Insert only the requested character; parsing and grading remain separate. */
export function insertFractionSlash(text: string, start: number | null, end: number | null, maxLength = -1) {
  const from = Math.max(0, Math.min(text.length, start ?? text.length));
  const to = Math.max(from, Math.min(text.length, end ?? from));
  const value = text.slice(0, from) + '/' + text.slice(to);
  if (maxLength >= 0 && value.length > maxLength) return null;
  return { value, cursor: from + 1 };
}
