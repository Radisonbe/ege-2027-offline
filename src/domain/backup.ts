import type { Question, StudyState } from './types.ts';
import {validatePythonTask} from '../python/tasks.ts';

export const MAX_BACKUP_BYTES = 20 * 1024 * 1024;
export interface ProgressBackup { format: 'ege-progress-backup'; backupVersion: 2; appVersion: string; createdAt: string; data: StudyState }
export class BackupError extends Error {}
const fail = (path: string): never => { throw new BackupError(`Файл не подходит: проверь поле «${path}». Текущий прогресс не изменён.`); };
const forbidden = new Set(['__proto__', 'constructor', 'prototype']);
type ObjectValue = Record<string, unknown>;
function object(value: unknown, path: string, required: string[], optional: string[] = []): ObjectValue {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fail(path);
  const record = value as ObjectValue, allowed = new Set([...required, ...optional]);
  if (required.some(key => !Object.hasOwn(record, key)) || Object.keys(record).some(key => !allowed.has(key) || forbidden.has(key))) return fail(path);
  return record;
}
function dictionary(value: unknown, path: string): ObjectValue {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fail(path);
  const record = value as ObjectValue;
  if (Object.keys(record).length > 100000 || Object.keys(record).some(key => forbidden.has(key))) return fail(path);
  return record;
}
function string(value: unknown, path: string, id = false) {
  if (typeof value !== 'string' || value.length > (id ? 500 : 100000) || (id && (!value.trim() || forbidden.has(value)))) fail(path);
}
function choice(value: unknown, path: string, allowed: readonly unknown[]) { if (!allowed.includes(value)) fail(path); }
function integer(value: unknown, path: string, min: number, max: number) { if (!Number.isInteger(value) || (value as number) < min || (value as number) > max) fail(path); }
function date(value: unknown, path: string) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return fail(path);
  const parsed = new Date(value + 'T12:00:00Z');
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) fail(path);
}
function instant(value: unknown, path: string) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return fail(path);
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) fail(path);
}
function array(value: unknown, path: string, validate: (item: unknown, path: string) => void, max = 100000): unknown[] {
  if (!Array.isArray(value) || value.length > max) return fail(path);
  value.forEach((item, index) => validate(item, `${path}[${index}]`)); return value;
}
function strings(value: unknown, path: string) { array(value, path, (item, name) => string(item, name), 1000); }
function unique(items: unknown[], path: string) {
  const ids = items.map(item => (item as ObjectValue).id);
  if (new Set(ids).size !== ids.length) fail(path + '.id');
}
export function validateQuestion(value: unknown, path = 'question'): Question {
  const q = object(value, path, ['id', 'subject', 'topic', 'subtopic', 'difficulty', 'origin', 'source', 'sourceYear', 'sourceType', 'examTaskType', 'answerType', 'prompt', 'answer', 'hint', 'explanation', 'solution', 'principle', 'version', 'requires', 'related'], ['options', 'wrongAnswers', 'easy', 'skills', 'remediates','python','hints','answerFormat']);
  for (const key of ['id', 'topic']) string(q[key], path + '.' + key, true);
  for (const key of ['source', 'prompt', 'answer', 'hint', 'explanation', 'solution', 'principle']) string(q[key], path + '.' + key);
  for (const key of ['subtopic', 'examTaskType']) if (q[key] !== null) string(q[key], path + '.' + key);
  choice(q.subject, path + '.subject', ['math', 'russian', 'informatics', 'python']);
  choice(q.difficulty, path + '.difficulty', ['unspecified', 'easy', 'medium', 'hard']);
  choice(q.origin, path + '.origin', ['official', 'generated', 'reconstructed', 'custom', 'private-import']);
  choice(q.sourceType, path + '.sourceType', ['training', 'exam', 'lesson']);
  choice(q.answerType, path + '.answerType', ['number', 'text', 'choice', 'selection','multiple-choice','code']);
  if(q.answerFormat!==undefined)choice(q.answerFormat,path+'.answerFormat',['binary']);
  integer(q.version, path + '.version', 1, Number.MAX_SAFE_INTEGER);
  if (q.sourceYear !== null) integer(q.sourceYear, path + '.sourceYear', 1900, 2200);
  strings(q.requires, path + '.requires'); strings(q.related, path + '.related');
  if (q.skills !== undefined) strings(q.skills, path + '.skills');
  if (q.remediates !== undefined) strings(q.remediates, path + '.remediates');
  if (q.options !== undefined) strings(q.options, path + '.options');
  if (q.easy !== undefined) choice(q.easy, path + '.easy', [true, false]);
  if(q.hints!==undefined)array(q.hints,path+'.hints',(v,p)=>string(v,p),5);
  if(q.python!==undefined){if(!['python','informatics'].includes(String(q.subject)))fail(path+'.python');try{validatePythonTask(q.python);}catch{fail(path+'.python');}}
  if(q.answerType==='code'&&(!q.python||(q.python as {type:string}).type==='predict-output'))fail(path+'.python');
  if(q.answerType==='multiple-choice'){
    let expected:unknown;try{expected=JSON.parse(q.answer as string);}catch{fail(path+'.answer');}
    if(!Array.isArray(expected)||!expected.length||new Set(expected).size!==expected.length||!Array.isArray(q.options)||q.options.length<2||new Set(q.options).size!==q.options.length||expected.some(v=>typeof v!=='string'||!(q.options as unknown[]).includes(v)))fail(path+'.answer');
  }
  if(q.answerFormat==='binary'&&(q.answerType!=='text'||!/^[01]+$/.test(q.answer as string)))fail(path+'.answerFormat');
  if(q.answerType==='code'){
    const task=validatePythonTask(q.python),tests=[...(task.visibleTests??[]),...(task.hiddenTests??[])];
    if(tests.length<3||tests.some(t=>task.functionName?t.args===undefined||t.expectedReturn===undefined:t.stdin===undefined||t.expectedOutput===undefined))fail(path+'.python.tests');
  }
  if (q.wrongAnswers !== undefined) for (const [key, message] of Object.entries(dictionary(q.wrongAnswers, path + '.wrongAnswers'))) string(message, path + '.wrongAnswers.' + key);
  return value as Question;
}

