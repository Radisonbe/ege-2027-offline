import { useState, type FormEvent } from 'react';
import { questionById, subjects, topicById, topics } from '../data/catalog';
import { addDays, formatDate, localDate, recordAttempt, reviewIntervals } from '../domain/progress';
import type { LearningError, Question, SubjectId } from '../domain/types';
import { useStudy } from '../state/StudyProvider';
import { AnswerBox } from '../components/Quiz';
import { Badge, Button, Empty, Heading, Icon, Modal, Panel } from '../components/ui';

export function ErrorCard({ error }: { error: LearningError }) {
  const { mutate } = useStudy(), [details, setDetails] = useState(false), [retry, setRetry] = useState(false);
  const topic = topicById[error.topic], subject = subjects.find(s => s.id === topic?.subject);
  function update(patch: Partial<LearningError>) { mutate(state => ({ ...state, errors: state.errors.map(e => e.id === error.id ? { ...e, ...patch } : e) })); }
  return <Panel className="error-card"><div className="section-heading"><div className="error-meta"><Badge>{subject?.short}</Badge><Badge tone={error.status === 'не понял' ? 'amber' : 'teal'}>{error.status}</Badge><span className="small muted">{formatDate(error.date)} Повторить: {formatDate(error.due)}</span></div><span className="small muted">{topic?.title}</span></div><h3>{error.prompt}</h3><p className="wrong-answer">Мой ответ: {error.wrong}</p><div className="button-row"><Button variant="outline" onClick={() => setDetails(!details)}>{details ? 'Скрыть разбор' : 'Разобрать ошибку'}</Button><Button variant="secondary" onClick={() => setRetry(!retry)}><Icon name="review"/>Попробовать снова</Button><Button variant="ghost" onClick={() => update({ due: addDays(1) })}><Icon name="calendar"/>Перенести на завтра</Button></div>{details && <div className="error-details"><p><b>Правильный ответ:</b> {error.correct}</p><p><b>Причина:</b> {error.reason}</p><p><b>Правило:</b> {error.principle}</p><p>{error.solution}</p><label className="field-label">Моё понимание<select value={error.status} onChange={e => update({ status: e.target.value as LearningError['status'] })}>{['не понял', 'понял', 'закрепил'].map(status => <option key={status}>{status}</option>)}</select></label><label className="field-label">Моя заметка<textarea value={error.note} maxLength={10000} onChange={e => update({ note: e.target.value })}/></label></div>}{retry && <div className="self-recall"><ErrorRetry key={error.id} error={error}/></div>}</Panel>;
}
export function ErrorRetry({ error, onDone }: { error: LearningError; onDone?: (correct: boolean) => void }) {
  const { mutate } = useStudy(), [answer, setAnswer] = useState(''), [revealed, setRevealed] = useState(false), [saved, setSaved] = useState(false);
  const question = error.questionId ? questionById[error.questionId] : undefined;
  function schedule(correct: boolean) {
    mutate(previous => ({ ...previous, errors: previous.errors.map(item => {
      if (item.id !== error.id) return item;
      const stage = correct ? Math.min(item.stage + 1, 4) : 0;
      return { ...item, status: correct ? item.status === 'закрепил' ? 'закрепил' : 'понял' : 'не понял', stage, due: addDays(reviewIntervals[stage]) };
    }) }));
    onDone?.(correct);
  }
  function selfCheck(correct: boolean) {
    if (saved) return;
    const id = crypto.randomUUID();
    const recalled: Question = error.question ?? { ...questionById.f1, id: `manual:${error.id}`, topic: error.topic, prompt: error.prompt, answer: error.correct, answerType: 'text', hint: error.principle, solution: error.solution, principle: error.principle };
    mutate(previous => recordAttempt(previous, recalled, answer, correct, 'error', id));
    schedule(correct); setSaved(true);
  }
  if (question) return <AnswerBox question={question} context="error" onDone={schedule}/>;
  return <><Badge>Самопроверка</Badge><p>{error.prompt}</p><label className="field-label">Моё новое решение<textarea value={answer} maxLength={10000} disabled={revealed} onChange={e => setAnswer(e.target.value)}/></label>{revealed ? <div className="solution"><p><b>Правильный ответ:</b> {error.correct}</p><p>{error.principle}</p><p>{error.reason}</p><p className="small muted">Свободное решение оцениваешь ты. Это не автоматическая проверка.</p>{saved ? <p>Результат сохранён. Повторение назначено.</p> : <div className="button-row"><Button onClick={() => selfCheck(true)}>Разобрался, решил верно</Button><Button variant="outline" onClick={() => selfCheck(false)}>Пока нужна практика</Button></div>}</div> : <Button variant="outline" disabled={!answer.trim()} onClick={() => setRevealed(true)}>Сверить с разбором</Button>}</>;
}
function AddError({ close }: { close: () => void }) {
  const { mutate } = useStudy(), [subject, setSubject] = useState<SubjectId>('math'), [topic, setTopic] = useState('functions');
  const [fields, setFields] = useState({ prompt: '', wrong: '', correct: '', reason: '', principle: '', note: '' });
  function save(event: FormEvent) {
    event.preventDefault(); if (!fields.prompt.trim() || !fields.wrong.trim() || !fields.correct.trim()) return;
    const id = crypto.randomUUID();
    const question: Question = { ...questionById.f1, id: `manual:${id}`, subject, topic, answerType: 'text', prompt: fields.prompt, answer: fields.correct, hint: fields.principle, principle: fields.principle, solution: fields.principle, explanation: fields.principle, origin: 'custom', source: 'Личная запись', sourceType: 'training', wrongAnswers: undefined };
    const error: LearningError = { ...fields, id, topic, date: localDate(), status: 'не понял', due: addDays(1), stage: 0, solution: fields.principle, question };
    mutate(state => ({ ...state, errors: [...state.errors, error] })); close();
  }
  return <Modal title="Добавить ошибку" close={close}><p className="muted">Сохрани условие и место, где потерялся ход решения.</p><form onSubmit={save} className="error-form"><label className="field-label">Предмет<select value={subject} onChange={e => { const subject = e.target.value as SubjectId; setSubject(subject); setTopic(topics.find(t => t.subject === subject)!.id); }}>{subjects.map(s => <option value={s.id} key={s.id}>{s.short}</option>)}</select></label><label className="field-label">Тема<select value={topic} onChange={e => setTopic(e.target.value)}>{topics.filter(t => t.subject === subject).map(t => <option value={t.id} key={t.id}>{t.title}</option>)}</select></label>{([{ key: 'prompt', label: 'Исходное задание *', required: true }, { key: 'wrong', label: 'Мой ошибочный ответ *', required: true }, { key: 'correct', label: 'Правильный ответ *', required: true }, { key: 'reason', label: 'Причина ошибки' }, { key: 'principle', label: 'Правило или принцип' }, { key: 'note', label: 'Моя заметка' }] as const).map(field => <label className="field-label" key={field.key}>{field.label}<textarea value={fields[field.key]} required={'required' in field} maxLength={10000} onChange={e => setFields({ ...fields, [field.key]: e.target.value })}/></label>)}<Button type="submit" disabled={!fields.prompt.trim() || !fields.wrong.trim() || !fields.correct.trim()}>Сохранить ошибку</Button></form></Modal>;
}
export function ErrorsPage() {
  const { state } = useStudy(), [subject, setSubject] = useState('all'), [status, setStatus] = useState('all'), [adding, setAdding] = useState(false);
  const filtered = [...state.errors].reverse().filter(e => (subject === 'all' || topicById[e.topic]?.subject === subject) && (status === 'all' || e.status === status));
  return <><Heading eyebrow="РАЗОБРАТЬСЯ И ЗАКРЕПИТЬ" title="Мои ошибки" subtitle="Каждая ошибка — конкретный шаг, к которому можно вернуться." action={<Button onClick={() => setAdding(true)}><Icon name="plus"/>Добавить ошибку</Button>}/><div className="filter-row"><select aria-label="Предмет ошибок" value={subject} onChange={e => setSubject(e.target.value)}><option value="all">Все предметы</option>{subjects.map(s => <option value={s.id} key={s.id}>{s.title}</option>)}</select><select aria-label="Понимание ошибки" value={status} onChange={e => setStatus(e.target.value)}><option value="all">Все статусы</option>{['не понял', 'понял', 'закрепил'].map(s => <option key={s}>{s}</option>)}</select><span className="muted">Записей: {filtered.length}</span></div>{filtered.length ? <div className="error-list">{filtered.map(error => <ErrorCard key={error.id} error={error}/>)}</div> : <Panel><Empty title={state.errors.length ? 'По этим фильтрам ошибок нет' : 'Банк ошибок пока пуст'}>Ошибочные ответы из тренажёров попадут сюда автоматически. Можно добавить задание из тетради вручную.</Empty></Panel>}{adding && <AddError close={() => setAdding(false)}/>}</>;
}
