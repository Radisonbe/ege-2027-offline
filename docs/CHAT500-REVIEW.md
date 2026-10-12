# Независимая проверка авторского архива EGE500-01

Дата: 2026-10-12. База: `c791d6053b93a8a4c72fd2c5857bf21982671151`,
ветка `content-expansion-3c2`, приложение 0.5.0. Это локальный пакет для ревью.

Архив SHA-256: `5bed21061e5d11429228b2c4a6d16dc6dbc10ce54240bd6700c46b71941897a4`.
Внешний CODEX_PROMPT.md полностью прочитан и совпадает с файлом в архиве.
Исходный архив, копии документов ФИПИ, тестовые профили и промежуточные сборки
остаются вне отслеживаемых файлов. Предварительный авторский self-check выполнен
отдельно в изолированной папке; он не заменяет приведённые ниже проверки.

| Предмет | Получено | Принято без изменения объекта | Исправлено | Отклонено | Включено |
|---|---:|---:|---:|---:|---:|
| Математика | 170 | 90 | 76 | 4 | 166 |
| Русский | 150 | 25 | 123 | 2 | 148 |
| Информатика | 110 | 62 | 35 | 13 | 97 |
| Python | 70 | 17 | 47 | 6 | 64 |
| Всего | 500 | 194 | 281 | 25 | 475 |

«Исправлено» включает изменения условий, объяснений, вариантов, порядка вариантов,
навыков, подтем, сложности и тестов, а не только исправление числового ответа.
У изменённых объектов version=2; у десяти задач (семи программ и трёх вопросов к научному тексту) после финального уточнения version=3. Промежуточные снимки v2 сохраняют смысл; исходные ID сохранены. Ни один объект старого
банка не изменён. Классификация метода хранится отдельно в реестре aliases v3.

Все 475 задач — практика. Ноль передано в контрольный или экзаменационный банк.
Соседние вопросы к одному тексту не являются независимой проверкой понимания.
Оставлены полезные числовые варианты одного метода; они не объявляются новыми
экзаменационными типами. 132 исходные метки семейства укрупнены; особенно 60
вопросов к 15 текстам теперь относятся к четырём методам анализа, а не к 60.

## Проверки и исправления

- 500 объектов прошли исходную проверку схемы и ссылок; затем исправленный банк
  вновь проходит строгий штатный валидатор, проверку уроков и распределения режимов.
- Все 280 числовых/алгоритмических условий разобраны отдельным Python-оракулом:
  целочисленные числители/знаменатели и НОК; перебор корней с подстановкой и
  фильтром положительных размеров; копейки для процентов; разряды и обратный
  перевод; перебор логики; топологический подсчёт путей вместо авторского DFS.
  Проверка в `scripts/author500-oracles.py` запускается при production build.
- Все 58 исходных прогнозов Python повторно исполнены в CPython. Два семантических
  повтора исключены. Пять информатических прогнозов получили отдельный code block:
  Python не поступает в рендерер обычного учебного текста.
- Все 150 русских условий, полные тексты и все альтернативы прочитаны. Реестр
  содержит отдельный вердикт по каждому варианту. Это редакционная проверка Codex,
  не независимая экспертиза профессионального филолога.
- Исключены два вопроса о «ведущем типе речи» в инструкциях; в двух других вопрос
  уточнён до конкретного причинного фрагмента. Уточнён antecedent «Этот режим» и
  «Эта задача», действие причастия с зависимыми словами, место стука героя,
  временные/водные контексты. Одиночное деепричастие больше не называется оборотом.
- Заменены дистракторы на грамматическую основу и пунктуацию, сводившиеся к
  абсурдным обобщениям или двойным запятым. Порядок вариантов меняется
  детерминированно, и нумерация объяснений синхронизирована с фактическим порядком.
- Исправлен «полный развёрнутый угол»: π радиан — развёрнутый угол 180°.
  В задачах двух мастеров отдельно указаны две производительности.
- Уточнены реально проверяемые навыки стиля/типа/содержания текста, восстановления
  целого, дополнения процентов, обработки последовательностей и строк.
- Десять исходных программ проверены на эталонах и двух неверных алгоритмах,
  включая две отклонённые как дубли. Для восьми включённых программ расширены
  границы. `distinct_letters` отбирает исходные ASCII-буквы до lower(): исходный
  вариант ошибочно учитывал İ и K. Добавлены Unicode, нули, отрицательные числа,
  длинные серии и списки, разные пробелы. Произведение ограничено точными целыми.
- Проверка `swap_adjacent` сравнивает возвращённое содержимое, не тождество объекта
  и неизменность аргумента; это прямо указано в условии. Runner не менялся.

Автоматическая арифметическая проверка не доказывает литературное качество
объяснения. Все объяснения прочитаны редакционно; автоматический тест оракула
заявляет числовую/алгоритмическую корректность, не машинную проверку каждой фразы.

## Повторы

Сравнение проведено с 699 статическими задачами и 432 вариантами генераторов.
Использованы исходные параметры операций, AST прогнозов Python с нормализацией
имён, словарное сходство и содержательный разбор. Для графов учитывается
изоморфность, а не название вершины. Выявлено 22 повтора; дополнительно исключены
вырожденная доля 4/4 и два неоднозначных вопроса. У 76 включённых условий
лексическое сходство с базой ≥0,8; это сигнал одного метода, не 76 новых методов.
Разные числа допустимы как тренировочные варианты, не как доказательство
новой типологии. Доказательства отказов и сравниваемые ID приведены в реестре.

Полный проверяемый реестр 500 решений: `sources/chat500-review.json`.
Там находятся исходный SHA объекта, статус, причины, изменённые поля, mode,
canonical family, optionReview, вычисленный ответ и промежуточные данные;
numericalFixtures позволяют повторить проверку и исключённых числовых условий.
Задачи для приложения находятся только в `src/data/banks/author-chat500-*.json`.

## Ограничения

Это преимущественно закрепление базы: 130 лёгких и 345 средних, без сложных.
Содержательные варианты одного алгоритма не заменяют развитие новых методов.
Семантический аудит не является доказательством глобальной уникальности текста
во всём интернете. Внешние банки не выгружались. Русские материалы перед выпуском
рекомендуются к независимому филологическому просмотру.

Итоговые результаты браузерной матрицы, сборки и размера находятся в
`CONTENT-CROSS-REVIEW.md`; они заполняются по последнему реальному прогону.

## Реестр ID

