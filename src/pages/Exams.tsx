import { useState } from 'react';
import { exams, examTasks, examDiagnostics } from '../data/exam/catalog';
import { topicById } from '../data/catalog';
import {
  emptyExam, mapKey, coverage, selectExamTasks, startExam, editExam, answerExam, examStats,
  type ExamDefinition, type ExamPosition, type ExamTask, type ExamItem, type ExamProgress, type ExamSession,
} from '../domain/exam';
import { useStudy } from '../state/StudyProvider';
import { Button, Panel, Heading } from '../components/ui';
import { MathText } from '../components/MathText';
import { QuestionMetadata } from '../components/QuestionMetadata';
import { AnswerInput } from '../components/AnswerInput';

const formats: Record<string, string> = {
  decimal: 'Число', integer: 'Целое число', 'digits-set': 'Цифры номеров', bitstring: 'Двоичная строка',
  text: 'Краткий ответ', pair: 'Два числа', extended: 'Развёрнутое решение', essay: 'Сочинение',
};
type Go = (route: string) => void;
type Update = (fn: (progress: ExamProgress) => ExamProgress) => void;

function SessionSummary({ session, progress }: { session: ExamSession; progress: ExamProgress }) {
  const map = progress.maps[session.mapKey];
  const answered = session.items.filter(i => i.attempts.length).length;
  const correct = session.items.filter(i => i.attempts[0]?.correct && !i.attempts[0]?.assisted).length;
  return <Panel>
    <h2>Тренировка завершена</h2>
    <p>Проверено {answered} из {session.items.length}. Верно самостоятельно с первой попытки: {correct}.</p>
    <p>Ответы с подсказкой отмечены отдельно. Это результат тренировки, не балл ЕГЭ по шкале 100.</p>
    {[...new Set(session.items.map(i => progress.snapshots[i.key].positionId))].map(id => {
      const items = session.items.filter(i => progress.snapshots[i.key].positionId === id);
      return <p key={id}>№{map.positions.find(p => p.id === id)?.number}: {items.filter(i => i.attempts[0]?.correct && !i.attempts[0]?.assisted).length} / {items.length} с первой самостоятельной попытки.</p>;
    })}
  </Panel>;
}

function TaskFeedback({ task, item }: { task: ExamTask; item: ExamItem }) {
  const first = item.attempts[0], last = item.attempts.at(-1), q = task.question;
  if (!last) return null;
  return <div className={last.correct ? 'feedback success' : 'feedback retry'} role="status">
    <strong>{last.answer !== item.answer ? 'Ответ изменён — проверь новый вариант.' : last.correct ? 'Ответ верный.' : 'Пока неверно. Можно исправить.'}</strong>
    <p>Первый ответ: {first.correct ? 'верно' : 'ошибка'}{first.assisted ? ' · с помощью' : ' · самостоятельно'}. Исправления не меняют первый результат.</p>
    <details>
      <summary>Разбор и типичная ошибка</summary>
      <p><MathText enabled={q.subject === 'math'}>{q.explanation}</MathText></p>
      <p>Ответ: {q.answer}</p>
      <p>{q.wrongAnswers?.default ?? 'Проверь каждое ограничение и формат ответа; не заменяй полный разбор одним догаданным результатом.'}</p>
    </details>
  </div>;
}

function SessionNavigation({ session, locked, onIndex, onFinish }: {
  session: ExamSession; locked: boolean; onIndex: (index: number) => void; onFinish: () => void;
}) {
  return <>
    <div className="exam-step-buttons">
      {session.items.map((item, n) => <Button key={item.key} variant={n === session.index ? 'primary' : 'outline'} disabled={locked}
        onClick={() => onIndex(n)} aria-label={`К заданию ${n + 1}`}>{n + 1}{item.attempts.length ? ' ✓' : ''}</Button>)}
    </div>
    <div className="button-row">
      <Button variant="outline" disabled={locked || session.index === 0} onClick={() => onIndex(session.index - 1)}>Назад</Button>
      <Button disabled={locked || session.index === session.items.length - 1} onClick={() => onIndex(session.index + 1)}>Дальше</Button>
      <Button variant="outline" disabled={locked} onClick={onFinish}>Завершить тренировку</Button>
    </div>
  </>;
}

