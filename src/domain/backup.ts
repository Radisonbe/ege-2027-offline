import type { StudyState } from './types';

export const MAX_BACKUP_BYTES = 20 * 1024 * 1024;
export interface ProgressBackup { format: 'ege-progress-backup'; backupVersion: 1; appVersion: string; createdAt: string; data: StudyState }
export class BackupError extends Error {}
const fail = (path: string): never => { throw new BackupError(`Файл не подходит: проверь поле «${path}». Текущий прогресс не изменён.`); };
const forbidden = new Set(['__proto__', 'constructor', 'prototype']);
type ObjectValue = Record<string, unknown>;
function object(value: unknown, path: string, required: string[], optional: string[] = []): ObjectValue {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fail(path);
  const record = value as ObjectValue, allowed = new Set([...required, ...optional]);
  if (required.some(key => !Object.hasOwn(record, key)) || Object.keys(record).some(key => !allowed.has(key) || forbidden.has(key))) return fail(path);
  return record;
}
function dictionary(value: unknown, path: string): ObjectValue {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fail(path);
  const record = value as ObjectValue;
  if (Object.keys(record).length > 100000 || Object.keys(record).some(key => forbidden.has(key))) return fail(path);
  return record;
}
function string(value: unknown, path: string, id = false) {
  if (typeof value !== 'string' || value.length > (id ? 500 : 100000) || (id && (!value.trim() || forbidden.has(value)))) fail(path);
}
function choice(value: unknown, path: string, allowed: readonly unknown[]) { if (!allowed.includes(value)) fail(path); }
function integer(value: unknown, path: string, min: number, max: number) { if (!Number.isInteger(value) || (value as number) < min || (value as number) > max) fail(path); }
function date(value: unknown, path: string) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return fail(path);
  const parsed = new Date(value + 'T12:00:00Z');
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) fail(path);
}
function instant(value: unknown, path: string) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return fail(path);
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) fail(path);
}
function array(value: unknown, path: string, validate: (item: unknown, path: string) => void, max = 100000): unknown[] {
  if (!Array.isArray(value) || value.length > max) return fail(path);
  value.forEach((item, index) => validate(item, `${path}[${index}]`)); return value;
}
function strings(value: unknown, path: string) { array(value, path, (item, name) => string(item, name), 1000); }
function unique(items: unknown[], path: string) {
  const ids = items.map(item => (item as ObjectValue).id);
  if (new Set(ids).size !== ids.length) fail(path + '.id');
}
function question(value: unknown, path: string) {
  const q = object(value, path, ['id', 'subject', 'topic', 'subtopic', 'difficulty', 'origin', 'source', 'sourceYear', 'sourceType', 'examTaskType', 'answerType', 'prompt', 'answer', 'hint', 'explanation', 'solution', 'principle', 'version', 'requires', 'related'], ['options', 'wrongAnswers', 'easy']);
  for (const key of ['id', 'topic']) string(q[key], path + '.' + key, true);
  for (const key of ['source', 'prompt', 'answer', 'hint', 'explanation', 'solution', 'principle']) string(q[key], path + '.' + key);
  for (const key of ['subtopic', 'examTaskType']) if (q[key] !== null) string(q[key], path + '.' + key);
  choice(q.subject, path + '.subject', ['math', 'russian', 'informatics', 'python']);
  choice(q.difficulty, path + '.difficulty', ['unspecified', 'easy', 'medium', 'hard']);
  choice(q.origin, path + '.origin', ['official', 'generated', 'reconstructed', 'custom']);
  choice(q.sourceType, path + '.sourceType', ['training', 'exam', 'lesson']);
  choice(q.answerType, path + '.answerType', ['number', 'text', 'choice', 'selection']);
  integer(q.version, path + '.version', 1, Number.MAX_SAFE_INTEGER);
  if (q.sourceYear !== null) integer(q.sourceYear, path + '.sourceYear', 1900, 2200);
  strings(q.requires, path + '.requires'); strings(q.related, path + '.related');
  if (q.options !== undefined) strings(q.options, path + '.options');
  if (q.easy !== undefined) choice(q.easy, path + '.easy', [true, false]);
  if (q.wrongAnswers !== undefined) for (const [key, message] of Object.entries(dictionary(q.wrongAnswers, path + '.wrongAnswers'))) string(message, path + '.wrongAnswers.' + key);
}

