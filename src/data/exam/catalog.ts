import maps from './maps.json';
import tasks from './tasks.json';
import { validateExamMap, validateExamTask, validateExamAlignment } from '../../domain/exam-validation';
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
const taskPacks = [tasks,...Object.values(import.meta.glob('./stage3c2-*.json', { eager:true, import:'default' }))] as typeof tasks[];
const taskIds = new Set<string>();
for(const pack of taskPacks){
    try {
        if(pack.schemaVersion!==1||!Array.isArray(pack.tasks))throw Error('Версия банка');
        const validated:ExamTask[]=[],localIds=new Set<string>();
        for(const raw of pack.tasks){
            const task=validateExamTask(raw),map=exams.find(m=>m.positions.some(p=>p.id===task.positionId));
            if(!map||taskIds.has(task.id)||localIds.has(task.id))throw Error('Связи банка');
            validateExamAlignment(map,task);localIds.add(task.id);validated.push(task);
        }
        validated.forEach(task=>{taskIds.add(task.id);examTasks.push(task);});
    }catch{examDiagnostics.push('Один экзаменационный пакет недоступен; остальные материалы и сохранения доступны.');}
}
