import { useEffect, useState } from 'react';
import { easyQuestions, questions, questionById, topicById } from '../data/catalog';
import { useStudy } from '../state/StudyProvider';
import { AnswerBox, Quiz } from '../components/Quiz';
import { Badge, Button, Heading, Icon, Panel } from '../components/ui';
import { ErrorRetry } from './Errors';

export function EasyPage({ go }: { go: (page: string) => void }) {
  const { state } = useStudy();
  const [items] = useState(() => { const all = questions.filter(q => q.easy), offset = state.attempts.length % all.length; return [...all.slice(offset), ...all.slice(0, offset)].slice(0, 5); });
  return <><Heading eyebrow="БЕЗ СПЕШКИ" title="Лёгкое повторение" subtitle="Пять коротких вопросов. Без таймера и длинных условий."/><Quiz items={items.length ? items : easyQuestions} context="easy" title="По одному маленькому шагу"/><div className="lesson-continue"><Button variant="ghost" onClick={() => go('home')}>На главную</Button></div></>;
}
export function SessionPage({ go }: { go: (page: string) => void }) {
  const { state } = useStudy(), [remaining, setRemaining] = useState(900), [paused, setPaused] = useState(false), [step, setStep] = useState(0), [results, setResults] = useState<Record<number, boolean>>({});
  const [selection] = useState(() => {
    const old = Object.values(state.topics).filter(t => t.status !== 'Не изучено').sort((a, b) => (state.reviews[`topic:${a.topic}`]?.due ?? '9999').localeCompare(state.reviews[`topic:${b.topic}`]?.due ?? '9999'));
    const recall = questions.find(q => q.topic === old[0]?.topic && !q.easy) ?? questionById.e1;
    const all = questions.filter(q => !q.easy && q.id !== recall.id && ['percent', 'functions', 'binary', 'encoding', 'unionwords'].includes(q.topic));
    const offset = state.attempts.length % all.length;
    return { recall, practice: [...all.slice(offset), ...all.slice(0, offset)].slice(0, 3), error: [...state.errors].filter(e => e.status !== 'закрепил').sort((a, b) => a.due.localeCompare(b.due))[0], hasOld: !!old.length };
  });
  useEffect(() => {
    if (paused || step === 5) return;
    let previous = Date.now();
    const timer = window.setInterval(() => { const now = Date.now(); setRemaining(value => Math.max(0, value - (now - previous) / 1000)); previous = now; }, 1000);
    return () => window.clearInterval(timer);
  }, [paused, step]);
  const labels = ['Вспомнить', 'Задание 1', 'Задание 2', 'Задание 3', 'Моя ошибка', 'Итог'];
  return <><Heading eyebrow="КОРОТКАЯ СЕССИЯ" title="У меня есть 15 минут" subtitle="Одно повторение, три задания и работа над ошибкой." action={<div className="session-clock"><Icon name="clock"/><b>{Math.floor(remaining / 60)}:{String(Math.floor(remaining % 60)).padStart(2, '0')}</b>{step < 5 && <Button variant="ghost" aria-label={paused ? 'Продолжить таймер' : 'Приостановить таймер'} onClick={() => setPaused(!paused)}><Icon name={paused ? 'play' : 'pause'}/></Button>}</div>}/><div className="session-steps">{labels.map((label, i) => <span className={i === step ? 'active' : i < step ? 'completed' : ''} key={label}>{i < step ? <Icon name="check" size={15}/> : i + 1}<small>{label}</small></span>)}</div>{remaining === 0 && step < 5 && <p className="callout">15 минут прошли. Можно закончить текущий шаг без спешки — ответы уже сохраняются.</p>}{step === 0 && !selection.hasOld && <p className="callout">Изученных тем пока нет. Начнём с короткой разминки; в следующих сессиях здесь появится повторение твоей темы.</p>}{step < 4 && <Panel><Badge>{step === 0 ? 'Вспомнить самостоятельно' : topicById[selection.practice[step - 1].topic].title}</Badge><AnswerBox key={step} question={step === 0 ? selection.recall : selection.practice[step - 1]} context="session" onDone={correct => setResults(old => ({ ...old, [step]: correct }))}/></Panel>}{step === 4 && (selection.error ? <Panel><h3>Вернёмся к одной ошибке</h3><ErrorRetry error={state.errors.find(e => e.id === selection.error.id) ?? selection.error} onDone={correct => setResults(old => ({ ...old, [4]: correct }))}/></Panel> : <Panel><h3>В банке пока нет незакреплённых ошибок</h3><p className="muted">Закончим коротким вопросом на базу.</p><AnswerBox question={questionById.e3} context="session" onDone={correct => setResults(old => ({ ...old, [4]: correct }))}/></Panel>)}{step < 5 ? <div className="session-actions"><Button disabled={!Object.hasOwn(results, step)} onClick={() => setStep(step + 1)}>{step === 4 ? 'Подвести итог' : 'Следующий шаг'}<Icon name="arrow"/></Button><Button variant="ghost" onClick={() => setStep(5)}>Завершить раньше</Button></div> : <Panel className="session-summary"><div className="empty-icon"><Icon name="check" size={28}/></div><h2>Небольшое занятие — уже шаг вперёд</h2><p>Пройдено шагов: <b>{Object.keys(results).length} из 5</b>. Решено верно: <b>{Object.values(results).filter(Boolean).length}</b>.</p><p className="muted">Попытки сохранены по темам. Ошибочные ответы ждут разбора, а повторения назначены на завтра.</p><div className="button-row"><Button onClick={() => go('home')}>На главную</Button><Button variant="outline" onClick={() => go('errors')}>Разобрать ошибки</Button></div></Panel>}</>;
}
