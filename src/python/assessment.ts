import type {PythonTest} from './tasks.ts';
export interface PythonActual {stdout:string;stderr:string;value?:unknown;ok:boolean;kind?:'syntax'|'runtime'|'timeout'|'stopped'|'infrastructure'}
function equal(a:unknown,b:unknown):boolean {
  if(a===b)return true;
  if(!a||!b||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))return false;
  const keys=Object.keys(a).sort(),other=Object.keys(b).sort();
  return keys.length===other.length&&keys.every((key,i)=>key===other[i]&&equal((a as Record<string,unknown>)[key],(b as Record<string,unknown>)[key]));
}
export function matchesPythonActual(actual:PythonActual,test:PythonTest) {
  const canonical=(text:string)=>text.replaceAll('\r\n','\n').replace(/\n$/,'');
  return actual.ok&&(test.expectedOutput===undefined||canonical(actual.stdout)===canonical(test.expectedOutput))
    &&(test.expectedReturn===undefined||equal(actual.value,test.expectedReturn));
}
export function pythonMismatch(actual:PythonActual,test?:PythonTest,functionTask=false):string {
 if(actual.kind==='syntax')return 'Python не смог прочитать программу. Проверь синтаксис и строку из traceback.';
 if(actual.kind==='runtime')return 'Во время выполнения возникло исключение. Его тип и строка указаны в traceback.';
 if(actual.kind==='timeout')return 'Превышен лимит времени. Выполнение остановлено; учебная ошибка не записана.';
 if(actual.kind==='stopped')return 'Проверка остановлена пользователем; учебная попытка не записана.';
 if(actual.kind==='infrastructure')return 'Проверка не завершена. Если достигнут предел вывода, ниже доступна только сохранённая часть, а не полный результат.';
 if(!test)return 'Полученный результат не соответствует дополнительному тесту. Проверь условие для других допустимых данных.';
 if(functionTask)return 'Функция вернула другое значение. Проверяется return, а не напечатанный текст.';
 const count=(text:string)=>text?text.split('\n').length-(text.endsWith('\n')?1:0):0;
 if(!actual.stdout&&test.expectedOutput)return 'Программа ничего не вывела, хотя ожидался результат.';
 const got=count(actual.stdout),expected=count(test.expectedOutput??'');
 return got>expected?`Получено ${got} строк вместо ${expected}. Проверь, что именно требуется напечатать.`:'Полученный вывод отличается от ожидаемого. Сверь значения, пробелы и порядок строк.';
}
