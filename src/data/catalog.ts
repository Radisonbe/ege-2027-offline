import { topics as referenceTopics, theories as referenceTheories, sentences as referenceSentences, bridges as referenceBridges } from './reference.json';
import taxonomyData from './taxonomy.json';
import { contentFingerprint, loadContentPackages, validateTaxonomy } from '../domain/content';
import type { ContentNode, PythonBridge, Question, Sentence, Subject, SubjectId, Topic } from '../domain/types';

export const subjects: Subject[] = [
  { id: 'math', title: 'Профильная математика', short: 'Математика', description: 'От понятного правила к решению', symbol: 'ƒ', tone: 'teal' },
  { id: 'russian', title: 'Русский язык', short: 'Русский язык', description: 'Замечать связи и понимать язык', symbol: 'Аа', tone: 'purple' },
  { id: 'informatics', title: 'Информатика', short: 'Информатика', description: 'Логика, информация и алгоритмы', symbol: '01', tone: 'blue' },
  { id: 'python', title: 'Python', short: 'Python', description: 'Думать по шагам. Писать самому', symbol: '</>', tone: 'amber' },
];
export const topics: Topic[] = referenceTopics.map((entry, index, all) => ({
  id: entry.id, title: entry.title, subject: entry.subject as SubjectId,
  description: entry.description ?? (entry.live ? 'Объяснение, пример и проверка' : 'В плане · теория ещё не добавлена'),
  order: all.slice(0, index).filter(t => t.subject === entry.subject).length + 1,
  materialStatus: entry.live ? 'ready' : 'planned', minutes: entry.minutes ?? undefined,
  subtopics: [], requires: [], related: [],
}));
export const topicById = Object.fromEntries(topics.map(t => [t.id, t]));
const taxonomyResult = (() => {
  try { return { taxonomy: validateTaxonomy(taxonomyData, topics), diagnostics: [] as string[] }; }
  catch (error) { return { taxonomy: { schemaVersion: 1 as const, subtopics: [], skills: [] }, diagnostics: [error instanceof Error ? error.message : 'Ошибка структуры тем'] }; }
})();
export const taxonomy = taxonomyResult.taxonomy;
export const skills = taxonomy.skills, subtopics = taxonomy.subtopics;
export const skillById = Object.fromEntries(skills.map(s => [s.id,s]));
export const subtopicById = Object.fromEntries(subtopics.map(s => [s.id,s]));
for (const topic of topics) topic.subtopics = subtopics.filter(s => s.topic === topic.id).map(s => s.id);
// Eager glob includes every validated bundled package before the first offline launch.
const packageFiles = import.meta.glob('./banks/*.json', { eager: true, import: 'default' });
const bank = loadContentPackages(Object.keys(packageFiles).sort().map(key => packageFiles[key]), topics, taxonomy);
export const questions: Question[] = bank.questions;
export const contentDiagnostics = [...taxonomyResult.diagnostics, ...bank.diagnostics];
export const questionById = Object.fromEntries(questions.map(q => [q.id, q]));
export const theories = referenceTheories as unknown as Record<string, ContentNode>;
export const sentences = referenceSentences as Sentence[];
export const bridges = referenceBridges as Record<string, PythonBridge>;
export const contentVersion = contentFingerprint(questions, taxonomy);
export const statuses = ['Не изучено', 'Изучаю', 'Нужна практика', 'Уверенно', 'Повторить'] as const;
export const intervals = [1, 3, 7, 14, 30] as const;
export const topicQuestions = (id: string) => questions.filter(q => q.topic === id && !q.easy);
export const easyQuestions = questions.filter(q => q.easy).slice(0, 5);
