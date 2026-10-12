# Собственный независимый пакет: проверенная часть

2026-10-12, `content-expansion-3c2`, приложение 0.5.0.
Подготовлено **36**, а не 500 задач. Остальные 464 не созданы и не учитываются
в банке. Пакет намеренно ограничен объёмом проверенных разных постановок.

| Предмет | Задачи | Практика | Контроль | Программирование |
|---|---:|---:|---:|---:|
| Математика | 6 | 5 | 1 | 0 |
| Русский | 6 | 5 | 1 | 0 |
| Информатика | 6 | 5 | 1 | 0 |
| Python | 18 | 15 | 3 | 15 |
| Всего | 36 | 30 | 6 | 15 |

Все ID начинаются с `codex500-`. Учебное происхождение generated, не official;
examTaskType=null. Две лёгких, 31 средняя, три сложных задачи. Сложные — написание
слияния отсортированных списков, транспонирования и полной проверки формата времени;
уровень относится к начинающему программисту, не к сложности полного КИМ.

## Содержание и независимая проверка

Математика: восстановление запаса после двух расходов долей, сравнение стратегий
скидки, модель двух размеров коробок, площадь и периметр с отбрасыванием отрицательного
корня, два извлечения без возвращения, взвешенная средняя двух групп.
Ответы посчитаны отдельно через Fraction, перебор подходящих величин/корней и
явные упорядоченные пары жетонов. Ответы не получаются заменой одного числа в
условиях архива. Это учебные модели, не автоматически подтверждённые номера ЕГЭ.

Русский: полные оригинальные короткие тексты опыта, регламента, портрета,
опровержения поспешного вывода, местоименной связи и причинного рассуждения.
Все альтернативы разобраны в объяснениях и реестре. Контрольный текст иной,
чем тексты практики. Один стиль/тип речи — метод, а не отдельный навык для каждого
нового сюжета. Профессиональная филологическая экспертиза не заявляется.

Информатика: побайтовое округление каждой записи, заголовки пакетов включая
неполный, разрядная модель неизвестного основания и допустимость цифр,
пересечение логических ограничений, декодирование и подсчёт конкретной буквы,
полный видимый набор строк и два критерия фильтрации. Ответы проверяются отдельным
расчётом/перебором, а не совпадением с тем же генератором параметров.

Python: 15 функций — серии, слияние, только однократные значения, разбиение по знаку,
транспонирование, пропущенные числа, общий суффикс, HH:MM, знаковые целые токены,
перекрывающиеся пары, остатки товаров, первый локальный пик, баланс всех префиксов,
разворот блоков и ближайшее к нулю с разрешением равенства. Ещё три задания на
чтение кода. Эталоны используют существующий Runner, дополнительных пакетов нет.

Ожидания программных тестов сформулированы по спецификациям и проверены другим
алгоритмом: groupby против счётчика серии; сортировка против двух указателей;
count против словаря; zip против вложенных индексов; перебор всех допустимых часов
против разбора строки; regex против проверки символов; прямые суммы префиксов
против накопителя. Каждому эталону противопоставлены два неверных алгоритма.
Все видимые примеры имеют корректные аргументы/return; для таблицы и пика
предусмотрен содержательный непустой пример. Границы ввода описаны отдельно.

Автоматическая проверка оценивает результат, не конкретные имена переменных и
не стиль реализации. Не проверяет намерения, неизменность аргументов, сложность
алгоритма или секретность локальных hidden tests. Expected values не передаются
в Worker. Run не оценивается; Check сохраняет тренировочный или первый контрольный
результат по существующим правилам. Схема/формат backup не изменены.

36 ID, роли, семейства и альтернативы: `sources/codex500-review.json`.
Последние реально выполненные результаты Pyodide и общих регрессий перечислены
в `CONTENT-CROSS-REVIEW.md`. Объём до 500 — незавершённая часть общей цели, которую
следует продолжать отдельными небольшими проверенными подборками после ревью.

## Реестр ID