function SessionScreen({ session, progress, locked, update, go, message, setMessage }: {
  session: ExamSession; progress: ExamProgress; locked: boolean; update: Update; go: Go;
  message: string; setMessage: (message: string) => void;
}) {
  const map = progress.maps[session.mapKey], item = session.items[session.index], task = progress.snapshots[item.key];
  const q = task.question, position = map.positions.find(p => p.id === task.positionId)!;
  const change = (fn: (s: ExamSession) => ExamSession) => update(p => ({ ...p, sessions: p.sessions.map(s => s.id === session.id ? fn(s) : s) }));
  function check() {
    try { update(p => answerExam(p, session.id, session.index, crypto.randomUUID())); setMessage(''); }
    catch (e) { setMessage(String(e instanceof Error ? e.message : e)); }
  }
  return <>
    <Heading eyebrow="ЭКЗАМЕНАЦИОННАЯ ТРЕНИРОВКА" title={map.title} subtitle="Авторские задачи по проектной структуре ФИПИ-2027. Это не полный вариант ЕГЭ."/>
    <Button variant="ghost" onClick={() => go('exam')}>К номерам и истории</Button>
    {session.completedAt ? <SessionSummary session={session} progress={progress}/> : <Panel className="exam-session">
      <div className="section-heading"><h2>№{position.number} · {position.title}</h2><span>{session.index + 1} / {session.items.length}</span></div>
      <QuestionMetadata question={q}/>
      <p className="small muted">{formats[task.format]} · {q.difficulty === 'easy' ? 'Базовое' : q.difficulty === 'hard' ? 'Сложное' : 'Среднее'}. Максимум по позиции: {position.maxPoints} первичный балл. Оценка текущей тренировки не переносится в учебные мини-тесты и банк ошибок.</p>
      <p className="question-prompt exam-prompt"><MathText enabled={q.subject === 'math'}>{q.prompt}</MathText></p>
      <label className="field-label" htmlFor="exam-answer">Ответ экзаменационного задания</label>
      <AnswerInput id="exam-answer" value={item.answer} maxLength={300} aria-describedby="exam-answer-format"
        numeric={['decimal', 'integer'].includes(task.format)} allowFraction={false} disabled={locked}
        onValueChange={value => { setMessage(''); update(p => editExam(p, session.id, session.index, value)); }}/>
      <p id="exam-answer-format" className="small muted">{task.format === 'decimal' ? 'Экзаменационный ответ: целое число или конечная десятичная дробь.' : task.format === 'integer' ? 'Экзаменационный ответ: целое число.' : formats[task.format]}</p>
      <div className="button-row">
        <Button disabled={locked || !item.answer.trim()} onClick={check}>Проверить ответ</Button>
        <Button variant="outline" disabled={locked} onClick={() => change(s => ({ ...s, items: s.items.map((v, i) => i === s.index ? { ...v, assisted: true } : v) }))}>
          Показать подсказку{!item.attempts.length ? ' (с помощью)' : ''}
        </Button>
      </div>
      {message && <p role="alert">{message}</p>}
      {item.assisted && <p className="callout">{q.hint}{!item.attempts.length && ' Первый ответ будет отмечен как выполненный с помощью.'}</p>}
      <TaskFeedback task={task} item={item}/>
      <div className="button-row">{position.topics.map(id => <Button key={id} variant="ghost" onClick={() => go('topic/' + id)}>Повторить теорию: {topicById[id]?.title ?? id}</Button>)}</div>
      <SessionNavigation session={session} locked={locked}
        onIndex={index => { setMessage(''); change(s => ({ ...s, index })); }}
        onFinish={() => change(s => ({ ...s, completedAt: new Date().toISOString() }))}/>
    </Panel>}
  </>;
}