export function validateStudyState(value: unknown): StudyState {
  const s = object(value, 'data', ['app', 'schemaVersion', 'contentVersion', 'topics', 'attempts', 'errors', 'reviews', 'activity', 'settings', 'updatedAt']);
  if (s.app !== 'ege-local-center') fail('data.app');
  if (s.schemaVersion !== 1) throw new BackupError('Версия схемы данных пока не поддерживается. Текущий прогресс не изменён.');
  string(s.contentVersion, 'data.contentVersion', true); instant(s.updatedAt, 'data.updatedAt');
  const topics = dictionary(s.topics, 'data.topics');
  for (const [key, value] of Object.entries(topics)) {
    const t = object(value, 'data.topics.' + key, ['topic', 'status', 'note'], ['last']);
    string(t.topic, 'topic', true); if (t.topic !== key) fail('data.topics.' + key);
    choice(t.status, 'status', ['Не изучено', 'Изучаю', 'Нужна практика', 'Уверенно', 'Повторить']); string(t.note, 'note');
    if (t.last !== undefined) date(t.last, 'last');
  }
  const attempts = array(s.attempts, 'data.attempts', (value, path) => {
    const a = object(value, path, ['id', 'questionId', 'questionVersion', 'topic', 'answer', 'correct', 'date', 'at', 'context']);
    for (const key of ['id', 'questionId', 'topic']) string(a[key], path + '.' + key, true);
    string(a.answer, path + '.answer'); choice(a.correct, path + '.correct', [true, false]);
    integer(a.questionVersion, path + '.questionVersion', 1, Number.MAX_SAFE_INTEGER);
    date(a.date, path + '.date'); instant(a.at, path + '.at');
    choice(a.context, path + '.context', ['practice', 'test', 'easy', 'session', 'error']);
  }); unique(attempts, 'data.attempts');
  const attemptById = new Map(attempts.map(a => [(a as ObjectValue).id, a as ObjectValue]));
  const errors = array(s.errors, 'data.errors', (value, path) => {
    const e = object(value, path, ['id', 'topic', 'prompt', 'wrong', 'correct', 'reason', 'principle', 'solution', 'note', 'date', 'status', 'due', 'stage'], ['questionId', 'attemptId', 'question']);
    for (const key of ['id', 'topic']) string(e[key], path + '.' + key, true);
    for (const key of ['prompt', 'wrong', 'correct', 'reason', 'principle', 'solution', 'note']) string(e[key], path + '.' + key);
    for (const key of ['questionId', 'attemptId']) if (e[key] !== undefined) string(e[key], path + '.' + key, true);
    date(e.date, path + '.date'); date(e.due, path + '.due'); integer(e.stage, path + '.stage', 0, 4);
    choice(e.status, path + '.status', ['не понял', 'понял', 'закрепил']);
    if (e.question !== undefined) question(e.question, path + '.question');
    if (e.attemptId !== undefined) {
      const attempt = attemptById.get(e.attemptId);
      if (!attempt || attempt.correct !== false || attempt.topic !== e.topic || (e.questionId !== undefined && attempt.questionId !== e.questionId)) fail(path + '.attemptId');
    }
  }); unique(errors, 'data.errors');
  const errorIds = new Set(errors.map(e => (e as ObjectValue).id));
  for (const [key, value] of Object.entries(dictionary(s.reviews, 'data.reviews'))) {
    const r = object(value, 'data.reviews.' + key, ['id', 'targetType', 'targetId', 'due', 'stage'], ['last']);
    string(r.id, 'review.id', true); string(r.targetId, 'review.targetId', true);
    if (r.id !== key) fail('data.reviews.' + key);
    choice(r.targetType, 'review.targetType', ['topic', 'error']); date(r.due, 'review.due'); integer(r.stage, 'review.stage', 0, 4);
    if (r.last !== undefined) date(r.last, 'review.last');
    if (r.targetType === 'error' && !errorIds.has(r.targetId)) fail('review.targetId');
  }
  const activity = array(s.activity, 'data.activity', (value, path) => {
    const a = object(value, path, ['id', 'date', 'topic', 'kind']);
    string(a.id, path + '.id', true); string(a.topic, path + '.topic', true); date(a.date, path + '.date'); choice(a.kind, path + '.kind', ['answer', 'lesson', 'review']);
  }); unique(activity, 'data.activity');
  const settings = object(s.settings, 'data.settings', ['theme'], ['lastTopic']);
  choice(settings.theme, 'settings.theme', ['light', 'dark']); if (settings.lastTopic !== undefined) string(settings.lastTopic, 'settings.lastTopic', true);
  // Historical IDs are deliberately not restricted to the current content catalogue.
  return value as StudyState;
}

export function serializeBackup(state: StudyState, now = new Date()): string {
  const data = validateStudyState(JSON.parse(JSON.stringify(state)));
  const text = JSON.stringify({ format: 'ege-progress-backup', backupVersion: 1, appVersion: '0.2.0', createdAt: now.toISOString(), data } satisfies ProgressBackup, null, 2);
  if (new TextEncoder().encode(text).length > MAX_BACKUP_BYTES) throw new BackupError('Данные превышают текущий лимит резервной копии 20 МБ. Прогресс не изменён.');
  return text;
}
export function parseBackup(text: string): ProgressBackup {
  if (new TextEncoder().encode(text).length > MAX_BACKUP_BYTES) throw new BackupError('Файл больше 20 МБ. Текущий прогресс не изменён.');
  let value: unknown;
  try { value = JSON.parse(text, (key, item) => { if (forbidden.has(key)) throw new Error('Unsafe key'); return item; }); }
  catch { throw new BackupError('Не удалось прочитать JSON. Файл повреждён или имеет неподходящий формат. Текущий прогресс не изменён.'); }
  const backup = object(value, 'backup', ['format', 'backupVersion', 'appVersion', 'createdAt', 'data']);
  if (backup.format !== 'ege-progress-backup' || backup.backupVersion !== 1) throw new BackupError('Это не поддерживаемая резервная копия ЕГЭ 2027. Текущий прогресс не изменён.');
  string(backup.appVersion, 'appVersion', true); instant(backup.createdAt, 'createdAt'); validateStudyState(backup.data);
  return value as ProgressBackup;
}
