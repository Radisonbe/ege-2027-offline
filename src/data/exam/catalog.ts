import maps from './maps.json';
import tasks from './tasks.json';
import { validateExamMap, validateExamTask } from '../../domain/exam-validation';
import type { ExamDefinition, ExamTask } from '../../domain/exam';
export const examDiagnostics: string[] = [];
export const exams: ExamDefinition[] = [];
export const examTasks: ExamTask[] = [];
try {
    if (maps.schemaVersion !== 1)
        throw Error('Версия карты');
    for (const map of maps.exams)
        exams.push(validateExamMap(map));
}
catch {
    exams.length = 0;
    examDiagnostics.push('Карта экзаменов требует проверки.');
}
try {
    if (tasks.schemaVersion !== 1)
        throw Error('Версия банка');
    const ids = new Set();
    for (const task of tasks.tasks) {
        const t = validateExamTask(task);
        if (ids.has(t.id) || !exams.some(m => m.positions.some(p => p.id === t.positionId)))
            throw Error('Связи банка');
        ids.add(t.id);
        examTasks.push(t);
    }
}
catch {
    examTasks.length = 0;
    examDiagnostics.push('Экзаменационный банк временно недоступен; обычный учебный банк сохранён.');
}