export function validateStudyState(value: unknown): StudyState {
  const s = object(value, 'data', ['app', 'schemaVersion', 'contentVersion', 'topics', 'attempts', 'errors', 'reviews', 'activity', 'settings', 'updatedAt'], ['adaptive','codeDrafts']);
  if (s.app !== 'ege-local-center') fail('data.app');
  if (s.schemaVersion !== 1 && s.schemaVersion !== 2) throw new BackupError('Версия схемы данных пока не поддерживается. Текущий прогресс не изменён.');
  if (s.schemaVersion === 1 && s.adaptive !== undefined) fail('data.adaptive');
  if (s.schemaVersion === 2 && s.adaptive === undefined) fail('data.adaptive');
  string(s.contentVersion, 'data.contentVersion', true); instant(s.updatedAt, 'data.updatedAt');
  const topics = dictionary(s.topics, 'data.topics');
  for (const [key, value] of Object.entries(topics)) {
    const t = object(value, 'data.topics.' + key, ['topic', 'status', 'note'], ['last']);
    string(t.topic, 'topic', true); if (t.topic !== key) fail('data.topics.' + key);
    choice(t.status, 'status', ['Не изучено', 'Изучаю', 'Нужна практика', 'Уверенно', 'Повторить']); string(t.note, 'note');
    if (t.last !== undefined) date(t.last, 'last');
  }
  const attempts = array(s.attempts, 'data.attempts', (value, path) => {
    const a = object(value, path, ['id', 'questionId', 'questionVersion', 'topic', 'answer', 'correct', 'date', 'at', 'context'], ['subject', 'subtopic', 'skills', 'sessionId','assessmentKey']);
    for (const key of ['id', 'questionId', 'topic']) string(a[key], path + '.' + key, true);
    string(a.answer, path + '.answer'); choice(a.correct, path + '.correct', [true, false]);
    integer(a.questionVersion, path + '.questionVersion', 1, Number.MAX_SAFE_INTEGER);
    date(a.date, path + '.date'); instant(a.at, path + '.at');
    choice(a.context, path + '.context', ['practice', 'test', 'easy', 'session', 'error', 'adaptive']);
    if (a.subject !== undefined) choice(a.subject, path + '.subject', ['math','russian','informatics','python']);
    if (a.subtopic !== undefined && a.subtopic !== null) string(a.subtopic, path + '.subtopic', true);
    if (a.skills !== undefined) strings(a.skills, path + '.skills');
    if (a.sessionId !== undefined) string(a.sessionId, path + '.sessionId', true);
    if (a.assessmentKey !== undefined) string(a.assessmentKey,path+'.assessmentKey',true);
  }); unique(attempts, 'data.attempts');
  const attemptById = new Map(attempts.map(a => [(a as ObjectValue).id, a as ObjectValue]));
  const errors = array(s.errors, 'data.errors', (value, path) => {
    const e = object(value, path, ['id', 'topic', 'prompt', 'wrong', 'correct', 'reason', 'principle', 'solution', 'note', 'date', 'status', 'due', 'stage'], ['questionId', 'attemptId', 'question']);
    for (const key of ['id', 'topic']) string(e[key], path + '.' + key, true);
    for (const key of ['prompt', 'wrong', 'correct', 'reason', 'principle', 'solution', 'note']) string(e[key], path + '.' + key);
    for (const key of ['questionId', 'attemptId']) if (e[key] !== undefined) string(e[key], path + '.' + key, true);
    date(e.date, path + '.date'); date(e.due, path + '.due'); integer(e.stage, path + '.stage', 0, 4);
    choice(e.status, path + '.status', ['не понял', 'понял', 'закрепил']);
    if (e.question !== undefined) validateQuestion(e.question, path + '.question');
    if (e.attemptId !== undefined) {
      const attempt = attemptById.get(e.attemptId);
      if (!attempt || attempt.correct !== false || attempt.topic !== e.topic || (e.questionId !== undefined && attempt.questionId !== e.questionId)) fail(path + '.attemptId');
    }
  }); unique(errors, 'data.errors');
  const errorIds = new Set(errors.map(e => (e as ObjectValue).id));
  for (const [key, value] of Object.entries(dictionary(s.reviews, 'data.reviews'))) {
    const r = object(value, 'data.reviews.' + key, ['id', 'targetType', 'targetId', 'due', 'stage'], ['last']);
    string(r.id, 'review.id', true); string(r.targetId, 'review.targetId', true);
    if (r.id !== key) fail('data.reviews.' + key);
    choice(r.targetType, 'review.targetType', ['topic', 'error']); date(r.due, 'review.due'); integer(r.stage, 'review.stage', 0, 4);
    if (r.last !== undefined) date(r.last, 'review.last');
    if (r.targetType === 'error' && !errorIds.has(r.targetId)) fail('review.targetId');
  }
  const activity = array(s.activity, 'data.activity', (value, path) => {
    const a = object(value, path, ['id', 'date', 'topic', 'kind']);
    string(a.id, path + '.id', true); string(a.topic, path + '.topic', true); date(a.date, path + '.date'); choice(a.kind, path + '.kind', ['answer', 'lesson', 'review']);
  }); unique(activity, 'data.activity');
  const settings = object(s.settings, 'data.settings', ['theme'], ['lastTopic']);
  choice(settings.theme, 'settings.theme', ['light', 'dark']); if (settings.lastTopic !== undefined) string(settings.lastTopic, 'settings.lastTopic', true);
  if (s.schemaVersion === 2) validateAdaptive(s.adaptive, attemptById);
  if(s.codeDrafts!==undefined)for(const [key,value] of Object.entries(dictionary(s.codeDrafts,'data.codeDrafts'))){
    if(!/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,199}$/.test(key))fail('data.codeDrafts.id');
    const d=object(value,'data.codeDrafts.'+key,['schemaVersion','questionVersion','code','stdin','updatedAt']);
    choice(d.schemaVersion,'draft.schemaVersion',[1]);integer(d.questionVersion,'draft.questionVersion',1,Number.MAX_SAFE_INTEGER);
    string(d.code,'draft.code');string(d.stdin,'draft.stdin');if((d.stdin as string).length>32000)fail('draft.stdin');instant(d.updatedAt,'draft.updatedAt');
  }
  // Historical IDs are deliberately not restricted to the current content catalogue.
  // Additive migration: historical IDs, snapshots, dates, intervals and notes are untouched.
  return s.schemaVersion === 1 ? { ...value as StudyState, schemaVersion: 2, adaptive: { sessions: [], exposures: [] } } : value as StudyState;
}