| ID | Решение / режим | Метод проверки | Семейство |
|---|---|---|---|
| chat500-math-001 | accepted / practice | independent-prompt-derived-integer/enumeration | fraction-common-denominator |
| chat500-math-002 | accepted / practice | independent-prompt-derived-integer/enumeration | fraction-common-denominator |
| chat500-math-003 | accepted / practice | independent-prompt-derived-integer/enumeration | fraction-common-denominator |
| chat500-math-004 | accepted / practice | independent-prompt-derived-integer/enumeration | fraction-common-denominator |
| chat500-math-005 | accepted / practice | independent-prompt-derived-integer/enumeration | fraction-common-denominator |
| chat500-math-006 | accepted / practice | independent-prompt-derived-integer/enumeration | fraction-common-denominator |
| chat500-math-007 | accepted / practice | independent-prompt-derived-integer/enumeration | fraction-common-denominator |
| chat500-math-008 | accepted / practice | independent-prompt-derived-integer/enumeration | fraction-common-denominator |
| chat500-math-009 | corrected / practice | independent-prompt-derived-integer/enumeration | fraction-product-quotient |
| chat500-math-010 | corrected / practice | independent-prompt-derived-integer/enumeration | fraction-product-quotient |
| chat500-math-011 | corrected / practice | independent-prompt-derived-integer/enumeration | fraction-product-quotient |
| chat500-math-012 | corrected / practice | independent-prompt-derived-integer/enumeration | fraction-product-quotient |
| chat500-math-013 | corrected / practice | independent-prompt-derived-integer/enumeration | fraction-product-quotient |
| chat500-math-014 | corrected / practice | independent-prompt-derived-integer/enumeration | fraction-product-quotient |
| chat500-math-015 | corrected / practice | independent-prompt-derived-integer/enumeration | fraction-product-quotient |
| chat500-math-016 | corrected / practice | independent-prompt-derived-integer/enumeration | fraction-product-quotient |
| chat500-math-017 | corrected / practice | independent-prompt-derived-integer/enumeration | fraction-restore-whole |
| chat500-math-018 | corrected / practice | independent-prompt-derived-integer/enumeration | fraction-restore-whole |
| chat500-math-019 | corrected / practice | independent-prompt-derived-integer/enumeration | fraction-restore-whole |
| chat500-math-020 | corrected / practice | independent-prompt-derived-integer/enumeration | fraction-restore-whole |
| chat500-math-021 | corrected / practice | independent-prompt-derived-integer/enumeration | fraction-restore-whole |
| chat500-math-022 | rejected / None | independent-prompt-derived-integer/enumeration | chat500-restore-whole |
| chat500-math-023 | corrected / practice | independent-prompt-derived-integer/enumeration | fraction-restore-whole |
| chat500-math-024 | corrected / practice | independent-prompt-derived-integer/enumeration | fraction-restore-whole |
| chat500-math-025 | accepted / practice | independent-prompt-derived-integer/enumeration | percent-direct |
| chat500-math-026 | accepted / practice | independent-prompt-derived-integer/enumeration | percent-direct |
| chat500-math-027 | accepted / practice | independent-prompt-derived-integer/enumeration | percent-direct |
| chat500-math-028 | accepted / practice | independent-prompt-derived-integer/enumeration | percent-direct |
| chat500-math-029 | accepted / practice | independent-prompt-derived-integer/enumeration | percent-direct |
| chat500-math-030 | accepted / practice | independent-prompt-derived-integer/enumeration | percent-direct |
| chat500-math-031 | accepted / practice | independent-prompt-derived-integer/enumeration | percent-direct |
| chat500-math-032 | accepted / practice | independent-prompt-derived-integer/enumeration | percent-direct |
| chat500-math-033 | corrected / practice | independent-prompt-derived-integer/enumeration | percent-restore-price |
| chat500-math-034 | corrected / practice | independent-prompt-derived-integer/enumeration | percent-restore-price |
| chat500-math-035 | rejected / None | independent-prompt-derived-integer/enumeration | chat500-restore-original |
| chat500-math-036 | corrected / practice | independent-prompt-derived-integer/enumeration | percent-restore-price |
| chat500-math-037 | corrected / practice | independent-prompt-derived-integer/enumeration | percent-restore-price |
| chat500-math-038 | corrected / practice | independent-prompt-derived-integer/enumeration | percent-restore-price |
| chat500-math-039 | corrected / practice | independent-prompt-derived-integer/enumeration | percent-restore-price |
| chat500-math-040 | corrected / practice | independent-prompt-derived-integer/enumeration | percent-restore-price |
| chat500-math-041 | accepted / practice | independent-prompt-derived-integer/enumeration | percent-multiplier-chain |
| chat500-math-042 | accepted / practice | independent-prompt-derived-integer/enumeration | percent-multiplier-chain |
| chat500-math-043 | accepted / practice | independent-prompt-derived-integer/enumeration | percent-multiplier-chain |
| chat500-math-044 | accepted / practice | independent-prompt-derived-integer/enumeration | percent-multiplier-chain |
| chat500-math-045 | accepted / practice | independent-prompt-derived-integer/enumeration | percent-multiplier-chain |
| chat500-math-046 | accepted / practice | independent-prompt-derived-integer/enumeration | percent-multiplier-chain |
| chat500-math-047 | accepted / practice | independent-prompt-derived-integer/enumeration | percent-multiplier-chain |
| chat500-math-048 | accepted / practice | independent-prompt-derived-integer/enumeration | percent-multiplier-chain |
| chat500-math-049 | accepted / practice | independent-prompt-derived-integer/enumeration | linear-equivalent-transformations |
| chat500-math-050 | accepted / practice | independent-prompt-derived-integer/enumeration | linear-equivalent-transformations |
| chat500-math-051 | accepted / practice | independent-prompt-derived-integer/enumeration | linear-equivalent-transformations |
| chat500-math-052 | accepted / practice | independent-prompt-derived-integer/enumeration | linear-equivalent-transformations |
| chat500-math-053 | accepted / practice | independent-prompt-derived-integer/enumeration | linear-equivalent-transformations |
| chat500-math-054 | accepted / practice | independent-prompt-derived-integer/enumeration | linear-equivalent-transformations |
| chat500-math-055 | accepted / practice | independent-prompt-derived-integer/enumeration | linear-equivalent-transformations |
| chat500-math-056 | accepted / practice | independent-prompt-derived-integer/enumeration | linear-equivalent-transformations |
| chat500-math-057 | accepted / practice | independent-prompt-derived-integer/enumeration | linear-denominator-clearing |
| chat500-math-058 | accepted / practice | independent-prompt-derived-integer/enumeration | linear-denominator-clearing |
| chat500-math-059 | accepted / practice | independent-prompt-derived-integer/enumeration | linear-denominator-clearing |
| chat500-math-060 | accepted / practice | independent-prompt-derived-integer/enumeration | linear-denominator-clearing |
| chat500-math-061 | accepted / practice | independent-prompt-derived-integer/enumeration | linear-denominator-clearing |
| chat500-math-062 | accepted / practice | independent-prompt-derived-integer/enumeration | linear-denominator-clearing |
| chat500-math-063 | accepted / practice | independent-prompt-derived-integer/enumeration | linear-denominator-clearing |
| chat500-math-064 | accepted / practice | independent-prompt-derived-integer/enumeration | linear-denominator-clearing |
| chat500-math-065 | accepted / practice | independent-prompt-derived-integer/enumeration | quadratic-factorization |
| chat500-math-066 | accepted / practice | independent-prompt-derived-integer/enumeration | quadratic-factorization |
| chat500-math-067 | accepted / practice | independent-prompt-derived-integer/enumeration | quadratic-factorization |
| chat500-math-068 | accepted / practice | independent-prompt-derived-integer/enumeration | quadratic-factorization |
| chat500-math-069 | accepted / practice | independent-prompt-derived-integer/enumeration | quadratic-factorization |
| chat500-math-070 | accepted / practice | independent-prompt-derived-integer/enumeration | quadratic-factorization |
| chat500-math-071 | accepted / practice | independent-prompt-derived-integer/enumeration | quadratic-factorization |
| chat500-math-072 | accepted / practice | independent-prompt-derived-integer/enumeration | quadratic-factorization |
| chat500-math-073 | corrected / practice | independent-prompt-derived-integer/enumeration | quadratic-geometry-model |
| chat500-math-074 | corrected / practice | independent-prompt-derived-integer/enumeration | quadratic-geometry-model |
| chat500-math-075 | corrected / practice | independent-prompt-derived-integer/enumeration | quadratic-geometry-model |
| chat500-math-076 | corrected / practice | independent-prompt-derived-integer/enumeration | quadratic-geometry-model |
| chat500-math-077 | corrected / practice | independent-prompt-derived-integer/enumeration | quadratic-geometry-model |
| chat500-math-078 | corrected / practice | independent-prompt-derived-integer/enumeration | quadratic-geometry-model |
| chat500-math-079 | corrected / practice | independent-prompt-derived-integer/enumeration | quadratic-geometry-model |
| chat500-math-080 | corrected / practice | independent-prompt-derived-integer/enumeration | quadratic-geometry-model |
| chat500-math-081 | rejected / None | independent-prompt-derived-integer/enumeration | chat500-exponent-laws |
| chat500-math-082 | accepted / practice | independent-prompt-derived-integer/enumeration | power-exponent-rules |
| chat500-math-083 | accepted / practice | independent-prompt-derived-integer/enumeration | power-exponent-rules |
| chat500-math-084 | accepted / practice | independent-prompt-derived-integer/enumeration | power-exponent-rules |
| chat500-math-085 | accepted / practice | independent-prompt-derived-integer/enumeration | power-exponent-rules |
| chat500-math-086 | accepted / practice | independent-prompt-derived-integer/enumeration | power-exponent-rules |
| chat500-math-087 | rejected / None | independent-prompt-derived-integer/enumeration | chat500-exponent-laws |
| chat500-math-088 | accepted / practice | independent-prompt-derived-integer/enumeration | power-exponent-rules |
| chat500-math-089 | accepted / practice | independent-prompt-derived-integer/enumeration | root-absolute |
| chat500-math-090 | accepted / practice | independent-prompt-derived-integer/enumeration | root-absolute |
| chat500-math-091 | accepted / practice | independent-prompt-derived-integer/enumeration | root-absolute |
| chat500-math-092 | accepted / practice | independent-prompt-derived-integer/enumeration | root-absolute |
| chat500-math-093 | accepted / practice | independent-prompt-derived-integer/enumeration | root-absolute |
| chat500-math-094 | accepted / practice | independent-prompt-derived-integer/enumeration | root-absolute |
| chat500-math-095 | accepted / practice | independent-prompt-derived-integer/enumeration | root-absolute |
| chat500-math-096 | accepted / practice | independent-prompt-derived-integer/enumeration | root-absolute |
| chat500-math-097 | accepted / practice | independent-prompt-derived-integer/enumeration | function-substitution |
| chat500-math-098 | accepted / practice | independent-prompt-derived-integer/enumeration | function-substitution |
| chat500-math-099 | accepted / practice | independent-prompt-derived-integer/enumeration | function-substitution |
| chat500-math-100 | accepted / practice | independent-prompt-derived-integer/enumeration | function-substitution |
| chat500-math-101 | accepted / practice | independent-prompt-derived-integer/enumeration | function-substitution |
| chat500-math-102 | accepted / practice | independent-prompt-derived-integer/enumeration | function-substitution |
| chat500-math-103 | accepted / practice | independent-prompt-derived-integer/enumeration | function-substitution |
| chat500-math-104 | accepted / practice | independent-prompt-derived-integer/enumeration | function-substitution |
| chat500-math-105 | corrected / practice | independent-prompt-derived-integer/enumeration | function-zero |
| chat500-math-106 | corrected / practice | independent-prompt-derived-integer/enumeration | function-zero |
| chat500-math-107 | corrected / practice | independent-prompt-derived-integer/enumeration | function-zero |
| chat500-math-108 | corrected / practice | independent-prompt-derived-integer/enumeration | function-zero |
| chat500-math-109 | corrected / practice | independent-prompt-derived-integer/enumeration | function-zero |
| chat500-math-110 | corrected / practice | independent-prompt-derived-integer/enumeration | function-zero |
| chat500-math-111 | corrected / practice | independent-prompt-derived-integer/enumeration | function-zero |
| chat500-math-112 | corrected / practice | independent-prompt-derived-integer/enumeration | function-zero |
| chat500-math-113 | corrected / practice | independent-prompt-derived-integer/enumeration | chat500-work-together |
| chat500-math-114 | corrected / practice | independent-prompt-derived-integer/enumeration | chat500-work-together |
| chat500-math-115 | corrected / practice | independent-prompt-derived-integer/enumeration | chat500-work-together |
| chat500-math-116 | corrected / practice | independent-prompt-derived-integer/enumeration | chat500-work-together |
| chat500-math-117 | corrected / practice | independent-prompt-derived-integer/enumeration | chat500-work-together |
| chat500-math-118 | corrected / practice | independent-prompt-derived-integer/enumeration | chat500-work-together |
| chat500-math-119 | corrected / practice | independent-prompt-derived-integer/enumeration | chat500-work-together |
| chat500-math-120 | corrected / practice | independent-prompt-derived-integer/enumeration | chat500-work-together |
| chat500-math-121 | corrected / practice | independent-prompt-derived-integer/enumeration | chat500-travel-units |
| chat500-math-122 | corrected / practice | independent-prompt-derived-integer/enumeration | chat500-travel-units |
| chat500-math-123 | corrected / practice | independent-prompt-derived-integer/enumeration | chat500-travel-units |
| chat500-math-124 | corrected / practice | independent-prompt-derived-integer/enumeration | chat500-travel-units |
| chat500-math-125 | corrected / practice | independent-prompt-derived-integer/enumeration | chat500-travel-units |
| chat500-math-126 | corrected / practice | independent-prompt-derived-integer/enumeration | chat500-travel-units |
| chat500-math-127 | corrected / practice | independent-prompt-derived-integer/enumeration | chat500-travel-units |
| chat500-math-128 | corrected / practice | independent-prompt-derived-integer/enumeration | chat500-travel-units |
| chat500-math-129 | accepted / practice | independent-prompt-derived-integer/enumeration | chat500-urn-complement |
| chat500-math-130 | accepted / practice | independent-prompt-derived-integer/enumeration | chat500-urn-complement |
| chat500-math-131 | accepted / practice | independent-prompt-derived-integer/enumeration | chat500-urn-complement |
| chat500-math-132 | accepted / practice | independent-prompt-derived-integer/enumeration | chat500-urn-complement |
| chat500-math-133 | accepted / practice | independent-prompt-derived-integer/enumeration | chat500-urn-complement |
| chat500-math-134 | accepted / practice | independent-prompt-derived-integer/enumeration | chat500-urn-complement |
| chat500-math-135 | accepted / practice | independent-prompt-derived-integer/enumeration | chat500-urn-complement |
| chat500-math-136 | accepted / practice | independent-prompt-derived-integer/enumeration | chat500-urn-complement |
| chat500-math-137 | accepted / practice | independent-prompt-derived-integer/enumeration | statistics-mean |
| chat500-math-138 | accepted / practice | independent-prompt-derived-integer/enumeration | statistics-mean |
| chat500-math-139 | accepted / practice | independent-prompt-derived-integer/enumeration | statistics-mean |
| chat500-math-140 | accepted / practice | independent-prompt-derived-integer/enumeration | statistics-mean |
| chat500-math-141 | accepted / practice | independent-prompt-derived-integer/enumeration | statistics-mean |
| chat500-math-142 | accepted / practice | independent-prompt-derived-integer/enumeration | statistics-mean |
| chat500-math-143 | accepted / practice | independent-prompt-derived-integer/enumeration | statistics-mean |
| chat500-math-144 | accepted / practice | independent-prompt-derived-integer/enumeration | statistics-mean |
| chat500-math-145 | corrected / practice | independent-prompt-derived-integer/enumeration | logic-integer-interval |
| chat500-math-146 | corrected / practice | independent-prompt-derived-integer/enumeration | logic-integer-interval |
| chat500-math-147 | corrected / practice | independent-prompt-derived-integer/enumeration | logic-integer-interval |
| chat500-math-148 | corrected / practice | independent-prompt-derived-integer/enumeration | logic-integer-interval |
| chat500-math-149 | corrected / practice | independent-prompt-derived-integer/enumeration | logic-integer-interval |
| chat500-math-150 | corrected / practice | independent-prompt-derived-integer/enumeration | logic-integer-interval |
| chat500-math-151 | corrected / practice | independent-prompt-derived-integer/enumeration | logic-integer-interval |
| chat500-math-152 | corrected / practice | independent-prompt-derived-integer/enumeration | logic-integer-interval |
| chat500-math-153 | accepted / practice | independent-prompt-derived-integer/enumeration | log-definition |
| chat500-math-154 | accepted / practice | independent-prompt-derived-integer/enumeration | log-definition |
| chat500-math-155 | accepted / practice | independent-prompt-derived-integer/enumeration | log-definition |
| chat500-math-156 | accepted / practice | independent-prompt-derived-integer/enumeration | log-definition |
| chat500-math-157 | corrected / practice | independent-prompt-derived-integer/enumeration | chat500-radians-to-degrees |
| chat500-math-158 | corrected / practice | independent-prompt-derived-integer/enumeration | chat500-radians-to-degrees |
| chat500-math-159 | corrected / practice | independent-prompt-derived-integer/enumeration | chat500-radians-to-degrees |
| chat500-math-160 | corrected / practice | independent-prompt-derived-integer/enumeration | chat500-radians-to-degrees |
| chat500-math-161 | corrected / practice | independent-prompt-derived-integer/enumeration | percent-direct |
| chat500-math-162 | corrected / practice | independent-prompt-derived-integer/enumeration | percent-direct |
| chat500-math-163 | corrected / practice | independent-prompt-derived-integer/enumeration | percent-direct |
| chat500-math-164 | corrected / practice | independent-prompt-derived-integer/enumeration | percent-direct |
| chat500-math-165 | corrected / practice | independent-prompt-derived-integer/enumeration | percent-direct |
| chat500-math-166 | corrected / practice | independent-prompt-derived-integer/enumeration | chat500-difference-model |
| chat500-math-167 | corrected / practice | independent-prompt-derived-integer/enumeration | chat500-difference-model |
| chat500-math-168 | corrected / practice | independent-prompt-derived-integer/enumeration | chat500-difference-model |
| chat500-math-169 | corrected / practice | independent-prompt-derived-integer/enumeration | chat500-difference-model |
| chat500-math-170 | corrected / practice | independent-prompt-derived-integer/enumeration | chat500-difference-model |
| chat500-russian-001 | corrected / practice | manual-editorial-review | text-statement-evidence |
| chat500-russian-002 | corrected / practice | manual-editorial-review | text-functional-style |
| chat500-russian-003 | corrected / practice | manual-editorial-review | text-speech-type |
| chat500-russian-004 | accepted / practice | manual-editorial-review | text-cohesion |
| chat500-russian-005 | corrected / practice | manual-editorial-review | text-statement-evidence |
| chat500-russian-006 | corrected / practice | manual-editorial-review | text-functional-style |
| chat500-russian-007 | corrected / practice | manual-editorial-review | text-speech-type |
| chat500-russian-008 | accepted / practice | manual-editorial-review | text-cohesion |
| chat500-russian-009 | corrected / practice | manual-editorial-review | text-statement-evidence |
| chat500-russian-010 | corrected / practice | manual-editorial-review | text-functional-style |
| chat500-russian-011 | corrected / practice | manual-editorial-review | text-speech-type |
| chat500-russian-012 | accepted / practice | manual-editorial-review | text-cohesion |
| chat500-russian-013 | corrected / practice | manual-editorial-review | text-statement-evidence |
| chat500-russian-014 | corrected / practice | manual-editorial-review | text-functional-style |
| chat500-russian-015 | corrected / practice | manual-editorial-review | text-speech-type |
| chat500-russian-016 | corrected / practice | manual-editorial-review | text-cohesion |
| chat500-russian-017 | corrected / practice | manual-editorial-review | text-statement-evidence |
| chat500-russian-018 | corrected / practice | manual-editorial-review | text-functional-style |
| chat500-russian-019 | corrected / practice | manual-editorial-review | text-speech-type |
| chat500-russian-020 | accepted / practice | manual-editorial-review | text-cohesion |
| chat500-russian-021 | corrected / practice | manual-editorial-review | text-statement-evidence |
| chat500-russian-022 | corrected / practice | manual-editorial-review | text-functional-style |
| chat500-russian-023 | corrected / practice | manual-editorial-review | text-speech-type |
| chat500-russian-024 | accepted / practice | manual-editorial-review | text-cohesion |
| chat500-russian-025 | corrected / practice | manual-editorial-review | text-statement-evidence |
| chat500-russian-026 | corrected / practice | manual-editorial-review | text-functional-style |
| chat500-russian-027 | corrected / practice | manual-editorial-review | text-speech-type |
| chat500-russian-028 | corrected / practice | manual-editorial-review | text-cohesion |
| chat500-russian-029 | corrected / practice | manual-editorial-review | text-statement-evidence |
| chat500-russian-030 | corrected / practice | manual-editorial-review | text-functional-style |
| chat500-russian-031 | corrected / practice | manual-editorial-review | text-speech-type |
| chat500-russian-032 | accepted / practice | manual-editorial-review | text-cohesion |
| chat500-russian-033 | corrected / practice | manual-editorial-review | text-statement-evidence |
| chat500-russian-034 | corrected / practice | manual-editorial-review | text-functional-style |
| chat500-russian-035 | corrected / practice | manual-editorial-review | text-speech-type |
| chat500-russian-036 | accepted / practice | manual-editorial-review | text-cohesion |
| chat500-russian-037 | corrected / practice | manual-editorial-review | text-statement-evidence |
| chat500-russian-038 | corrected / practice | manual-editorial-review | text-functional-style |
| chat500-russian-039 | corrected / practice | manual-editorial-review | text-speech-type |
| chat500-russian-040 | accepted / practice | manual-editorial-review | text-cohesion |
| chat500-russian-041 | corrected / practice | manual-editorial-review | text-statement-evidence |
| chat500-russian-042 | corrected / practice | manual-editorial-review | text-functional-style |
| chat500-russian-043 | corrected / practice | manual-editorial-review | text-speech-type |
| chat500-russian-044 | accepted / practice | manual-editorial-review | text-cohesion |
| chat500-russian-045 | corrected / practice | manual-editorial-review | text-statement-evidence |
| chat500-russian-046 | corrected / practice | manual-editorial-review | text-functional-style |
| chat500-russian-047 | corrected / practice | manual-editorial-review | text-speech-type |
| chat500-russian-048 | accepted / practice | manual-editorial-review | text-cohesion |
| chat500-russian-049 | corrected / practice | manual-editorial-review | text-statement-evidence |
| chat500-russian-050 | corrected / practice | manual-editorial-review | text-functional-style |
| chat500-russian-051 | rejected / None | manual-editorial-review | chat500-long-semantic-type-lab |
| chat500-russian-052 | accepted / practice | manual-editorial-review | text-cohesion |
| chat500-russian-053 | corrected / practice | manual-editorial-review | text-statement-evidence |
| chat500-russian-054 | corrected / practice | manual-editorial-review | text-functional-style |
| chat500-russian-055 | rejected / None | manual-editorial-review | chat500-long-semantic-type-hall |
| chat500-russian-056 | accepted / practice | manual-editorial-review | text-cohesion |
| chat500-russian-057 | corrected / practice | manual-editorial-review | text-statement-evidence |
| chat500-russian-058 | corrected / practice | manual-editorial-review | text-functional-style |
| chat500-russian-059 | corrected / practice | manual-editorial-review | text-speech-type |
| chat500-russian-060 | accepted / practice | manual-editorial-review | text-cohesion |
| chat500-russian-061 | corrected / practice | manual-editorial-review | part-of-speech-context |
| chat500-russian-062 | corrected / practice | manual-editorial-review | part-of-speech-context |
| chat500-russian-063 | corrected / practice | manual-editorial-review | part-of-speech-context |
| chat500-russian-064 | accepted / practice | manual-editorial-review | part-of-speech-context |
| chat500-russian-065 | corrected / practice | manual-editorial-review | part-of-speech-context |
| chat500-russian-066 | corrected / practice | manual-editorial-review | part-of-speech-context |
| chat500-russian-067 | corrected / practice | manual-editorial-review | part-of-speech-context |
| chat500-russian-068 | corrected / practice | manual-editorial-review | part-of-speech-context |
| chat500-russian-069 | corrected / practice | manual-editorial-review | part-of-speech-context |
| chat500-russian-070 | corrected / practice | manual-editorial-review | basis-case |
| chat500-russian-071 | corrected / practice | manual-editorial-review | basis-case |
| chat500-russian-072 | corrected / practice | manual-editorial-review | basis-case |
| chat500-russian-073 | corrected / practice | manual-editorial-review | basis-case |
| chat500-russian-074 | corrected / practice | manual-editorial-review | basis-case |
| chat500-russian-075 | corrected / practice | manual-editorial-review | basis-case |
| chat500-russian-076 | corrected / practice | manual-editorial-review | basis-case |
| chat500-russian-077 | corrected / practice | manual-editorial-review | basis-embedded-clause |
| chat500-russian-078 | accepted / practice | manual-editorial-review | basis-embedded-clause |
| chat500-russian-079 | corrected / practice | manual-editorial-review | union-member-test |
| chat500-russian-080 | accepted / practice | manual-editorial-review | union-member-test |
| chat500-russian-081 | corrected / practice | manual-editorial-review | union-member-test |
| chat500-russian-082 | accepted / practice | manual-editorial-review | union-member-test |
| chat500-russian-083 | corrected / practice | manual-editorial-review | union-member-test |
| chat500-russian-084 | accepted / practice | manual-editorial-review | union-member-test |
| chat500-russian-085 | corrected / practice | manual-editorial-review | union-member-test |
| chat500-russian-086 | accepted / practice | manual-editorial-review | union-member-test |
| chat500-russian-087 | corrected / practice | manual-editorial-review | union-member-test |
| chat500-russian-088 | corrected / practice | manual-editorial-review | punctuation-homogeneous |
| chat500-russian-089 | corrected / practice | manual-editorial-review | punctuation-two-clauses |
| chat500-russian-090 | corrected / practice | manual-editorial-review | punctuation-address |
| chat500-russian-091 | corrected / practice | manual-editorial-review | punctuation-contrast |
| chat500-russian-092 | corrected / practice | manual-editorial-review | punctuation-common-modifier |
| chat500-russian-093 | corrected / practice | manual-editorial-review | punctuation-contrast |
| chat500-russian-094 | corrected / practice | manual-editorial-review | punctuation-homogeneous |
| chat500-russian-095 | corrected / practice | manual-editorial-review | punctuation-address |
| chat500-russian-096 | corrected / practice | manual-editorial-review | punctuation-two-clauses |
| chat500-russian-097 | corrected / practice | manual-editorial-review | punctuation-participle-position |
| chat500-russian-098 | corrected / practice | manual-editorial-review | punctuation-participle-position |
| chat500-russian-099 | corrected / practice | manual-editorial-review | punctuation-participle-position |
| chat500-russian-100 | corrected / practice | manual-editorial-review | punctuation-participle-position |
| chat500-russian-101 | corrected / practice | manual-editorial-review | punctuation-participle-position |
| chat500-russian-102 | accepted / practice | manual-editorial-review | punctuation-participle-position |
| chat500-russian-103 | corrected / practice | manual-editorial-review | punctuation-participle-position |
| chat500-russian-104 | corrected / practice | manual-editorial-review | punctuation-participle-position |
| chat500-russian-105 | corrected / practice | manual-editorial-review | punctuation-participle-position |
| chat500-russian-106 | corrected / practice | manual-editorial-review | punctuation-gerund |
| chat500-russian-107 | corrected / practice | manual-editorial-review | punctuation-gerund |
| chat500-russian-108 | corrected / practice | manual-editorial-review | punctuation-gerund |
| chat500-russian-109 | corrected / practice | manual-editorial-review | punctuation-gerund |
| chat500-russian-110 | corrected / practice | manual-editorial-review | punctuation-gerund |
| chat500-russian-111 | corrected / practice | manual-editorial-review | punctuation-gerund |
| chat500-russian-112 | corrected / practice | manual-editorial-review | punctuation-gerund |
| chat500-russian-113 | corrected / practice | manual-editorial-review | punctuation-gerund |
| chat500-russian-114 | corrected / practice | manual-editorial-review | punctuation-gerund |
| chat500-russian-115 | corrected / practice | manual-editorial-review | spelling-preposition-vs-noun |
| chat500-russian-116 | corrected / practice | manual-editorial-review | spelling-preposition-vs-noun |
| chat500-russian-117 | corrected / practice | manual-editorial-review | spelling-preposition-vs-noun |
| chat500-russian-118 | corrected / practice | manual-editorial-review | spelling-preposition-vs-noun |
| chat500-russian-119 | corrected / practice | manual-editorial-review | spelling-preposition-vs-noun |
| chat500-russian-120 | corrected / practice | manual-editorial-review | spelling-preposition-vs-noun |
| chat500-russian-121 | corrected / practice | manual-editorial-review | spelling-preposition-vs-noun |
| chat500-russian-122 | accepted / practice | manual-editorial-review | spelling-preposition-vs-noun |
| chat500-russian-123 | corrected / practice | manual-editorial-review | spelling-preposition-vs-noun |
| chat500-russian-124 | corrected / practice | manual-editorial-review | spelling-verb-infinitive |
| chat500-russian-125 | corrected / practice | manual-editorial-review | spelling-verb-infinitive |
| chat500-russian-126 | corrected / practice | manual-editorial-review | spelling-verb-infinitive |
| chat500-russian-127 | corrected / practice | manual-editorial-review | spelling-verb-infinitive |
| chat500-russian-128 | corrected / practice | manual-editorial-review | spelling-verb-infinitive |
| chat500-russian-129 | corrected / practice | manual-editorial-review | spelling-verb-infinitive |
| chat500-russian-130 | corrected / practice | manual-editorial-review | spelling-verb-infinitive |
| chat500-russian-131 | corrected / practice | manual-editorial-review | spelling-verb-infinitive |
| chat500-russian-132 | corrected / practice | manual-editorial-review | spelling-verb-infinitive |
| chat500-russian-133 | corrected / practice | manual-editorial-review | basis-clause-count |
| chat500-russian-134 | corrected / practice | manual-editorial-review | basis-clause-count |
| chat500-russian-135 | corrected / practice | manual-editorial-review | basis-clause-count |
| chat500-russian-136 | accepted / practice | manual-editorial-review | basis-clause-count |
| chat500-russian-137 | corrected / practice | manual-editorial-review | basis-clause-count |
| chat500-russian-138 | corrected / practice | manual-editorial-review | basis-clause-count |
| chat500-russian-139 | corrected / practice | manual-editorial-review | basis-clause-count |
| chat500-russian-140 | accepted / practice | manual-editorial-review | basis-clause-count |
| chat500-russian-141 | corrected / practice | manual-editorial-review | basis-clause-count |
| chat500-russian-142 | corrected / practice | manual-editorial-review | chat500-two-sentence-cohesion |
| chat500-russian-143 | corrected / practice | manual-editorial-review | chat500-two-sentence-cohesion |
| chat500-russian-144 | accepted / practice | manual-editorial-review | chat500-two-sentence-cohesion |
| chat500-russian-145 | corrected / practice | manual-editorial-review | chat500-two-sentence-cohesion |
| chat500-russian-146 | corrected / practice | manual-editorial-review | chat500-two-sentence-cohesion |
| chat500-russian-147 | corrected / practice | manual-editorial-review | chat500-two-sentence-cohesion |
| chat500-russian-148 | accepted / practice | manual-editorial-review | chat500-two-sentence-cohesion |
| chat500-russian-149 | corrected / practice | manual-editorial-review | chat500-two-sentence-cohesion |
| chat500-russian-150 | corrected / practice | manual-editorial-review | chat500-two-sentence-cohesion |
| chat500-informatics-001 | accepted / practice | independent-prompt-derived-integer/enumeration | base-place-polynomial |
| chat500-informatics-002 | accepted / practice | independent-prompt-derived-integer/enumeration | base-place-polynomial |
| chat500-informatics-003 | accepted / practice | independent-prompt-derived-integer/enumeration | base-place-polynomial |
| chat500-informatics-004 | accepted / practice | independent-prompt-derived-integer/enumeration | base-place-polynomial |
| chat500-informatics-005 | accepted / practice | independent-prompt-derived-integer/enumeration | base-place-polynomial |
| chat500-informatics-006 | accepted / practice | independent-prompt-derived-integer/enumeration | base-place-polynomial |
| chat500-informatics-007 | accepted / practice | independent-prompt-derived-integer/enumeration | base-place-polynomial |
| chat500-informatics-008 | accepted / practice | independent-prompt-derived-integer/enumeration | base-place-polynomial |
| chat500-informatics-009 | accepted / practice | independent-prompt-derived-integer/enumeration | base-place-polynomial |
| chat500-informatics-010 | accepted / practice | independent-prompt-derived-integer/enumeration | base-place-polynomial |
| chat500-informatics-011 | corrected / practice | independent-prompt-derived-integer/enumeration | binary-place-value |
| chat500-informatics-012 | corrected / practice | independent-prompt-derived-integer/enumeration | binary-place-value |
| chat500-informatics-013 | corrected / practice | independent-prompt-derived-integer/enumeration | binary-place-value |
| chat500-informatics-014 | corrected / practice | independent-prompt-derived-integer/enumeration | binary-place-value |
| chat500-informatics-015 | corrected / practice | independent-prompt-derived-integer/enumeration | binary-place-value |
| chat500-informatics-016 | corrected / practice | independent-prompt-derived-integer/enumeration | binary-place-value |
| chat500-informatics-017 | corrected / practice | independent-prompt-derived-integer/enumeration | binary-place-value |
| chat500-informatics-018 | corrected / practice | independent-prompt-derived-integer/enumeration | binary-place-value |
| chat500-informatics-019 | corrected / practice | independent-prompt-derived-integer/enumeration | binary-place-value |
| chat500-informatics-020 | corrected / practice | independent-prompt-derived-integer/enumeration | binary-place-value |
| chat500-informatics-021 | accepted / practice | independent-prompt-derived-integer/enumeration | base-missing-digit |
| chat500-informatics-022 | accepted / practice | independent-prompt-derived-integer/enumeration | base-missing-digit |
| chat500-informatics-023 | accepted / practice | independent-prompt-derived-integer/enumeration | base-missing-digit |
| chat500-informatics-024 | accepted / practice | independent-prompt-derived-integer/enumeration | base-missing-digit |
| chat500-informatics-025 | accepted / practice | independent-prompt-derived-integer/enumeration | base-missing-digit |
| chat500-informatics-026 | accepted / practice | independent-prompt-derived-integer/enumeration | base-missing-digit |
| chat500-informatics-027 | accepted / practice | independent-prompt-derived-integer/enumeration | base-missing-digit |
| chat500-informatics-028 | accepted / practice | independent-prompt-derived-integer/enumeration | base-missing-digit |
| chat500-informatics-029 | accepted / practice | independent-prompt-derived-integer/enumeration | base-missing-digit |
| chat500-informatics-030 | accepted / practice | independent-prompt-derived-integer/enumeration | base-missing-digit |
| chat500-informatics-031 | rejected / None | independent-prompt-derived-integer/enumeration | chat500-unknown-base |
| chat500-informatics-032 | rejected / None | independent-prompt-derived-integer/enumeration | chat500-unknown-base |
| chat500-informatics-033 | rejected / None | independent-prompt-derived-integer/enumeration | chat500-unknown-base |
| chat500-informatics-034 | rejected / None | independent-prompt-derived-integer/enumeration | chat500-unknown-base |
| chat500-informatics-035 | rejected / None | independent-prompt-derived-integer/enumeration | chat500-unknown-base |
| chat500-informatics-036 | rejected / None | independent-prompt-derived-integer/enumeration | chat500-unknown-base |
| chat500-informatics-037 | rejected / None | independent-prompt-derived-integer/enumeration | chat500-unknown-base |
| chat500-informatics-038 | rejected / None | independent-prompt-derived-integer/enumeration | chat500-unknown-base |
| chat500-informatics-039 | rejected / None | independent-prompt-derived-integer/enumeration | chat500-unknown-base |
| chat500-informatics-040 | rejected / None | independent-prompt-derived-integer/enumeration | chat500-unknown-base |
| chat500-informatics-041 | accepted / practice | independent-prompt-derived-integer/enumeration | uniform-message-volume |
| chat500-informatics-042 | accepted / practice | independent-prompt-derived-integer/enumeration | uniform-message-volume |
| chat500-informatics-043 | accepted / practice | independent-prompt-derived-integer/enumeration | uniform-message-volume |
| chat500-informatics-044 | accepted / practice | independent-prompt-derived-integer/enumeration | uniform-message-volume |
| chat500-informatics-045 | accepted / practice | independent-prompt-derived-integer/enumeration | uniform-message-volume |
| chat500-informatics-046 | accepted / practice | independent-prompt-derived-integer/enumeration | uniform-message-volume |
| chat500-informatics-047 | accepted / practice | independent-prompt-derived-integer/enumeration | uniform-message-volume |
| chat500-informatics-048 | accepted / practice | independent-prompt-derived-integer/enumeration | uniform-message-volume |
| chat500-informatics-049 | accepted / practice | independent-prompt-derived-integer/enumeration | uniform-message-volume |
| chat500-informatics-050 | accepted / practice | independent-prompt-derived-integer/enumeration | uniform-message-volume |
| chat500-informatics-051 | accepted / practice | independent-prompt-derived-integer/enumeration | encoding-minimum-bits |
| chat500-informatics-052 | accepted / practice | independent-prompt-derived-integer/enumeration | encoding-minimum-bits |
| chat500-informatics-053 | accepted / practice | independent-prompt-derived-integer/enumeration | encoding-minimum-bits |
| chat500-informatics-054 | accepted / practice | independent-prompt-derived-integer/enumeration | encoding-minimum-bits |
| chat500-informatics-055 | accepted / practice | independent-prompt-derived-integer/enumeration | encoding-minimum-bits |
| chat500-informatics-056 | accepted / practice | independent-prompt-derived-integer/enumeration | encoding-minimum-bits |
| chat500-informatics-057 | accepted / practice | independent-prompt-derived-integer/enumeration | encoding-minimum-bits |
| chat500-informatics-058 | accepted / practice | independent-prompt-derived-integer/enumeration | encoding-minimum-bits |
| chat500-informatics-059 | accepted / practice | independent-prompt-derived-integer/enumeration | encoding-minimum-bits |
| chat500-informatics-060 | accepted / practice | independent-prompt-derived-integer/enumeration | encoding-minimum-bits |
| chat500-informatics-061 | corrected / practice | independent-prompt-derived-integer/enumeration | prefix-decoding |
| chat500-informatics-062 | corrected / practice | independent-prompt-derived-integer/enumeration | prefix-decoding |
| chat500-informatics-063 | corrected / practice | independent-prompt-derived-integer/enumeration | prefix-decoding |
| chat500-informatics-064 | corrected / practice | independent-prompt-derived-integer/enumeration | prefix-decoding |
| chat500-informatics-065 | corrected / practice | independent-prompt-derived-integer/enumeration | prefix-decoding |
| chat500-informatics-066 | corrected / practice | independent-prompt-derived-integer/enumeration | prefix-decoding |
| chat500-informatics-067 | corrected / practice | independent-prompt-derived-integer/enumeration | prefix-decoding |
| chat500-informatics-068 | corrected / practice | independent-prompt-derived-integer/enumeration | prefix-decoding |
| chat500-informatics-069 | corrected / practice | independent-prompt-derived-integer/enumeration | prefix-decoding |
| chat500-informatics-070 | corrected / practice | independent-prompt-derived-integer/enumeration | prefix-decoding |
| chat500-informatics-071 | accepted / practice | independent-prompt-derived-integer/enumeration | logic-integer-interval |
| chat500-informatics-072 | accepted / practice | independent-prompt-derived-integer/enumeration | logic-integer-interval |
| chat500-informatics-073 | accepted / practice | independent-prompt-derived-integer/enumeration | logic-integer-interval |
| chat500-informatics-074 | accepted / practice | independent-prompt-derived-integer/enumeration | logic-integer-interval |
| chat500-informatics-075 | accepted / practice | independent-prompt-derived-integer/enumeration | logic-integer-interval |
| chat500-informatics-076 | accepted / practice | independent-prompt-derived-integer/enumeration | logic-integer-interval |
| chat500-informatics-077 | accepted / practice | independent-prompt-derived-integer/enumeration | logic-integer-interval |
| chat500-informatics-078 | accepted / practice | independent-prompt-derived-integer/enumeration | logic-integer-interval |
| chat500-informatics-079 | accepted / practice | independent-prompt-derived-integer/enumeration | logic-integer-interval |
| chat500-informatics-080 | accepted / practice | independent-prompt-derived-integer/enumeration | logic-integer-interval |
| chat500-informatics-081 | rejected / None | independent-prompt-derived-integer/enumeration | chat500-directed-paths |
| chat500-informatics-082 | rejected / None | independent-prompt-derived-integer/enumeration | chat500-directed-paths |
| chat500-informatics-083 | rejected / None | independent-prompt-derived-integer/enumeration | chat500-directed-paths |
| chat500-informatics-084 | accepted / practice | independent-prompt-derived-integer/enumeration | graph-dag-path-count |
| chat500-informatics-085 | accepted / practice | independent-prompt-derived-integer/enumeration | graph-dag-path-count |
| chat500-informatics-086 | accepted / practice | independent-prompt-derived-integer/enumeration | graph-dag-path-count |
| chat500-informatics-087 | accepted / practice | independent-prompt-derived-integer/enumeration | graph-dag-path-count |
| chat500-informatics-088 | accepted / practice | independent-prompt-derived-integer/enumeration | graph-dag-path-count |
| chat500-informatics-089 | accepted / practice | independent-prompt-derived-integer/enumeration | graph-dag-path-count |
| chat500-informatics-090 | accepted / practice | independent-prompt-derived-integer/enumeration | graph-dag-path-count |
| chat500-informatics-091 | corrected / practice | independent-prompt-derived-integer/enumeration | chat500-filter-count |
| chat500-informatics-092 | corrected / practice | independent-prompt-derived-integer/enumeration | chat500-filter-count |
| chat500-informatics-093 | corrected / practice | independent-prompt-derived-integer/enumeration | chat500-filter-count |
| chat500-informatics-094 | corrected / practice | independent-prompt-derived-integer/enumeration | chat500-filter-count |
| chat500-informatics-095 | corrected / practice | independent-prompt-derived-integer/enumeration | chat500-filter-count |
| chat500-informatics-096 | corrected / practice | independent-prompt-derived-integer/enumeration | chat500-filter-count |
| chat500-informatics-097 | corrected / practice | independent-prompt-derived-integer/enumeration | chat500-filter-count |
| chat500-informatics-098 | corrected / practice | independent-prompt-derived-integer/enumeration | chat500-filter-count |
| chat500-informatics-099 | corrected / practice | independent-prompt-derived-integer/enumeration | chat500-filter-count |
| chat500-informatics-100 | corrected / practice | independent-prompt-derived-integer/enumeration | chat500-filter-count |
| chat500-informatics-101 | accepted / practice | independent-prompt-derived-integer/enumeration | algorithm-loop-boundary |
| chat500-informatics-102 | accepted / practice | independent-prompt-derived-integer/enumeration | algorithm-loop-boundary |
| chat500-informatics-103 | accepted / practice | independent-prompt-derived-integer/enumeration | algorithm-loop-boundary |
| chat500-informatics-104 | accepted / practice | independent-prompt-derived-integer/enumeration | algorithm-loop-boundary |
| chat500-informatics-105 | accepted / practice | independent-prompt-derived-integer/enumeration | algorithm-loop-boundary |
| chat500-informatics-106 | corrected / practice | independent-prompt-derived-integer/enumeration | chat500-python-even-range |
| chat500-informatics-107 | corrected / practice | independent-prompt-derived-integer/enumeration | chat500-python-even-range |
| chat500-informatics-108 | corrected / practice | independent-prompt-derived-integer/enumeration | chat500-python-even-range |
| chat500-informatics-109 | corrected / practice | independent-prompt-derived-integer/enumeration | chat500-python-even-range |
| chat500-informatics-110 | corrected / practice | independent-prompt-derived-integer/enumeration | chat500-python-even-range |
| chat500-python-001 | corrected / practice | isolated-actual-cpython | chat500-set-dedup |
| chat500-python-002 | corrected / practice | isolated-actual-cpython | chat500-set-dedup |
| chat500-python-003 | corrected / practice | isolated-actual-cpython | chat500-unpack-tuple |
| chat500-python-004 | corrected / practice | isolated-actual-cpython | chat500-unpack-tuple |
| chat500-python-005 | rejected / None | manual-editorial-review | chat500-file-open-mode |
| chat500-python-006 | rejected / None | manual-editorial-review | chat500-file-open-mode |
| chat500-python-007 | corrected / practice | isolated-actual-cpython | chat500-delimiter-split |
| chat500-python-008 | corrected / practice | isolated-actual-cpython | chat500-delimiter-split |
| chat500-python-009 | corrected / practice | isolated-actual-cpython | chat500-maximum-and-index |
| chat500-python-010 | corrected / practice | isolated-actual-cpython | chat500-maximum-and-index |
| chat500-python-011 | accepted / practice | isolated-actual-cpython | chat500-range-right-boundary |
| chat500-python-012 | accepted / practice | isolated-actual-cpython | chat500-range-right-boundary |
| chat500-python-013 | accepted / practice | isolated-actual-cpython | chat500-range-right-boundary |
| chat500-python-014 | accepted / practice | isolated-actual-cpython | chat500-range-right-boundary |
| chat500-python-015 | accepted / practice | isolated-actual-cpython | chat500-range-right-boundary |
| chat500-python-016 | corrected / practice | isolated-actual-cpython | python-nested-count |
| chat500-python-017 | rejected / None | isolated-actual-cpython | chat500-triangular-loop |
| chat500-python-018 | rejected / None | isolated-actual-cpython | chat500-triangular-loop |
| chat500-python-019 | corrected / practice | isolated-actual-cpython | python-nested-count |
| chat500-python-020 | corrected / practice | isolated-actual-cpython | python-nested-count |
| chat500-python-021 | corrected / practice | isolated-actual-cpython | chat500-string-slicing |
| chat500-python-022 | corrected / practice | isolated-actual-cpython | chat500-string-slicing |
| chat500-python-023 | corrected / practice | isolated-actual-cpython | chat500-string-slicing |
| chat500-python-024 | corrected / practice | isolated-actual-cpython | chat500-string-slicing |
| chat500-python-025 | corrected / practice | isolated-actual-cpython | chat500-string-slicing |
| chat500-python-026 | corrected / practice | isolated-actual-cpython | python-list-alias |
| chat500-python-027 | corrected / practice | isolated-actual-cpython | python-list-alias |
| chat500-python-028 | corrected / practice | isolated-actual-cpython | python-list-alias |
| chat500-python-029 | corrected / practice | isolated-actual-cpython | python-list-alias |
| chat500-python-030 | corrected / practice | isolated-actual-cpython | python-list-alias |
| chat500-python-031 | corrected / practice | isolated-actual-cpython | python-list-alias |
| chat500-python-032 | corrected / practice | isolated-actual-cpython | python-list-alias |
| chat500-python-033 | corrected / practice | isolated-actual-cpython | python-list-alias |
| chat500-python-034 | corrected / practice | isolated-actual-cpython | python-list-alias |
| chat500-python-035 | corrected / practice | isolated-actual-cpython | python-list-alias |
| chat500-python-036 | corrected / practice | isolated-actual-cpython | python-dict-update |
| chat500-python-037 | corrected / practice | isolated-actual-cpython | python-dict-update |
| chat500-python-038 | corrected / practice | isolated-actual-cpython | python-dict-update |
| chat500-python-039 | corrected / practice | isolated-actual-cpython | python-dict-update |
| chat500-python-040 | corrected / practice | isolated-actual-cpython | python-dict-update |
| chat500-python-041 | accepted / practice | isolated-actual-cpython | chat500-early-return |
| chat500-python-042 | accepted / practice | isolated-actual-cpython | chat500-early-return |
| chat500-python-043 | accepted / practice | isolated-actual-cpython | chat500-early-return |
| chat500-python-044 | accepted / practice | isolated-actual-cpython | chat500-early-return |
| chat500-python-045 | accepted / practice | isolated-actual-cpython | chat500-early-return |
| chat500-python-046 | corrected / practice | isolated-actual-cpython | chat500-default-parameter |
| chat500-python-047 | corrected / practice | isolated-actual-cpython | chat500-default-parameter |
| chat500-python-048 | corrected / practice | isolated-actual-cpython | chat500-default-parameter |
| chat500-python-049 | corrected / practice | isolated-actual-cpython | chat500-default-parameter |
| chat500-python-050 | corrected / practice | isolated-actual-cpython | chat500-default-parameter |
| chat500-python-051 | corrected / practice | isolated-actual-cpython | chat500-boolean-condition |
| chat500-python-052 | corrected / practice | isolated-actual-cpython | chat500-boolean-condition |
| chat500-python-053 | corrected / practice | isolated-actual-cpython | chat500-boolean-condition |
| chat500-python-054 | accepted / practice | isolated-actual-cpython | chat500-conversion-vs-concatenation |
| chat500-python-055 | accepted / practice | isolated-actual-cpython | chat500-conversion-vs-concatenation |
| chat500-python-056 | accepted / practice | isolated-actual-cpython | chat500-tuple-assignment |
| chat500-python-057 | accepted / practice | isolated-actual-cpython | chat500-tuple-assignment |
| chat500-python-058 | accepted / practice | isolated-actual-cpython | chat500-tuple-assignment |
| chat500-python-059 | accepted / practice | isolated-actual-cpython | chat500-tuple-assignment |
| chat500-python-060 | accepted / practice | isolated-actual-cpython | chat500-tuple-assignment |
| chat500-python-061 | rejected / None | native-reference-smoke-not-final-Pyodide | chat500-adjacent-rises |
| chat500-python-062 | corrected / practice | native-reference-smoke-not-final-Pyodide | chat500-swap-adjacent |
| chat500-python-063 | corrected / practice | native-reference-smoke-not-final-Pyodide | chat500-count-distinct-letters |
| chat500-python-064 | corrected / practice | native-reference-smoke-not-final-Pyodide | chat500-longest-run |
| chat500-python-065 | rejected / None | native-reference-smoke-not-final-Pyodide | chat500-aggregate-by-key |
| chat500-python-066 | corrected / practice | native-reference-smoke-not-final-Pyodide | chat500-two-even-check |
| chat500-python-067 | corrected / practice | native-reference-smoke-not-final-Pyodide | chat500-word-lengths |
| chat500-python-068 | corrected / practice | native-reference-smoke-not-final-Pyodide | chat500-last-even-index |
| chat500-python-069 | corrected / practice | native-reference-smoke-not-final-Pyodide | chat500-positive-product |
| chat500-python-070 | corrected / practice | native-reference-smoke-not-final-Pyodide | chat500-clipped-distance |