| ID | Решение / режим | Метод проверки | Семейство |
|---|---|---|---|
| codex500-math-remaining-share | practice / practice | manual editorial / independent numerical calculation | fraction-two-stage-restore |
| codex500-math-two-discounts | practice / practice | manual editorial / independent numerical calculation | percent-compare-two-strategies |
| codex500-math-boxes-model | practice / practice | manual editorial / independent numerical calculation | linear-two-group-model |
| codex500-math-rectangle-border | practice / practice | manual editorial / independent numerical calculation | quadratic-model-perimeter |
| codex500-math-without-replacement | practice / practice | manual editorial / independent numerical calculation | probability-two-draw-colours |
| codex500-math-weighted-mean | test / test | manual editorial / independent numerical calculation | statistics-weighted-two-groups |
| codex500-russian-laboratory-style | practice / practice | manual editorial / independent numerical calculation | text-functional-style |
| codex500-russian-instruction-style | practice / practice | manual editorial / independent numerical calculation | text-functional-style |
| codex500-russian-portrait-type | practice / practice | manual editorial / independent numerical calculation | text-speech-type |
| codex500-russian-counterargument | practice / practice | manual editorial / independent numerical calculation | text-statement-evidence |
| codex500-russian-pronoun-clear | practice / practice | manual editorial / independent numerical calculation | text-cohesion |
| codex500-russian-reasoning-type | test / test | manual editorial / independent numerical calculation | text-speech-type |
| codex500-informatics-record-padding | practice / practice | manual editorial / independent numerical calculation | encoding-record-rounding |
| codex500-informatics-packet-overhead | practice / practice | manual editorial / independent numerical calculation | information-packet-header |
| codex500-informatics-base-equation | practice / practice | manual editorial / independent numerical calculation | base-polynomial-equation |
| codex500-informatics-logic-window | practice / practice | manual editorial / independent numerical calculation | logic-exclusive-interval |
| codex500-informatics-prefix-word | practice / practice | manual editorial / independent numerical calculation | encoding-prefix-word |
| codex500-informatics-filter-two | test / test | manual editorial / independent numerical calculation | table-conjunctive-filter |
| codex500-python-runs | practice / practice | alternate oracle + CPython/Pyodide | python-runs |
| codex500-python-merge | practice / practice | alternate oracle + CPython/Pyodide | python-merge |
| codex500-python-once | practice / practice | alternate oracle + CPython/Pyodide | python-once |
| codex500-python-signs | practice / practice | alternate oracle + CPython/Pyodide | python-signs |
| codex500-python-transpose | practice / practice | alternate oracle + CPython/Pyodide | python-transpose |
| codex500-python-missing | practice / practice | alternate oracle + CPython/Pyodide | python-missing |
| codex500-python-suffix | practice / practice | alternate oracle + CPython/Pyodide | python-suffix |
| codex500-python-clock | test / test | alternate oracle + CPython/Pyodide | python-clock |
| codex500-python-tokens | practice / practice | alternate oracle + CPython/Pyodide | python-tokens |
| codex500-python-pair-sums | practice / practice | alternate oracle + CPython/Pyodide | python-pair-sums |
| codex500-python-stock | practice / practice | alternate oracle + CPython/Pyodide | python-stock |
| codex500-python-peak | test / test | alternate oracle + CPython/Pyodide | python-peak |
| codex500-python-balanced | practice / practice | alternate oracle + CPython/Pyodide | python-balanced |
| codex500-python-blocks | practice / practice | alternate oracle + CPython/Pyodide | python-blocks |
| codex500-python-nearest | test / test | alternate oracle + CPython/Pyodide | python-nearest |
| codex500-python-dict-order | practice / practice | manual editorial / independent numerical calculation | python-dict-order |
| codex500-python-loop-continue | practice / practice | manual editorial / independent numerical calculation | python-loop-continue |
| codex500-python-return-stop | practice / practice | manual editorial / independent numerical calculation | python-return-stop |