function validateAdaptive(value: unknown, attempts: Map<unknown, ObjectValue>) {
  const a = object(value, 'adaptive', ['sessions', 'exposures']);
  const linkedAttempts = new Set<string>(), sessions = new Map<string, ObjectValue>();
  const items = array(a.sessions, 'adaptive.sessions', (value, path) => {
    const session = object(value, path, ['id','requested','subject','startedAt','index','items'], ['completedAt']);
    string(session.id, path + '.id', true); choice(session.requested, path + '.requested', [5,10,15,20]);
    choice(session.subject, path + '.subject', ['all','math','russian','informatics','python']); instant(session.startedAt, path + '.startedAt');
    if (session.completedAt !== undefined) instant(session.completedAt, path + '.completedAt');
    const questions = array(session.items, path + '.items', (value, name) => {
      const item = object(value, name, ['question','score','reasons','firstCorrect','correct','attemptIds'], ['shownAt']);
      const q = validateQuestion(item.question, name + '.question');
      if (session.subject !== 'all' && q.subject !== session.subject) fail(name + '.question.subject');
      if (typeof item.score !== 'number' || !Number.isFinite(item.score)) fail(name + '.score');
      array(item.reasons, name + '.reasons', (value, path) => { const r = object(value,path,['code','points','label']); string(r.code,path+'.code',true); string(r.label,path+'.label'); if(typeof r.points !== 'number' || !Number.isFinite(r.points)) fail(path+'.points'); }, 100);
      choice(item.firstCorrect, name+'.firstCorrect',[null,true,false]); choice(item.correct,name+'.correct',[null,true,false]);
      if(item.shownAt !== undefined) instant(item.shownAt,name+'.shownAt');
      strings(item.attemptIds,name+'.attemptIds');
      const ids = item.attemptIds as string[];
      for(const id of ids) {
        const attempt = attempts.get(id);
        if(!attempt || linkedAttempts.has(id) || attempt.context !== 'adaptive' || attempt.sessionId !== session.id || attempt.questionId !== q.id || attempt.topic !== q.topic || attempt.questionVersion !== q.version || attempt.subject !== q.subject || attempt.subtopic !== q.subtopic || JSON.stringify(attempt.skills) !== JSON.stringify(q.skills ?? [])) fail(name+'.attemptIds');
        linkedAttempts.add(id);
      }
      if (ids.length ? item.firstCorrect !== attempts.get(ids[0])?.correct || item.correct !== attempts.get(ids.at(-1))?.correct || !item.shownAt : item.firstCorrect !== null || item.correct !== null) fail(name+'.correct');
    }, 20);
    if (!questions.length || questions.length > (session.requested as number)) fail(path+'.items');
    integer(session.index,path+'.index',0,questions.length-1);
    if (questions.slice(0,session.index as number).some(q=>(q as ObjectValue).correct===null)) fail(path+'.index');
    if (session.completedAt !== undefined && questions.some(q=>(q as ObjectValue).correct===null)) fail(path+'.completedAt');
    sessions.set(session.id as string,session);
  },10000); unique(items,'adaptive.sessions');
  const seen = new Set<string>();
  const exposures = array(a.exposures,'adaptive.exposures',(value,path)=>{
    const e = object(value,path,['id','sessionId','index','questionId','topic','skills','at']);
    for(const key of ['id','sessionId','questionId','topic']) string(e[key],path+'.'+key,true);
    instant(e.at,path+'.at'); strings(e.skills,path+'.skills');
    const session=sessions.get(e.sessionId as string), key=e.sessionId+':'+e.index;
    if(!session || seen.has(key)) return fail(path+'.sessionId');
    integer(e.index,path+'.index',0,(session.items as unknown[]).length-1);
    const item=(session.items as ObjectValue[])[e.index as number],q=item.question as ObjectValue;
    if(item.shownAt!==e.at || q.id!==e.questionId || q.topic!==e.topic || e.id!==key || JSON.stringify(e.skills)!==JSON.stringify(q.skills??[])) fail(path+'.questionId');
    seen.add(key);
  }); unique(exposures,'adaptive.exposures');
  for(const session of sessions.values()) (session.items as ObjectValue[]).forEach((item,index)=>{if(item.shownAt&&!seen.has(session.id+':'+index))fail('adaptive.exposures');});
  for(const attempt of attempts.values()) if(attempt.context==='adaptive' && !linkedAttempts.has(attempt.id as string)) fail('adaptive.attemptIds');
}

