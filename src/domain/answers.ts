import type { Question } from './types.ts';

export type AnswerResult = { valid: false; message: string } | { valid: true; correct: boolean; normalized: string };
export function normalizeText(value: string): string {
  return value.trim().toLocaleLowerCase('ru-RU').replaceAll('ё', 'е').replaceAll('−', '-').replace(/\s+/g, '').replaceAll(',', '.');
}
export function parseNumber(value: string): number | null {
  const text = value.trim().replaceAll('−', '-').replaceAll(',', '.');
  const decimal = '[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)';
  if (new RegExp(`^${decimal}$`).test(text)) {
    const number = Number(text); return Number.isFinite(number) ? number : null;
  }
  const fraction = text.match(new RegExp(`^(${decimal})\\s*/\\s*(${decimal})$`));
  if (!fraction || Number(fraction[2]) === 0) return null;
  const result = Number(fraction[1]) / Number(fraction[2]);
  return Number.isFinite(result) ? result : null;
}
export function checkAnswer(question: Question, value: string): AnswerResult {
  if (!value.trim()) return { valid: false, message: 'Сначала введи ответ.' };
  if (question.answerType === 'number') {
    const answer = parseNumber(value), expected = parseNumber(question.answer);
    if (answer === null) return { valid: false, message: 'Здесь нужно число. Можно ввести десятичную дробь или дробь вида 1/4. Исправь ввод — попытка пока не учитывается.' };
    if (expected === null) return { valid: false, message: 'Ответ задания требует проверки. Попытка не сохранена.' };
    return { valid: true, correct: Math.abs(answer - expected) <= 1e-9 * Math.max(1, Math.abs(expected)), normalized: String(answer) };
  }
  if (question.answerType === 'choice' && !question.options?.includes(value)) return { valid: false, message: 'Выбери один из предложенных вариантов.' };
  if (question.id === 'b2' && !/^[01]+$/.test(value.trim())) return { valid: false, message: 'Двоичная запись состоит только из 0 и 1. Исправь ввод — попытка пока не учитывается.' };
  return { valid: true, correct: normalizeText(value) === normalizeText(question.answer), normalized: normalizeText(value) };
}