function PositionGrid({ map, stats, locked, selected, onSelect }: {
  map: ExamDefinition; stats: ReturnType<typeof examStats>; locked: boolean; selected: string[];
  onSelect: (position: ExamPosition, checked: boolean) => void;
}) {
  return <div className="exam-position-grid">
    {coverage(map, examTasks).map(({ position, count, status }) => <label className="exam-position" key={position.id}>
      <input type="checkbox" aria-label={'Выбрать №' + position.number} disabled={!count || locked} checked={selected.includes(position.id)} onChange={e => onSelect(position, e.target.checked)}/>
      <strong>№{position.number} · {position.title}</strong>
      <span>{formats[position.format]} · максимум {position.maxPoints} · задач: {count}</span><b>{status}</b>
      {stats[position.id] && <span>Верно впервые самостоятельно: {stats[position.id].firstCorrect} / {stats[position.id].answered - stats[position.id].assisted}; с помощью: {stats[position.id].assisted}; исправлено: {stats[position.id].corrected}</span>}
    </label>)}
  </div>;
}

function SessionHistory({ progress, go }: { progress: ExamProgress; go: Go }) {
  return <Panel>
    <h2>История экзаменационных тренировок</h2>
    {!progress.sessions.length && <p>Пока нет экзаменационных занятий. Обычный учебный прогресс сохранён отдельно.</p>}
    {[...progress.sessions].reverse().map(s => <div className="exam-history" key={s.id}>
      <span>{progress.maps[s.mapKey].title} · {s.items.length} задач · {new Date(s.startedAt).toLocaleDateString('ru')} · {s.completedAt ? 'завершена' : 'не завершена'}</span>
      <Button variant="outline" onClick={() => go('exam/session/' + s.id)}>{s.completedAt ? 'Итог' : 'Продолжить'}</Button>
    </div>)}
  </Panel>;
}