export function serializeBackup(state: StudyState, now = new Date()): string {
  const data = validateStudyState(JSON.parse(JSON.stringify(state)));
  const text = JSON.stringify({ format: 'ege-progress-backup', backupVersion: 2, appVersion: '0.3.2-dev', createdAt: now.toISOString(), data } satisfies ProgressBackup, null, 2);
  if (new TextEncoder().encode(text).length > MAX_BACKUP_BYTES) throw new BackupError('Данные превышают текущий лимит резервной копии 20 МБ. Прогресс не изменён.');
  return text;
}
export function parseBackup(text: string): ProgressBackup {
  if (new TextEncoder().encode(text).length > MAX_BACKUP_BYTES) throw new BackupError('Файл больше 20 МБ. Текущий прогресс не изменён.');
  let value: unknown;
  try { value = JSON.parse(text, (key, item) => { if (forbidden.has(key)) throw new Error('Unsafe key'); return item; }); }
  catch { throw new BackupError('Не удалось прочитать JSON. Файл повреждён или имеет неподходящий формат. Текущий прогресс не изменён.'); }
  const backup = object(value, 'backup', ['format', 'backupVersion', 'appVersion', 'createdAt', 'data']);
  if (backup.format !== 'ege-progress-backup' || ![1,2].includes(backup.backupVersion as number)) throw new BackupError('Это не поддерживаемая резервная копия ЕГЭ 2027. Текущий прогресс не изменён.');
  string(backup.appVersion, 'appVersion', true); instant(backup.createdAt, 'createdAt');
  const data = validateStudyState(backup.data);
  if ((backup.backupVersion === 1 && (backup.data as ObjectValue).schemaVersion !== 1) || (backup.backupVersion === 2 && (backup.data as ObjectValue).schemaVersion !== 2)) fail('backupVersion');
  return { ...value as ProgressBackup, backupVersion: 2, data };
}
