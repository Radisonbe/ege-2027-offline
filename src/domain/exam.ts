import type { Question, SubjectId } from './types.ts';
import { parseNumber } from './answers.ts';
export type ExamSubject = Exclude<SubjectId, 'python'>;
export type ExamFormat = 'decimal' | 'integer' | 'digits-set' | 'bitstring' | 'text' | 'pair' | 'extended' | 'essay';
export interface ExamPosition {
    id: string;
    number: number;
    title: string;
    format: ExamFormat;
    answerFormats?: ExamFormat[];
    maxPoints: number;
    topics: string[];
    skills: string[];
    needs: string[];
    scoring: 'exact' | 'unordered' | 'hamming' | 'pair-partial' | 'manual';
    criteria: string;
    source: string;
    pages: string;
}
export interface ExamDefinition {
    id: string;
    version: string;
    subject: ExamSubject;
    year: number;
    status: 'project' | 'final' | 'unverified';
    title: string;
    durationMinutes: number;
    maxPoints: number;
    source: string;
    positions: ExamPosition[];
}
export interface ExamTask {
    id: string;
    version: number;
    positionId: string;
    familyId: string;
    question: Question;
    format: ExamFormat;
    assessment: 'automatic' | 'manual';
    assets: {
        id: string;
        path: string;
        kind: 'table' | 'file' | 'image' | 'graph';
        sha256: string;
    }[];
    generation?: {
        generatorId: string;
        version: number;
        seed: string;
        parameters: Record<string, number | string>;
    };
    manualCriteria?: {
        id: string;
        title: string;
        maxPoints: number;
        source: string;
    }[];
}
export interface ExamItem {
    key: string;
    answer: string;
    draft: string;
    assisted: boolean;
    attempts: {
        id: string;
        answer: string;
        correct: boolean;
        points: number;
        at: string;
        assisted: boolean;
    }[];
}
export interface ExamSession {
    id: string;
    mapKey: string;
    mode: 'number' | 'custom' | 'full';
    seed: string;
    startedAt: string;
    durationSeconds: number | null;
    elapsedFloor: number;
    completedAt?: string;
    index: number;
    items: ExamItem[];
}
export interface ExamProgress {
    schemaVersion: 1;
    maps: Record<string, ExamDefinition>;
    snapshots: Record<string, ExamTask>;
    sessions: ExamSession[];
}
export interface ExamGenerator {
    id: string;
    version: number;
    positionId: string;
    validateParameters: (parameters: Record<string, number | string>) => boolean;
    generate: (seed: string, parameters: Record<string, number | string>) => ExamTask;
    verify: (task: ExamTask) => boolean;
}
export const emptyExam = (): ExamProgress => ({ schemaVersion: 1, maps: {}, snapshots: {}, sessions: [] });
export const mapKey = (map: ExamDefinition) => `${map.id}@${map.version}`;
export const taskKey = (task: ExamTask) => `${task.id}@${task.version}`;
function stableContent(value: unknown) { return JSON.stringify(value, (_key, item) => item && typeof item === 'object' && !Array.isArray(item) ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item); }
/** Explicit refinements; archived .1 maps did not yet store these declarations. */
export function compatibleExamFormat(map: ExamDefinition, task: ExamTask): boolean {
    const position = map.positions.find(p => p.id === task.positionId);
    if (!position || task.question.subject !== map.subject) return false;
    const legacy: Record<string, { base: ExamFormat; formats: ExamFormat[] }> = {
        'ege-russian-2027-26': { base: 'digits-set', formats: ['digits-set', 'integer'] },
        'ege-informatics-2027-4': { base: 'text', formats: ['text', 'integer', 'bitstring'] },
    };
    const previous = legacy[position.id];
    const historical = map.version === 'project-2026-10-09.1' && previous?.base === position.format;
    const allowed = position.answerFormats ?? (historical ? previous.formats : undefined) ?? [position.format];
    if (!allowed.includes(task.format)) return false;
    // One positive sentence index is a singleton of the position's digit set.
    if (position.format === 'digits-set' && task.format === 'integer')
        return /^[1-9]\d*$/.test(task.question.answer);
    return true;
}
export function coverage(map: ExamDefinition, tasks: ExamTask[]) { return map.positions.map(p => { const own = tasks.filter(t => t.positionId === p.id && t.assessment === 'automatic' && compatibleExamFormat(map, t)); return { position: p, count: own.length, status: own.length >= 10 && new Set(own.map(t => t.familyId)).size >= 3 ? 'Готово' : own.length ? 'Ограниченный банк' : 'В разработке' }; }); }
export function fullExamAvailable(map: ExamDefinition, tasks: ExamTask[]) { return map.status !== 'unverified' && map.positions.every(p => tasks.some(t => t.positionId === p.id && t.assessment === 'automatic' && compatibleExamFormat(map, t) && !p.needs.length)); }
function rank(seed: string, id: string) {
    let h = 2166136261;
    for (const c of seed + '|' + id) {
        h ^= c.charCodeAt(0);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}
export function selectExamTasks(map: ExamDefinition, tasks: ExamTask[], positions: string[], count: number, order: 'numbers' | 'mixed', seed: string, topics: string[] = [], difficulty: string[] = []) {
    if (!Number.isInteger(count) || count < 1 || count > 50)
        throw Error('Выбери от 1 до 50 заданий.');
    if (!positions.length || positions.some(id => !map.positions.some(p => p.id === id)))
        throw Error('Выбери доступные номера этого экзамена.');
    const list = tasks.filter(t => positions.includes(t.positionId) && t.assessment === 'automatic' && compatibleExamFormat(map, t) && (!topics.length || topics.includes(t.question.topic)) && (!difficulty.length || difficulty.includes(t.question.difficulty)));
    const unique = [...new Map(list.map(t => [t.id, t])).values()].sort((a, b) => rank(seed, a.id) - rank(seed, b.id) || a.id.localeCompare(b.id));
    const selected = unique.slice(0, count);
    if (order === 'numbers')
        selected.sort((a, b) => map.positions.find(p => p.id === a.positionId)!.number - map.positions.find(p => p.id === b.positionId)!.number || rank(seed, a.id) - rank(seed, b.id));
    return { items: selected, available: unique.length, shortfall: Math.max(0, count - unique.length) };
}
export function startExam(progress: ExamProgress, map: ExamDefinition, tasks: ExamTask[], mode: ExamSession['mode'], seed: string, id: string, now = new Date()): ExamProgress {
    if (progress.sessions.length >= 10000)
        throw Error('Достигнут лимит экзаменационных сеансов. История сохранена; автоматического удаления нет.');
    if (!/^[A-Za-z0-9._-]+$/.test(id))
        throw Error('Неверный идентификатор сеанса.');
    if (progress.sessions.some(s => s.id === id))
        throw Error('Сеанс уже существует.');
    if (!tasks.length || new Set(tasks.map(t => t.id)).size !== tasks.length || tasks.some(t => !compatibleExamFormat(map, t)))
        throw Error('Проверь состав тренировки.');
    if (mode === 'full' && (!fullExamAvailable(map, tasks) || tasks.length !== map.positions.length || new Set(tasks.map(t => t.positionId)).size !== map.positions.length))
        throw Error('Полный пробник недоступен: не все обязательные позиции обеспечены.');
    const key = mapKey(map), maps = { ...progress.maps }, snapshots = { ...progress.snapshots };
    if (maps[key] && stableContent(maps[key]) !== stableContent(map))
        throw Error('Структура изменилась без новой версии.');
    maps[key] = structuredClone(map);
    for (const task of tasks) {
        const key = taskKey(task);
        if (snapshots[key] && stableContent(snapshots[key]) !== stableContent(task))
            throw Error('Задание изменилось без новой версии.');
        snapshots[key] = structuredClone(task);
    }
    if (Object.keys(maps).length > 10000 || Object.keys(snapshots).length > 10000)
        throw Error('Достигнут лимит архива экзаменационных версий. История не удалена.');
    return { ...progress, maps, snapshots, sessions: [...progress.sessions, { id, mapKey: key, mode, seed, startedAt: now.toISOString(), durationSeconds: mode === 'full' ? map.durationMinutes * 60 : null, elapsedFloor: 0, index: 0, items: tasks.map(t => ({ key: taskKey(t), answer: '', draft: '', assisted: false, attempts: [] })) }] };
}
export function remainingSeconds(s: ExamSession, now = new Date()) { return s.durationSeconds === null ? null : Math.max(0, s.durationSeconds - Math.max(s.elapsedFloor, Math.floor((now.getTime() - Date.parse(s.startedAt)) / 1000))); }
export function editExam(progress: ExamProgress, id: string, index: number, answer: string) { return { ...progress, sessions: progress.sessions.map(s => s.id !== id || s.completedAt ? s : { ...s, items: s.items.map((item, i) => i === index ? { ...item, answer } : item) }) }; }
export function gradeExam(task: ExamTask, answer: string): {
    valid: boolean;
    correct: boolean;
    message: string;
} {
    const text = answer.trim().replaceAll('−', '-').replaceAll(',', '.');
    if (task.assessment !== 'automatic')
        return { valid: false, correct: false, message: 'Требуется ручная проверка по критериям.' };
    if (['decimal', 'integer'].includes(task.format)) {
        if (!(task.format === 'integer' ? /^[+-]?\d+$/ : /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/).test(text))
            return { valid: false, correct: false, message: 'Запиши ' + (task.format === 'integer' ? 'целое число' : 'целое число или конечную десятичную дробь') + ' без единиц и дробной черты. Формат не считается попыткой.' };
        return { valid: true, correct: parseNumber(text) === parseNumber(task.question.answer), message: '' };
    }
    if (task.format === 'digits-set') {
        if (!/^[1-9]+$/.test(text) || new Set(text).size !== text.length)
            return { valid: false, correct: false, message: 'Запиши неповторяющиеся цифры номеров без пробелов. Формат не считается попыткой.' };
        return { valid: true, correct: [...text].sort().join('') === [...task.question.answer].sort().join(''), message: '' };
    }
    if (task.format === 'bitstring' && !/^[01]+$/.test(text))
        return { valid: false, correct: false, message: 'Нужна двоичная запись из 0 и 1.' };
    return { valid: true, correct: text.toLocaleLowerCase('ru') === task.question.answer.trim().toLocaleLowerCase('ru'), message: '' };
}
export function answerExam(progress: ExamProgress, id: string, index: number, attemptId: string, now = new Date()): ExamProgress {
    const session = progress.sessions.find(s => s.id === id);
    if (!session || session.completedAt)
        throw Error('Сеанс завершён или не найден.');
    if (remainingSeconds(session, now) === 0)
        throw Error('Время истекло.');
    const item = session.items[index];
    if (!item)
        throw Error('Задание не найдено.');
    const task = progress.snapshots[item.key], grade = gradeExam(task, item.answer);
    if (!grade.valid)
        throw Error(grade.message);
    if (item.attempts.at(-1)?.answer === item.answer && item.attempts.at(-1)?.assisted === item.assisted)
        return progress;
    if (item.attempts.length >= 10000)
        throw Error('Достигнут лимит проверок этого задания. История сохранена без удаления.');
    if (session.items.some(i => i.attempts.some(a => a.id === attemptId)))
        return progress;
    const position = progress.maps[session.mapKey].positions.find(p => p.id === task.positionId)!;
    return { ...progress, sessions: progress.sessions.map(s => s.id !== id ? s : { ...s, elapsedFloor: Math.max(s.elapsedFloor, Math.floor((now.getTime() - Date.parse(s.startedAt)) / 1000), 0), items: s.items.map((i, n) => n !== index ? i : { ...i, attempts: [...i.attempts, { id: attemptId, answer: i.answer, correct: grade.correct, points: grade.correct ? position.maxPoints : 0, at: now.toISOString(), assisted: i.assisted }] }) }) };
}
export function examStats(progress: ExamProgress, structureKey?: string) {
    const rows: Record<string, {
        answered: number;
        firstCorrect: number;
        assisted: number;
        corrected: number;
    }> = {};
    for (const s of progress.sessions) {
        if (structureKey && s.mapKey !== structureKey)
            continue;
        for (const item of s.items) {
            const first = item.attempts[0];
            if (!first)
                continue;
            const id = progress.snapshots[item.key].positionId;
            const row = rows[id] ??= { answered: 0, firstCorrect: 0, assisted: 0, corrected: 0 };
            row.answered++;
            if (first.assisted)
                row.assisted++;
            else if (first.correct)
                row.firstCorrect++;
            if (!first.correct && item.attempts.some(a => a.correct))
                row.corrected++;
        }
    }
    return rows;
}
