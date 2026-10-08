import type { Question, Skill, SubjectId, Subtopic, Topic } from './types.ts';
import { validateQuestion } from './backup.ts';
import { checkAnswer } from './answers.ts';

export interface ContentPackage { schemaVersion: 1; id: string; subject: SubjectId; questions: Question[] }
export interface Taxonomy { schemaVersion: 1; subtopics: Subtopic[]; skills: Skill[] }
export class ContentError extends Error {}
const problem = (message: string): never => { throw new ContentError(message); };
const badIds = new Set(['__proto__', 'prototype', 'constructor']);
const id = (value: unknown) => typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,199}$/.test(value) && !badIds.has(value);
const label = (value: unknown) => typeof value === 'string' && !!value.trim() && value.length <= 1000;
function object(value: unknown, keys: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return problem('Неверная структура учебного пакета');
  const record = value as Record<string, unknown>;
  if (Object.keys(record).length !== keys.length || keys.some(key => !Object.hasOwn(record, key))) problem('Неизвестное или отсутствующее поле пакета');
  return record;
}
function links(value: unknown, entities: Set<string>, owner: string) {
  if (!Array.isArray(value) || value.length > 1000 || new Set(value).size !== value.length || value.some(v => !id(v) || !entities.has(v) || v === owner)) problem('Некорректная связь: ' + owner);
}
export function validateTaxonomy(value: unknown, topics: Topic[]): Taxonomy {
  const data = object(value, ['schemaVersion', 'subtopics', 'skills']);
  if (data.schemaVersion !== 1 || !Array.isArray(data.subtopics) || !Array.isArray(data.skills)) problem('Версия таксономии не поддерживается');
  const topicIds = new Set(topics.map(t => t.id)), all = new Set(topicIds), subtopicById = new Map<string, Subtopic>();
  if (topicIds.size !== topics.length || topics.some(t=>!id(t.id)||!['math','russian','informatics','python'].includes(t.subject))) problem('Некорректные ID тем');
  for (const raw of data.subtopics as unknown[]) {
    const s = object(raw, ['id', 'topic', 'title']);
    if (!id(s.id) || !topicIds.has(String(s.topic)) || !label(s.title) || all.has(String(s.id))) problem('Некорректная подтема');
    all.add(String(s.id)); subtopicById.set(String(s.id), raw as Subtopic);
  }
  for (const raw of data.skills as unknown[]) {
    const s = object(raw, ['id', 'topic', 'subtopic', 'title', 'requires', 'related', 'remediates']);
    if (!id(s.id) || all.has(String(s.id)) || !label(s.title) || subtopicById.get(String(s.subtopic))?.topic !== s.topic) problem('Некорректный навык');
    all.add(String(s.id));
  }
  const skillList = data.skills as Skill[], skills = new Map(skillList.map(s => [s.id, s]));
  for (const s of skillList) for (const field of ['requires', 'related', 'remediates'] as const) links(s[field], new Set([...topicIds, ...skills.keys()]), s.id);
  const active = new Set<string>(), done = new Set<string>();
  function visit(key: string) {
    if (active.has(key)) problem('Цикл необходимых навыков: ' + key);
    if (done.has(key)) return;
    active.add(key); for (const required of skills.get(key)?.requires ?? []) if (skills.has(required)) visit(required);
    active.delete(key); done.add(key);
  }
  for (const key of skills.keys()) visit(key);
  return value as Taxonomy;
}
export function validateContentPackage(value: unknown, topics: Topic[], taxonomy: Taxonomy): ContentPackage {
  const pack = object(value, ['schemaVersion', 'id', 'subject', 'questions']);
  if (pack.schemaVersion !== 1 || !id(pack.id) || !['math','russian','informatics','python'].includes(String(pack.subject)) || !Array.isArray(pack.questions) || pack.questions.length > 100000) problem('Неверный учебный пакет');
  const topicMap = new Map(topics.map(t => [t.id, t])), subtopics = new Map(taxonomy.subtopics.map(s => [s.id, s])), skills = new Map(taxonomy.skills.map(s => [s.id, s]));
  const entities = new Set([...topicMap.keys(), ...skills.keys()]), seen = new Set<string>();
  for (const value of pack.questions as unknown[]) {
    const q = validateQuestion(value);
    if (!id(q.id) || seen.has(q.id) || q.subject !== pack.subject || topicMap.get(q.topic)?.subject !== q.subject || subtopics.get(q.subtopic ?? '')?.topic !== q.topic) problem('Неверная тема/ID задания: ' + q.id);
    if (q.origin === 'private-import') problem('Личный материал нельзя включить во встроенный банк');
    if (!q.prompt.trim() || !q.answer.trim() || !q.source.trim() || !q.skills?.length || new Set(q.skills).size !== q.skills.length || q.skills.some(s => skills.get(s)?.topic !== q.topic || skills.get(s)?.subtopic !== q.subtopic)) problem('Не заполнено или неизвестно поле задания: ' + q.id);
    for (const field of ['requires', 'related', 'remediates'] as const) links(q[field] ?? [], entities, q.id);
    if (q.answerType === 'choice' && (!q.options || new Set(q.options).size !== q.options.length || !q.options.includes(q.answer) || q.options.length < 2)) problem('Неверные варианты: ' + q.id);
    if (q.answerType === 'number' && !checkAnswer(q, q.answer).valid) problem('Неверный формат правильного ответа: ' + q.id);
    seen.add(q.id);
  }
  return value as ContentPackage;
}
export function loadContentPackages(values: unknown[], topics: Topic[], taxonomy: Taxonomy, strict = false) {
  const questions: Question[] = [], diagnostics: string[] = [], ids = new Set<string>(), packageIds = new Set<string>();
  for (const value of values) {
    try {
      const pack = validateContentPackage(value, topics, taxonomy);
      if (packageIds.has(pack.id) || pack.questions.some(q => ids.has(q.id))) problem('Повторяющийся ID пакета или вопроса: ' + pack.id);
      packageIds.add(pack.id); pack.questions.forEach(q => ids.add(q.id)); questions.push(...pack.questions);
    } catch (error) { if (strict) throw error; diagnostics.push(error instanceof Error ? error.message : 'Ошибка пакета'); }
  }
  return { questions, diagnostics };
}
export const originLabels: Record<Question['origin'], string> = { generated:'Сгенерированное тренировочное', official:'Официальное', custom:'Собственный учебный материал', reconstructed:'Восстановленное', 'private-import':'Личное' };
// Synchronous version marker for progress, not a security or licence checksum.
// Public-content and SW checks independently use SHA-256.
export function contentFingerprint(questions: Question[], taxonomy: Taxonomy): string {
  const text = JSON.stringify({ questions, taxonomy });
  let hash = 2166136261;
  for (let index = 0; index < text.length; index++) hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
  return 'bank-' + (hash >>> 0).toString(16).padStart(8,'0');
}
