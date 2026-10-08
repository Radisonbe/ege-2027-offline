import { lazy, Suspense, useId, useRef, useState, type ReactNode } from 'react';
import { checkAnswer, normalizeText } from '../domain/answers';
import { recordAttempt } from '../domain/progress';
import { answerReview } from '../domain/adaptive';
import type { AttemptContext, Question } from '../domain/types';
import { useStudy } from '../state/StudyProvider';
import { Badge, Button, Icon, Panel, ProgressBar } from './ui';
import { QuestionMetadata } from './QuestionMetadata';
import { MathText } from './MathText';
import {resumeCodeDraftIndex} from '../domain/code-learning';
const CodeExercise=lazy(()=>import('./CodeExercise').then(m=>({default:m.CodeExercise})));

export function AnswerBox(props: {
  question: Question; context?: AttemptContext; onDone?: (correct: boolean) => void;
  customInput?: ReactNode; customAnswer?: string; customCorrect?: boolean;
  adaptiveSessionId?: string; initial?: { answer: string; result: boolean | null };
}) {
  return props.question.answerType==='code'?<Suspense fallback={<p role="status">Открываем редактор…</p>}><CodeExercise {...props}/></Suspense>:<TheoryAnswerBox {...props}/>;
}
function TheoryAnswerBox({question,context='test',onDone,customInput,customAnswer,customCorrect,adaptiveSessionId,initial}:Parameters<typeof AnswerBox>[0]) {
  const { mutate } = useStudy();
  const [answer, setAnswer] = useState(initial?.answer ?? ''), [result, setResult] = useState<boolean | null>(initial?.result ?? null), [formatError, setFormatError] = useState('');
  const [solution, setSolution] = useState(false), [hint, setHint] = useState(false), [hadAttempt, setHadAttempt] = useState(initial?.result !== undefined && initial.result !== null);
  const submitted = useRef(initial?.result !== undefined && initial.result !== null), id = useId();
  const math=question.subject==='math'||question.subject==='informatics';
  const current = customAnswer ?? answer;
  function submit() {
    if (submitted.current) return;
    const validation = customCorrect !== undefined ? { valid: true as const, correct: customCorrect } : checkAnswer(question, current);
    if (!validation.valid) { setFormatError(validation.message); return; }
    submitted.current = true;
    const correct = validation.correct;
    const attemptId = crypto.randomUUID();
    mutate(state => adaptiveSessionId ? answerReview(state, adaptiveSessionId, current, correct, attemptId) : recordAttempt(state, question, current, correct, context, attemptId));
    setFormatError(''); setResult(correct); setHadAttempt(true); onDone?.(correct);
  }
  return <div className="answer-box"><QuestionMetadata question={question}/><p className="question-prompt"><MathText enabled={math}>{question.prompt}</MathText></p>{question.python?.type==='predict-output'&&question.python.starterCode&&<pre className="python-output" aria-label="Код для анализа">{question.python.starterCode}</pre>}
    {context === 'adaptive' && <><Button variant="ghost" onClick={() => setHint(!hint)}>{hint ? 'Скрыть подсказку' : 'Показать подсказку'}</Button>{hint && <p className="callout"><MathText enabled={math}>{question.hint}</MathText></p>}</>}
    {customInput ? <fieldset disabled={result !== null}>{customInput}</fieldset> : question.answerType === 'multiple-choice' ?
      <fieldset className="answer-options"><legend>Выбери все правильные варианты</legend>{question.options?.map((option,i)=><label className="answer-option" key={option} htmlFor={`${id}-${i}`}><input type="checkbox" aria-label={option} id={`${id}-${i}`} checked={(answer?JSON.parse(answer) as string[]:[]).includes(option)} disabled={result!==null} onChange={e=>{const selected=answer?JSON.parse(answer) as string[]:[];setAnswer(JSON.stringify(e.target.checked?[...selected,option]:selected.filter(v=>v!==option)));setFormatError('');}}/><span><MathText enabled={math}>{option}</MathText></span></label>)}</fieldset> : question.answerType === 'choice' ?
      <div role="radiogroup" aria-label="Варианты ответа" className="answer-options">{question.options?.map((option, i) => <label className={`answer-option ${answer === option ? 'selected' : ''}`} key={option} htmlFor={`${id}-${i}`}><input type="radio" aria-label={option} name={id} id={`${id}-${i}`} value={option} checked={answer === option} disabled={result !== null} onChange={() => { setAnswer(option); setFormatError(''); }}/><span><MathText enabled={math}>{option}</MathText></span></label>)}</div> :
      <form onSubmit={e => { e.preventDefault(); submit(); }}><label className="field-label" htmlFor={id}>Твой ответ</label><input id={id} data-slot="input" value={answer} disabled={result !== null} onChange={e => { setAnswer(e.target.value); setFormatError(''); }} placeholder={question.answerType === 'number' ? 'Например: 12,5 или 1/4' : 'Введи ответ'} autoComplete="off" maxLength={300} inputMode={question.answerType === 'number' ? 'decimal' : 'text'} aria-invalid={!!formatError} aria-describedby={formatError ? `${id}-format` : undefined}/></form>}
    {formatError && <p className="format-error" id={`${id}-format`} role="alert">{formatError}</p>}
    {result === null ? <Button className="check-button" onClick={submit} disabled={!current.trim()}>Проверить ответ <Icon name="arrow"/></Button> :
      <div className={`feedback ${result ? 'success' : 'retry'}`} role="status"><strong><Icon name={result ? 'check' : 'bulb'}/>{result ? 'Ответ верный. Сверь свой ход решения.' : 'Давай проверим этот шаг'}</strong><p>{result ? context === 'adaptive' ? 'Можно перейти к следующему вопросу или открыть разбор.' : <MathText enabled={math}>{question.solution}</MathText> : question.wrongAnswers?.[normalizeText(current)] ?? `Ответ «${current}» не подходит к условию.`}</p>{!result && <>{context !== 'adaptive' && <p><b>Подсказка:</b> <MathText enabled={math}>{question.hint}</MathText></p>}<Button variant="outline" onClick={() => { setResult(null); setSolution(false); submitted.current = false; }}><Icon name="review"/>Попробовать ещё раз</Button><p className="small muted">Эта попытка сохранена в «Мои ошибки».</p></>}</div>}
    {hadAttempt && (result === false || context === 'adaptive') && !solution && <Button variant="ghost" className="solution-toggle" onClick={() => setSolution(true)}>Показать полное решение <Icon name="chevron"/></Button>}
    {solution && <div className="solution"><b>Разбор решения</b>{question.explanation !== question.solution && <p><MathText enabled={math}>{question.explanation}</MathText></p>}<p><MathText enabled={math}>{question.solution}</MathText></p><p>Ответ: <strong><MathText enabled={math}>{question.answer}</MathText></strong></p></div>}
  </div>;
}
export function Quiz({ items, title = 'Проверим понимание', context = 'test', onFinish }: { items: Question[]; title?: string; context?: AttemptContext; onFinish?: () => void }) {
  const {state}=useStudy();
  const [index, setIndex] = useState(()=>resumeCodeDraftIndex(state,items)), [results, setResults] = useState<Record<number, boolean>>({}), [finished, setFinished] = useState(false);
  if (!items.length) return <Panel><p>Задания этой темы ещё не добавлены.</p></Panel>;
  if (finished) return <Panel className="quiz-finish"><div className="empty-icon"><Icon name="check" size={28}/></div><h3>Мини-тест завершён</h3><p>Верных ответов: <b>{Object.values(results).filter(Boolean).length} из {items.length}</b>.</p><p className="muted">Ответ после новой попытки тоже учитывается. История всех попыток остаётся в прогрессе. Статус «Уверенно» выбери сам, когда сможешь объяснить способ.</p><Button variant="outline" onClick={() => { setIndex(0); setResults({}); setFinished(false); }}>Пройти ещё раз</Button></Panel>;
  return <Panel className="quiz-panel"><div className="section-heading"><div><span className="eyebrow">МИНИ-ТЕСТ</span><h3>{title}</h3></div><Badge>{index + 1} / {items.length}</Badge></div>{state.codeDrafts?.[items[index].id]&&<div className="button-row"><p className="small muted">Открыт сохранённый черновик этого задания.</p>{index>0&&<Button variant="ghost" onClick={()=>setIndex(0)}>К первому заданию</Button>}</div>}<ProgressBar value={index / items.length * 100} label="Прогресс мини-теста"/><AnswerBox key={`${items[index].id}-${index}`} question={items[index]} context={context} onDone={correct => setResults(old => ({ ...old, [index]: correct }))}/>{Object.hasOwn(results, index) && <div className="quiz-next"><Button variant="secondary" onClick={() => { if (index === items.length - 1) { setFinished(true); onFinish?.(); } else setIndex(index + 1); }}>{index === items.length - 1 ? 'Завершить мини-тест' : results[index] ? 'Следующий вопрос' : 'Продолжить и вернуться позже'}<Icon name="arrow"/></Button></div>}</Panel>;
}
