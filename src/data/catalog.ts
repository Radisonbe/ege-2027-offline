import reference from './reference.json';
import type { ContentNode, PythonBridge, Question, Sentence, Subject, SubjectId, Topic } from '../domain/types';

export const subjects: Subject[] = [
  { id: 'math', title: 'Профильная математика', short: 'Математика', description: 'От понятного правила к решению', symbol: 'ƒ', tone: 'teal' },
  { id: 'russian', title: 'Русский язык', short: 'Русский язык', description: 'Замечать связи и понимать язык', symbol: 'Аа', tone: 'purple' },
  { id: 'informatics', title: 'Информатика', short: 'Информатика', description: 'Логика, информация и алгоритмы', symbol: '01', tone: 'blue' },
  { id: 'python', title: 'Python', short: 'Python', description: 'Думать по шагам. Писать самому', symbol: '</>', tone: 'amber' },
];
export const topics: Topic[] = reference.topics.map((entry, index, all) => ({
  id: entry.id, title: entry.title, subject: entry.subject as SubjectId,
  description: entry.description ?? (entry.live ? 'Объяснение, пример и проверка' : 'В плане · теория ещё не добавлена'),
  order: all.slice(0, index).filter(t => t.subject === entry.subject).length + 1,
  materialStatus: entry.live ? 'ready' : 'planned', minutes: entry.minutes ?? undefined,
  subtopics: [], requires: [], related: [],
}));
export const topicById = Object.fromEntries(topics.map(t => [t.id, t]));
export const questions: Question[] = reference.questions.map(entry => {
  const raw = entry as typeof entry & { options?: string[]; wrong?: Record<string, string>; easy?: boolean };
  return {
    id: raw.id, topic: raw.topic, subject: topicById[raw.topic].subject, subtopic: null,
    difficulty: raw.easy ? 'easy' : 'unspecified', origin: 'custom',
    source: reference.metadata.url, sourceYear: null, sourceType: 'training', examTaskType: null,
    answerType: raw.kind as Question['answerType'], prompt: raw.prompt, answer: raw.answer,
    options: raw.options, hint: raw.hint, explanation: raw.solution, solution: raw.solution,
    principle: raw.principle, wrongAnswers: raw.wrong, easy: raw.easy, version: 1,
    requires: [], related: [],
  };
});
export const questionById = Object.fromEntries(questions.map(q => [q.id, q]));
export const theories = reference.theories as unknown as Record<string, ContentNode>;
export const sentences = reference.sentences as Sentence[];
export const bridges = reference.bridges as Record<string, PythonBridge>;
export const contentVersion = reference.metadata.sha256.slice(0, 12);
export const statuses = ['Не изучено', 'Изучаю', 'Нужна практика', 'Уверенно', 'Повторить'] as const;
export const intervals = [1, 3, 7, 14, 30] as const;
export const topicQuestions = (id: string) => questions.filter(q => q.topic === id && !q.easy);
export const easyQuestions = questions.filter(q => q.easy).slice(0, 5);
