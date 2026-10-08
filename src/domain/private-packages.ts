import type { Question, SubjectId } from './types';
import { validateQuestion } from './backup.ts';

export const MAX_PRIVATE_PACKAGE_BYTES = 20 * 1024 * 1024;
export interface PrivateTopic { id: string; subject: SubjectId; title: string }
export interface PrivateLesson { topic: string; title: string; paragraphs: string[] }
export interface PrivateLearningPackage {
  format: 'ege-private-learning-package'; packageVersion: 1;
  id: string; title: string; source: string;
  topics: PrivateTopic[]; lessons: PrivateLesson[]; questions: Question[];
}
export interface StoredPrivatePackage extends PrivateLearningPackage {
  distribution: 'private-import'; importedAt: string;
}
export class PrivatePackageError extends Error {}
const unsafeKeys = new Set(['__proto__', 'constructor', 'prototype']);
const fail = (): never => { throw new PrivatePackageError('Неподходящий личный пакет. Пакеты и прогресс не изменены.'); };
function record(value: unknown, keys: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fail();
  const object = value as Record<string, unknown>;
  if (Object.keys(object).length !== keys.length || keys.some(key => !Object.hasOwn(object, key))) fail();
  return object;
}
function text(value: unknown, limit = 100000): asserts value is string {
  if (typeof value !== 'string' || value.length > limit) fail();
}
function id(value: unknown): asserts value is string {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,99}$/.test(value) || unsafeKeys.has(value)) fail();
}
function list(value: unknown, limit: number): unknown[] {
  if (!Array.isArray(value) || value.length > limit) fail();
  return value as unknown[];
}
export function parsePrivatePackage(json: string): PrivateLearningPackage {
  if (new TextEncoder().encode(json).length > MAX_PRIVATE_PACKAGE_BYTES) fail();
  let raw: unknown;
  try { raw = JSON.parse(json, (key, value) => { if (unsafeKeys.has(key)) fail(); return value; }); }
  catch { return fail(); }
  const pack = record(raw, ['format', 'packageVersion', 'id', 'title', 'source', 'topics', 'lessons', 'questions']);
  if (pack.format !== 'ege-private-learning-package' || pack.packageVersion !== 1) fail();
  id(pack.id); text(pack.title, 500); text(pack.source, 2000);
  const topics = list(pack.topics, 1000), subjects = new Map<string, string>();
  for (const value of topics) {
    const topic = record(value, ['id', 'subject', 'title']);
    id(topic.id); text(topic.title, 500);
    if (!['math', 'russian', 'informatics', 'python'].includes(String(topic.subject)) || subjects.has(topic.id)) fail();
    subjects.set(topic.id, String(topic.subject));
  }
  const lessonTopics = new Set<string>();
  for (const value of list(pack.lessons, 1000)) {
    const lesson = record(value, ['topic', 'title', 'paragraphs']);
    id(lesson.topic); text(lesson.title, 500);
    if (!subjects.has(lesson.topic) || lessonTopics.has(lesson.topic)) fail();
    lessonTopics.add(lesson.topic);
    for (const paragraph of list(lesson.paragraphs, 1000)) text(paragraph);
  }
  const questionIds = new Set<string>();
  for (const value of list(pack.questions, 10000)) {
    let question: Question;
    try { question = validateQuestion(value); } catch { return fail(); }
    id(question.id); id(question.topic);
    if (subjects.get(question.topic) !== question.subject || questionIds.has(question.id)) fail();
    if ([...question.requires, ...question.related].some(topic => !subjects.has(topic))) fail();
    if (question.answerType === 'choice' && !question.options?.includes(question.answer)) fail();
    questionIds.add(question.id);
  }
  return raw as PrivateLearningPackage;
}

// No HTML, SVG, JavaScript, remote resource downloads or static catalogue merging.
// Text is inert data; source is an attribution string, never a fetch target.
export function preparePrivateImport(json: string, now = new Date()): StoredPrivatePackage {
  return { ...parsePrivatePackage(json), distribution: 'private-import', importedAt: now.toISOString() };
}
