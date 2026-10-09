import { validateQuestion } from './backup.ts';
import { gradeExam, mapKey, taskKey, type ExamDefinition, type ExamTask, type ExamProgress } from './exam.ts';
function check(ok: unknown, path: string): asserts ok {
    if (!ok)
        throw Error('Неверные экзаменационные данные: ' + path);
}
function obj(v: unknown, keys: string[], optional: string[] = []): Record<string, any> { check(v && typeof v === 'object' && !Array.isArray(v), 'object'); const r = v as Record<string, any>; check(keys.every(k => Object.hasOwn(r, k)) && Object.keys(r).every(k => [...keys, ...optional].includes(k) && !['__proto__', 'constructor', 'prototype'].includes(k)), 'keys'); return r; }
function text(v: unknown, max = 100000) { check(typeof v === 'string' && v.length <= max, 'text'); }
function id(v: unknown) { text(v, 500); check((v as string).length && !['__proto__', 'constructor', 'prototype'].includes(v as string), 'id'); }
function list(v: unknown, max = 10000): any[] { check(Array.isArray(v) && v.length <= max, 'array'); return v; }
function ids(v: unknown) { const a = list(v, 1000); a.forEach(id); check(new Set(a).size === a.length, 'unique references'); }
function num(v: unknown, min = 0, max = Number.MAX_SAFE_INTEGER) { check(Number.isInteger(v) && Number(v) >= min && Number(v) <= max, 'number'); }
function instant(v: unknown) { text(v); const d = new Date(v as string); check(Number.isFinite(d.getTime()) && d.toISOString() === v, 'instant'); }
const formats = ['decimal', 'integer', 'digits-set', 'bitstring', 'text', 'pair', 'extended', 'essay'];
export function validateExamMap(input: unknown): ExamDefinition {
    const m = obj(input, ['id', 'version', 'subject', 'year', 'status', 'title', 'durationMinutes', 'maxPoints', 'source', 'positions']);
    id(m.id);
    id(m.version);
    check(['math', 'russian', 'informatics'].includes(m.subject), 'subject');
    num(m.year, 2027, 2200);
    check(['project', 'final', 'unverified'].includes(m.status), 'status');
    text(m.title);
    text(m.source);
    num(m.durationMinutes, 1, 1440);
    num(m.maxPoints, 1, 1000);
    const ps = list(m.positions, 100);
    check(ps.length > 0, 'positions');
    const seen = new Set();
    ps.forEach((v, i) => {
        const p = obj(v, ['id', 'number', 'title', 'format', 'maxPoints', 'topics', 'skills', 'needs', 'scoring', 'criteria', 'source', 'pages']);
        id(p.id);
        check(!seen.has(p.id), 'duplicate position');
        seen.add(p.id);
        check(p.number === i + 1, 'position order');
        text(p.title);
        check(formats.includes(p.format), 'format');
        num(p.maxPoints, 1, 100);
        ids(p.topics);
        ids(p.skills);
        ids(p.needs);
        check(['exact', 'unordered', 'hamming', 'pair-partial', 'manual'].includes(p.scoring), 'scoring');
        for (const key of ['criteria', 'source', 'pages'])
            text(p[key]);
        if (['extended', 'essay'].includes(p.format))
            check(p.scoring === 'manual', 'manual scoring');
    });
    check(ps.reduce((s, p) => s + p.maxPoints, 0) === m.maxPoints, 'total points');
    return input as ExamDefinition;
}
export function validateExamTask(input: unknown): ExamTask {
    const t = obj(input, ['id', 'version', 'positionId', 'familyId', 'question', 'format', 'assessment', 'assets'], ['generation', 'manualCriteria']);
    for (const key of ['id', 'positionId', 'familyId'])
        id(t[key]);
    num(t.version, 1);
    check(formats.includes(t.format), 'task format');
    check(['automatic', 'manual'].includes(t.assessment), 'assessment');
    const q = validateQuestion(t.question);
    check(q.id === t.id && q.version === t.version && q.sourceType === 'exam' && q.examTaskType === t.positionId, 'task identity');
    check(!['code', 'choice', 'multiple-choice', 'selection'].includes(q.answerType), 'unsupported exam response');
    if (t.generation !== undefined) {
        const g = obj(t.generation, ['generatorId', 'version', 'seed', 'parameters']);
        id(g.generatorId);
        num(g.version, 1);
        text(g.seed, 500);
        check(g.parameters && typeof g.parameters === 'object' && !Array.isArray(g.parameters) && Object.keys(g.parameters).length <= 100, 'parameters');
        for (const [key, value] of Object.entries(g.parameters)) {
            id(key);
            check(typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value)), 'parameter value');
            if (typeof value === 'string')
                text(value, 500);
        }
    }
    if (t.manualCriteria !== undefined) {
        check(t.assessment === 'manual', 'manual rubric mode');
        for (const v of list(t.manualCriteria, 100)) {
            const c = obj(v, ['id', 'title', 'maxPoints', 'source']);
            id(c.id);
            text(c.title);
            text(c.source);
            num(c.maxPoints, 1, 100);
        }
    }
    if (t.assessment === 'automatic') {
        check(!['pair', 'extended', 'essay'].includes(t.format), 'unsupported automatic rubric');
        const r = gradeExam(t as ExamTask, q.answer);
        check(r.valid && r.correct, 'canonical answer');
    }
    const assets = list(t.assets, 20);
    if (t.assessment === 'automatic')
        check(assets.length === 0, 'asset display mechanism is not implemented');
    for (const v of assets) {
        const a = obj(v, ['id', 'path', 'kind', 'sha256']);
        id(a.id);
        text(a.path);
        check(!a.path.includes('..') && !/^(?:[a-z]+:|[\\/])/i.test(a.path), 'local asset path');
        check(['table', 'file', 'image', 'graph'].includes(a.kind) && /^[0-9a-f]{64}$/.test(a.sha256), 'asset');
    }
    return input as ExamTask;
}
export function validateExamProgress(input: unknown): ExamProgress {
    const p = obj(input, ['schemaVersion', 'maps', 'snapshots', 'sessions']);
    check(p.schemaVersion === 1, 'exam schema');
    for (const field of ['maps', 'snapshots']) {
        check(p[field] && typeof p[field] === 'object' && !Array.isArray(p[field]), field);
        check(Object.keys(p[field]).length <= 10000, field + ' size');
        Object.keys(p[field]).forEach(id);
    }
    for (const [key, m] of Object.entries(p.maps))
        check(mapKey(validateExamMap(m)) === key, 'map key');
    for (const [key, t] of Object.entries(p.snapshots))
        check(taskKey(validateExamTask(t)) === key, 'snapshot key');
    const sessionIds = new Set(), attemptIds = new Set();
    for (const v of list(p.sessions, 10000)) {
        const s = obj(v, ['id', 'mapKey', 'mode', 'seed', 'startedAt', 'durationSeconds', 'elapsedFloor', 'index', 'items'], ['completedAt']);
        id(s.id);
        check(/^[A-Za-z0-9._-]+$/.test(s.id), 'session route id');
        check(!sessionIds.has(s.id), 'session id');
        sessionIds.add(s.id);
        id(s.mapKey);
        const map = p.maps[s.mapKey];
        check(map, 'missing map');
        check(['number', 'custom', 'full'].includes(s.mode), 'mode');
        text(s.seed, 500);
        instant(s.startedAt);
        if (s.completedAt !== undefined) {
            instant(s.completedAt);
            check(s.completedAt >= s.startedAt, 'completed time');
        }
        num(s.elapsedFloor);
        const items = list(s.items, 50);
        check(items.length, 'items');
        num(s.index, 0, items.length - 1);
        check(s.mode === 'full' ? s.durationSeconds === map.durationMinutes * 60 : s.durationSeconds === null, 'duration');
        const used = new Set();
        for (const v of items) {
            const item = obj(v, ['key', 'answer', 'draft', 'assisted', 'attempts']);
            id(item.key);
            check(p.snapshots[item.key] && !used.has(item.key), 'item key');
            used.add(item.key);
            const t = p.snapshots[item.key];
            const pos = map.positions.find((x: any) => x.id === t.positionId);
            check(pos && t.question.subject === map.subject, 'position reference');
            text(item.answer);
            text(item.draft);
            check(typeof item.assisted === 'boolean', 'assisted');
            let last = s.startedAt;
            for (const v of list(item.attempts, 10000)) {
                const a = obj(v, ['id', 'answer', 'correct', 'points', 'at', 'assisted']);
                id(a.id);
                check(!attemptIds.has(a.id), 'attempt id');
                attemptIds.add(a.id);
                text(a.answer);
                check(typeof a.correct === 'boolean' && typeof a.assisted === 'boolean', 'result');
                instant(a.at);
                check(a.at >= last && (!s.completedAt || a.at <= s.completedAt), 'attempt time');
                last = a.at;
                const grade = gradeExam(t, a.answer);
                check(grade.valid && grade.correct === a.correct && a.points === (a.correct ? pos.maxPoints : 0), 'result integrity');
                if (a.assisted)
                    check(item.assisted, 'assisted history');
            }
        }
        if (s.mode === 'number')
            check(new Set(items.map(i => p.snapshots[i.key].positionId)).size === 1, 'number mode');
        if (s.mode === 'full')
            check(items.length === map.positions.length && new Set(items.map(i => p.snapshots[i.key].positionId)).size === map.positions.length && items.every(i => p.snapshots[i.key].assessment === 'automatic' && !map.positions.find((r: any) => r.id === p.snapshots[i.key].positionId).needs.length), 'incomplete full exam');
    }
    return input as ExamProgress;
}
