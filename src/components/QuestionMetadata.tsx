import { originLabels } from '../domain/content';
import type { Question } from '../domain/types';
import { skillById, subtopicById } from '../data/catalog';

export function QuestionMetadata({ question }: { question: Question }) {
  let sourceLink = false;
  try { sourceLink = ['https:', 'http:'].includes(new URL(question.source).protocol); } catch { /* Description, not a URL. */ }
  return <details className="question-metadata"><summary>О задании</summary><dl>
    <dt>Происхождение</dt><dd>{originLabels[question.origin]}</dd>
    <dt>ID</dt><dd>{question.id}</dd>
    <dt>Подтема</dt><dd>{subtopicById[question.subtopic ?? '']?.title ?? 'Не указана'}</dd>
    <dt>Навыки</dt><dd>{question.skills?.map(id => skillById[id]?.title ?? id).join(', ') || 'Не указаны'}</dd>
    <dt>Сложность</dt><dd>{{easy:'Начальная',medium:'Средняя',hard:'Повышенная',unspecified:'Не определена'}[question.difficulty]}</dd>
    <dt>Источник</dt><dd>{sourceLink ? <a href={question.source} target="_blank" rel="noreferrer">{question.source}</a> : question.source || 'Не указан'}</dd>
    {question.sourceYear && <><dt>Год</dt><dd>{question.sourceYear}</dd></>}
  </dl></details>;
}
