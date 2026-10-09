import type { AttemptContext, Question, StudyState, TopicProgress, TopicStatus } from './types.ts';

export const reviewIntervals = [1, 3, 7, 14, 30];
export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function addDays(days: number, date = localDate()): string {
  const value = new Date(date + 'T12:00:00'); value.setDate(value.getDate() + days); return localDate(value);
}
export function formatDate(date?: string): string { return date ? new Date(date + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : '—'; }
export function emptyState(contentVersion: string): StudyState {
  return { app: 'ege-local-center', schemaVersion: 2, contentVersion, topics: {}, attempts: [], errors: [], reviews: {}, activity: [], adaptive: { sessions: [], exposures: [] }, settings: { theme: 'light' }, updatedAt: new Date().toISOString() };
}
export function topicProgress(state: StudyState, topic: string): TopicProgress {
  return state.topics[topic] ?? { topic, status: 'Не изучено', note: '' };
}
export function topicAttemptCounts(state:StudyState,topic:string) {
  const control=state.attempts.filter(a=>a.topic===topic);
  return {control:control.length,correct:control.filter(a=>a.correct).length,incorrect:control.filter(a=>!a.correct).length,training:(state.training??[]).filter(a=>a.topic===topic).length};
}
export function recordAttempt(state: StudyState, question: Question, answer: string, correct: boolean, context: AttemptContext, id: string, now = new Date(), sessionId?: string): StudyState {
  const date = localDate(now), progress = topicProgress(state, question.topic), reviewKey = `topic:${question.topic}`;
  const next = { ...state, topics: { ...state.topics, [question.topic]: { ...progress, status: correct ? (progress.status === 'Не изучено' ? 'Изучаю' : progress.status) : 'Нужна практика' as TopicStatus, last: date } },
    attempts: [...state.attempts, { id, questionId: question.id, questionVersion: question.version, topic: question.topic, answer, correct, context, date, at: now.toISOString(), ...(question.subject ? { subject: question.subject, subtopic: question.subtopic, skills: question.skills ?? [] } : {}), ...(sessionId ? { sessionId } : {}) }],
    reviews: { ...state.reviews }, errors: [...state.errors],
    activity: [...state.activity, { id, topic: question.topic, date, kind: 'answer' as const }],
    settings: { ...state.settings, lastTopic: question.topic }, updatedAt: now.toISOString() };
  if (!correct) {
    next.reviews[reviewKey] = { id: reviewKey, targetType: 'topic', targetId: question.topic, due: addDays(1, date), stage: 0 };
    next.errors.push({ id: `error:${id}`, attemptId: id, questionId: question.id, topic: question.topic, prompt: question.prompt, wrong: answer, correct: question.answer,
      reason: question.wrongAnswers?.[answer.trim()] ?? 'Нужно ещё раз проверить этот шаг.', principle: question.principle, solution: question.solution, note: '', date, status: 'не понял', due: addDays(1, date), stage: 0, question });
  } else if (!next.reviews[reviewKey]) next.reviews[reviewKey] = { id: reviewKey, targetType: 'topic', targetId: question.topic, due: addDays(1, date), stage: 0 };
  return next;
}
export function stats(state: StudyState, today = localDate()) {
  const dates = new Set(state.activity.map(a => a.date));
  let date = dates.has(today) ? today : addDays(-1, today), streak = 0;
  while (dates.has(date)) { streak++; date = addDays(-1, date); }
  return { started: Object.values(state.topics).filter(t => t.status !== 'Не изучено').length,
    mastered: Object.values(state.topics).filter(t => t.status === 'Уверенно').length,
    due: new Set([...Object.values(state.reviews).filter(r => r.targetType === 'topic' && r.due <= today).map(r => r.targetId), ...Object.values(state.topics).filter(t => t.status === 'Повторить').map(t => t.topic)]).size,
    solved: new Set(state.attempts.filter(a => a.correct).map(a => a.questionId)).size,
    errors: state.attempts.filter(a => !a.correct).length, attempts: state.attempts.length, streak };
}