export function ExamsPage({ go, sessionId }: { go: Go; sessionId?: string }) {
  const { state, mutate, storageError, replacing } = useStudy(), progress = state.exam ?? emptyExam();
  const [subject, setSubject] = useState('math'), [mode, setMode] = useState<'number' | 'custom'>('number');
  const [selected, setSelected] = useState<string[]>([]), [count, setCount] = useState(5);
  const [order, setOrder] = useState<'numbers' | 'mixed'>('numbers'), [topic, setTopic] = useState('');
  const [level, setLevel] = useState(''), [message, setMessage] = useState('');
  const map = exams.find(m => m.subject === subject), session = progress.sessions.find(s => s.id === sessionId);
  const stats = examStats(progress, map ? mapKey(map) : undefined), locked = !!storageError || replacing;
  const update: Update = fn => mutate(s => ({ ...s, exam: fn(s.exam ?? emptyExam()) }));
  function start(acceptShort = false) {
    if (!map) return;
    try {
      const seed = crypto.randomUUID();
      const result = selectExamTasks(map, examTasks, selected, count, order, seed, mode === 'custom' && topic ? [topic] : [], mode === 'custom' && level ? [level] : []);
      if (!result.items.length) { setMessage('Подходящих задач нет. Измени выбор.'); return; }
      if (result.shortfall && !acceptShort) {
        setMessage(`Запрошено ${count}, доступно ${result.available}. Можно начать ${result.items.length} без подмены заданий.`); return;
      }
      const id = crypto.randomUUID();
      update(p => startExam(p, map, result.items, mode, seed, id)); go('exam/session/' + id);
    } catch (e) { setMessage(String(e instanceof Error ? e.message : e)); }
  }
  if (examDiagnostics.length) return <Panel><h2>ЕГЭ / Пробники</h2>{examDiagnostics.map(m => <p key={m}>{m}</p>)}</Panel>;
  if (sessionId && !session) return <Panel><p>Сеанс не найден.</p><Button onClick={() => go('exam')}>К тренировкам</Button></Panel>;
  if (session) return <SessionScreen session={session} progress={progress} locked={locked} update={update} go={go} message={message} setMessage={setMessage}/>;
  return <>
    <Heading eyebrow="ПРОЕКТЫ ФИПИ-2027" title="ЕГЭ / Пробники" subtitle="Тренируем экзаменационные позиции отдельно от школьных тем. Материалы авторские; полное покрытие пока не достигнуто."/>
    <Panel>
      <label className="field-label" htmlFor="exam-subject">Экзамен</label>
      <select id="exam-subject" value={subject} onChange={e => { setSubject(e.target.value); setSelected([]); setTopic(''); setMessage(''); }}>
        {exams.map(m => <option key={m.id} value={m.subject}>{m.title}</option>)}
      </select>
      {map && <><p>Проект 2027 · {map.positions.length} заданий · {map.durationMinutes} минут · максимум {map.maxPoints} первичных баллов.</p><a href={map.source} target="_blank" rel="noreferrer">Проект ФИПИ: архив документов (сеть нужна только для ссылки)</a></>}
    </Panel>
    <Panel>
      <h2>Тренировка</h2>
      <div className="button-row">
        <Button variant={mode === 'number' ? 'primary' : 'outline'} onClick={() => { setMode('number'); setSelected(selected.slice(0, 1)); setMessage(''); }}>По номеру</Button>
        <Button variant={mode === 'custom' ? 'primary' : 'outline'} onClick={() => { setMode('custom'); setMessage(''); }}>Своя тренировка</Button>
      </div>
      <p className="small muted">Выбери доступные номера ниже. Подсказка до первого ответа помечает результат «с помощью».</p>
      {map && <PositionGrid map={map} stats={stats} locked={locked} selected={selected} onSelect={(p, checked) => {
        setSelected(checked ? mode === 'number' ? [p.id] : [...selected, p.id] : selected.filter(id => id !== p.id)); setMessage('');
      }}/>}
      <div className="exam-config">
        <label>Количество заданий<input aria-label="Количество экзаменационных заданий" type="number" min="1" max="50" value={count} onChange={e => { setCount(Number(e.target.value)); setMessage(''); }}/></label>
        {mode === 'custom' && <>
          <label>Порядок<select aria-label="Порядок экзаменационных заданий" value={order} onChange={e => setOrder(e.target.value as typeof order)}>
            <option value="numbers">По номерам</option><option value="mixed">Перемешанный (seed сохраняется)</option>
          </select></label>
          <label>Связанная тема<select aria-label="Тема экзаменационной тренировки" value={topic} onChange={e => { setTopic(e.target.value); setMessage(''); }}>
            <option value="">Все связанные темы</option>{[...new Set(examTasks.filter(t => selected.includes(t.positionId)).map(t => t.question.topic))].map(id => <option key={id} value={id}>{topicById[id]?.title ?? id}</option>)}
          </select></label>
          <label>Сложность<select aria-label="Сложность экзаменационной тренировки" value={level} onChange={e => { setLevel(e.target.value); setMessage(''); }}>
            <option value="">Все доступные уровни</option><option value="easy">Базовое</option><option value="medium">Среднее</option><option value="hard">Сложное</option>
          </select></label>
        </>}
      </div>
      <Button disabled={locked || !selected.length} onClick={() => start()}>Начать экзаменационную тренировку</Button>
      {message && <div role="status"><p>{message}</p>{message.startsWith('Запрошено') && <Button disabled={locked} variant="outline" onClick={() => start(true)}>Начать доступный набор</Button>}</div>}
    </Panel>
    <Panel><h2>Полный пробник</h2><p>В разработке. Для настоящего пробника необходимо проверенное задание и способ оценки для каждой обязательной позиции. Сейчас есть только ограниченные наборы. Сочинение, развёрнутые доказательства и файловые задания не подменяются короткими ответами.</p><Button disabled>Полный пробник недоступен</Button></Panel>
    <SessionHistory progress={progress} go={go}/>
  </>;
}
