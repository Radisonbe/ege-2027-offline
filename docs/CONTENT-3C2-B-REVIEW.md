# Stage 3C.2 B — все 200 новых ID

Каждая строка сопоставлена с отдельной записью в sources/stage3c2-b-review.json. Полные выражения независимой проверки, разбор каждого языкового варианта, исходный Python и два неверных алгоритма хранятся там; условия, канонические ответы и тесты — в новых JSON-пакетах.

| ID | Тема / skills | Family ID | Режим | Проверка |
|---|---|---|---|---|
| c2b-informatics-binary-place-mask | binary / binary.skill.weight | binary-place-value | practice | independent-python: `int('10100101',2)` |
| c2b-informatics-binary-subtraction | binary / binary.skill.to-decimal | binary-arithmetic | practice | independent-python: `int('11010',2)-int('1011',2)` |
| c2b-informatics-binary-unknown-digit | binary / binary.skill.3b2-binary-base | base-missing-digit | practice | independent-python: `next(x for x in range(5) if 2*25+x*5+3==68)` |
| c2b-informatics-binary-base-restore | binary / binary.skill.3b2-binary-base | base-restore | practice | independent-python: `next(b for b in range(4,30) if 3*b+2==23)` |
| c2b-informatics-binary-trailing-capacity | binary / binary.skill.3b2-binary-rule | binary-shift | practice | independent-python: `13*pow(2,2)` |
| c2b-informatics-binary-leading | binary / binary.skill.to-decimal | binary-leading-zero | practice | independent-python: `int('000101',2)-int('101',2)` |
| c2b-informatics-binary-last-digit | binary / binary.skill.3b2-binary-rule | base-last-digit | practice | independent-python: `47%6` |
| c2b-informatics-binary-bit-capacity | binary / binary.skill.weight | binary-capacity | practice | independent-python: `len(list(product([0,1],repeat=5)))` |
| c2b-informatics-binary-order | binary / binary.skill.hex-to-decimal | base-compare | practice | independent-python: `max(int('10000',2),int('20',8),int('11',16))` |
| c2b-informatics-binary-complement | binary / binary.skill.weight | binary-complement | practice | independent-python: `255-int('00110110',2)` |
| c2b-informatics-binary-test-append-one | binary / binary.skill.3b2-binary-rule | binary-reconstruct-shift | test | independent-python: `next(n for n in range(1,50) if (2*n+1)*2==46)` |
| c2b-informatics-binary-test-count | binary / binary.skill.3b2-binary-base | base-allowed-digit-count | test | independent-python: `sum(1 for a in range(1,5) for b in range(5) if a+b==4)` |
| c2b-informatics-info-units-mixed | information / information.skill.units | information-units | practice | independent-python: `(3*1024+128)*8` |
| c2b-informatics-info-speed | information / information.skill.3c2-transmission | information-transmission | practice | independent-python: `Fraction(6*1024*8,4096)` |
| c2b-informatics-info-compression | information / information.skill.units | information-compression | practice | independent-python: `Fraction(9)/Fraction(3,8)` |
| c2b-informatics-info-two-channels | information / information.skill.3c2-transmission | information-staged-transfer | practice | independent-python: `2+Fraction(20*1024-2*4096,2048)` |
| c2b-informatics-info-packet-overhead | information / information.skill.units | information-block-overhead | practice | independent-python: `10000+24*next(n for n in range(20) if 1024*n>=10000)` |
| c2b-informatics-info-resolution | information / information.skill.units | information-image-scale | practice | independent-python: `160*120*8//8` |
| c2b-informatics-info-test-time-budget | information / information.skill.3c2-transmission | information-transmission | test | independent-python: `5*8000//8-200` |
| c2b-informatics-encoding-alphabet | encoding / encoding.skill.minimum-bits | encoding-minimum-bits | practice | independent-python: `next(n for n in range(12) if pow(2,n)>=70)` |
| c2b-informatics-encoding-capacity-inverse | encoding / encoding.skill.capacity | encoding-capacity | practice | independent-python: `pow(2,(40*8)//80)` |
| c2b-informatics-encoding-password | encoding / encoding.skill.bytes | encoding-record-rounding | practice | independent-python: `12*next(b for b in range(10) if b*8>=7*next(n for n in range(10) if pow(2,n)>=20))` |
| c2b-informatics-encoding-decode | encoding / encoding.skill.3b2-prefix | prefix-decoding | practice | independent-python: `decode_count('0110101110',['0','10','110','111'])` |
| c2b-informatics-encoding-new-letter | encoding / encoding.skill.3b2-prefix | prefix-shortest-extension | practice | independent-python: `min_prefix_length(['00','01','10'])` |
| c2b-informatics-encoding-redundancy | encoding / encoding.skill.bytes | encoding-fixed-length-message | practice | independent-python: `10*next(n for n in range(8) if pow(2,n)>=5)` |
| c2b-informatics-encoding-test-code-length | encoding / encoding.skill.3b2-prefix | prefix-code-length | test | independent-python: `6*1+3*2+4*3` |
| c2b-informatics-encoding-test-prefix-failure | encoding / encoding.skill.3b2-prefix | prefix-failure-count | test | independent-python: `sum(1 for s in ['00','01','100','111'] if all(not s.startswith(c) and not c.startswith(s) for c in ['0','10','11']))` |
| c2b-informatics-logic-conjunction | logic / logic.skill.operations | logic-truth-count | practice | independent-python: `sum(1 for a,b,c in product([0,1],repeat=3) if (a and b) or c)` |
| c2b-informatics-logic-demorgan | logic / logic.skill.operations | logic-truth-count | practice | independent-python: `sum(1 for a,b in product([0,1],repeat=2) if not(a or b))` |
| c2b-informatics-logic-interval | logic / logic.skill.3b2-universal | logic-integer-interval | practice | independent-python: `sum(1 for x in range(-20,21) if x>2 and x<=7)` |
| c2b-informatics-logic-negated-range | logic / logic.skill.operations | logic-integer-interval | practice | independent-python: `sum(1 for x in range(11) if not(3<=x<=6))` |
| c2b-informatics-logic-exclusive-three | logic / logic.skill.operations | logic-truth-count | practice | independent-python: `sum(1 for a,b,c in product([0,1],repeat=3) if a+b+c==1)` |
| c2b-informatics-logic-test-universal | logic / logic.skill.3b2-universal | logic-min-threshold | test | independent-python: `next(a for a in range(13) if all(x<=a or x>=8 for x in range(13)))` |
| c2b-informatics-graph-degree | graphs / graphs.skill.3b2-structure | graph-degree | practice | independent-python: `sum(1 for e in ['AB','AC','AD','BC','CD'] if 'C' in e)` |
| c2b-informatics-graph-handshake | graphs / graphs.skill.3b2-structure | graph-degree-sum | practice | independent-python: `sum([3,2,2,1])//2` |
| c2b-informatics-graph-paths-dag | graphs / graphs.skill.3b2-count-paths | graph-dag-path-count | practice | independent-python: `path_count([('A','B'),('A','C'),('B','C'),('B','D'),('C','D')],'A','D')` |
| c2b-informatics-graph-min-distance | graphs / graphs.skill.3b2-weighted | graph-shortest-path | practice | independent-python: `shortest_path([('A','B',4),('A','C',7),('B','C',1),('B','D',8),('C','D',3)],'A','D')` |
| c2b-informatics-graph-tree-extra | graphs / graphs.skill.3b2-spanning | graph-tree-edges | practice | independent-python: `(9-1)+1` |
| c2b-informatics-graph-test-blocked | graphs / graphs.skill.3b2-count-paths | graph-dag-path-count | test | independent-python: `path_count([('A','B'),('A','C'),('B','D'),('C','D'),('B','C'),('C','E'),('D','E')],'A','E',via='D')` |
| c2b-math-fraction-compound | fractions / fractions.skill.operations | fraction-order | practice | independent-python: `(Fraction(5,6)-Fraction(1,4))/(Fraction(7,8)+Fraction(1,24))` |
| c2b-math-fraction-remainder-share | fractions / fractions.skill.3b2-frac-share | fraction-changing-whole | practice | independent-python: `(1-Fraction(2,7))*(1-Fraction(3,5))` |
| c2b-math-fraction-units | fractions / fractions.skill.operations | fraction-common-denominator | practice | independent-python: `2-Fraction(3,4)-Fraction(5,6)` |
| c2b-math-fraction-inverse-dose | fractions / fractions.skill.3b2-frac-restore | fraction-restore-whole | practice | independent-python: `Fraction(120)/Fraction(4,9)-120` |
| c2b-math-fraction-error-subtract | fractions / fractions.skill.operations | fraction-common-denominator | practice | independent-python: `Fraction(7,10)-Fraction(1,5)` |
| c2b-math-fraction-negative-divisor | fractions / fractions.skill.operations | fraction-divide | practice | independent-python: `Fraction(-7,15)/Fraction(14,25)` |
| c2b-math-fraction-perimeter | fractions / fractions.skill.operations | fraction-model-perimeter | practice | independent-python: `2*(Fraction(3,8)+Fraction(5,12))` |
| c2b-math-fraction-known-part | fractions / fractions.skill.3b2-frac-restore | fraction-restore-whole | practice | independent-python: `Fraction(49)/(1-Fraction(5,12))*Fraction(5,12)` |
| c2b-math-fraction-nested | fractions / fractions.skill.operations | fraction-order | practice | independent-python: `1/(1+1/(1+Fraction(1,2)))` |
| c2b-math-fraction-speed | fractions / fractions.skill.operations | fraction-rate | practice | independent-python: `Fraction(7,10)/Fraction(2,5)*Fraction(6,7)` |
| c2b-math-fraction-test-balance | fractions / fractions.skill.3b2-frac-restore | fraction-model-balance | test | independent-python: `next(n for n in range(8,400,8) if Fraction(3,8)*n+16==Fraction(1,2)*(n+16))` |
| c2b-math-fraction-test-error | fractions / fractions.skill.operations | fraction-additive-inverse | test | independent-python: `(2-Fraction(1,2))/Fraction(3,4)` |
| c2b-math-percent-composition | percent / percent.skill.chain | percent-multiplier-chain | practice | independent-python: `(Fraction(11,10)*Fraction(6,5)-1)*100` |
| c2b-math-percent-equal-sum | percent / percent.skill.find-whole | percent-sum-whole | practice | independent-python: `next(x for x in range(251) if Fraction(30,100)*x==Fraction(45,100)*(250-x))` |
| c2b-math-percent-points | percent / percent.skill.find-part | percent-points-base | practice | independent-python: `(Fraction(50,40)-1)*100` |
| c2b-math-percent-recover-discount | percent / percent.skill.original-price | percent-inverse-base | practice | independent-python: `Fraction(1020)/Fraction(85,100)-1020` |
| c2b-math-percent-mixture-salt | percent / percent.skill.find-whole | percent-conserved-solute | practice | independent-python: `next(Fraction(n,3) for n in range(600) if (30+Fraction(n,3))/(600+Fraction(n,3))==Fraction(1,10))` |
| c2b-math-percent-voters | percent / percent.skill.find-part | percent-base-change | practice | independent-python: `Fraction(40)*Fraction(60,100)/(40+8)*100` |
| c2b-math-percent-saving | percent / percent.skill.decrease | percent-inverse-base | practice | independent-python: `Fraction(36)/Fraction(12,100)-36` |
| c2b-math-percent-compared | percent / percent.skill.increase | percent-inverse-comparison | practice | independent-python: `(1-Fraction(1,1)/Fraction(5,4))*100` |
| c2b-math-percent-test-reverse | percent / percent.skill.chain | percent-restore-chain | test | independent-python: `Fraction(3024)/(Fraction(14,10)*Fraction(9,10)*Fraction(8,10))` |
| c2b-math-percent-test-plan | percent / percent.skill.find-whole | percent-restore-chain | test | independent-python: `Fraction(660)/(Fraction(11,10)*Fraction(6,5))` |
| c2b-math-linear-negative | linear / linear.skill.solve | linear-equivalent-transformations | practice | independent-python: `Fraction(15+4+2,7)` |
| c2b-math-linear-thirds | linear / linear.skill.solve | linear-equivalent-transformations | practice | independent-python: `next(x for x in range(-40,41) if Fraction(x-2,4)-Fraction(x+1,6)==Fraction(1,3))` |
| c2b-math-linear-identity-check | linear / linear.skill.solve | linear-solution-classification | practice | independent-python: `int(2*(-100+3)==2*(-100)+6)` |
| c2b-math-linear-cancel | linear / linear.skill.solve | linear-solution-classification | practice | independent-python: `linear_solution_count(-2,7,-2,3)` |
| c2b-math-linear-fixed-distance | linear / linear.skill.solve | linear-quantity-model | practice | independent-python: `Fraction(294-90,12)` |
| c2b-math-linear-error-sign | linear / linear.skill.solve | linear-equivalent-transformations | practice | independent-python: `8-3` |
| c2b-math-linear-test-restriction | linear / linear.skill.solve | linear-rational-exclusion | test | independent-python: `next(x for x in range(-30,31) if x!=-2 and Fraction(x-3,x+2)==2)` |
| c2b-math-linear-test-age | linear / linear.skill.solve | linear-time-model | test | independent-python: `next(x for x in range(1,60) if 3*x+12==2*(x+12))` |
| c2b-math-power-outside-minus | powers / powers.skill.rules | power-sign-parity | practice | independent-python: `-pow(-2,4)+pow(-2,3)` |
| c2b-math-power-product-bases | powers / powers.skill.rules | power-exponent-rules | practice | independent-python: `pow(2,5)*pow(5,5)` |
| c2b-math-power-quotient-inverse | powers / powers.skill.rules | power-exponent-rules | practice | independent-python: `Fraction(pow(7,3),pow(7,5))` |
| c2b-math-power-squared-fraction | powers / powers.skill.rules | power-reciprocal | practice | independent-python: `1/pow(Fraction(3,5),2)` |
| c2b-math-power-scaled-area | powers / powers.skill.rules | power-geometric-scale | practice | independent-python: `pow(3,2)` |
| c2b-math-power-error-add | powers / powers.skill.rules | power-sum-not-product | practice | independent-python: `pow(2,3)+pow(2,3)` |
| c2b-math-power-test-count | powers / powers.skill.rules | power-integral-exponent | test | independent-python: `sum(1 for n in range(-3,4) if pow(Fraction(2),n)<1)` |
| c2b-math-power-test-model | powers / powers.skill.power-two | power-doubling-model | test | independent-python: `next(n for n in range(10) if 5*pow(2,n)>=150)` |
| c2b-math-root-factor | roots / roots.skill.principal | root-product-quotient | practice | independent-python: `isqrt(36*49)` |
| c2b-math-root-bound | roots / roots.skill.principal | root-interval | practice | independent-python: `isqrt(130)` |
| c2b-math-root-absolute-shift | roots / roots.skill.principal | root-absolute | practice | independent-python: `abs(3-8)` |
| c2b-math-root-error-sum | roots / roots.skill.principal | root-nonlinear-sum | practice | independent-python: `isqrt(9+16)` |
| c2b-math-root-fraction | roots / roots.skill.principal | root-product-quotient | practice | independent-python: `Fraction(isqrt(81),isqrt(196))` |
| c2b-math-root-test-distance | roots / roots.skill.principal | root-length-model | test | independent-python: `isqrt(pow(9,2)+pow(12,2))` |
| c2b-math-quadratic-sum | quadratic / quadratic.skill.3b2-roots | quadratic-factorization | practice | independent-python: `sum(x for x in range(-20,21) if x*x-11*x+24==0)` |
| c2b-math-quadratic-product | quadratic / quadratic.skill.3b2-roots | quadratic-factorization | practice | independent-python: `min(Fraction(n,2) for n in range(-20,21) if 2*Fraction(n,2)**2+Fraction(n,2)-3==0)` |
| c2b-math-quadratic-discriminant | quadratic / quadratic.skill.3b2-roots | quadratic-real-root-count | practice | independent-python: `int((-2)**2-4*3*2==0)+2*int((-2)**2-4*3*2>0)` |
| c2b-math-quadratic-shift-square | quadratic / quadratic.skill.3b2-roots | quadratic-square-shift | practice | independent-python: `max(x for x in range(-10,20) if (x-4)**2==9)` |
| c2b-math-quadratic-model-margin | quadratic / quadratic.skill.3b2-model | quadratic-area-frame | practice | independent-python: `next(x for x in range(1,30) if (6+x)*(10+x)==96)` |
| c2b-math-quadratic-test-positive | quadratic / quadratic.skill.3b2-integer-roots | quadratic-factorization | test | independent-python: `next(x for x in range(1,20) if x*x-x==6)` |
| c2b-math-function-linear-infer | functions / functions.skill.evaluate | function-reconstruct-rule | practice | independent-python: `5+Fraction(11-5,2)*(-1)` |
| c2b-math-function-difference | functions / functions.skill.evaluate | function-change | practice | independent-python: `(2*10-7)-(2*3-7)` |
| c2b-math-function-vertex | functions / functions.skill.vertex | function-completed-square | practice | independent-python: `min((x+2)**2+7 for x in range(-20,21))` |
| c2b-math-function-domain-holes | functions / functions.skill.sqrt-domain | function-domain-intersection | practice | independent-python: `sum(1 for x in range(8) if x-2>=0 and x!=5)` |
| c2b-math-function-scale-sign | functions / functions.skill.positive | function-sign | practice | independent-python: `max(x for x in range(-20,21) if -2*x+6>0)` |
| c2b-math-function-test-meeting | functions / functions.skill.3b2-func-intersection | function-intersection | test | independent-python: `sum(x*x for x in range(-10,11) if x*x==2*x+3)` |
| c2b-math-word-travel-stops | word / word.skill.3b2-rates | word-total-time | practice | independent-python: `Fraction(60,40)+Fraction(15,60)+Fraction(90,60)` |
| c2b-math-word-upstream | word / word.skill.3b2-rates | word-relative-speed | practice | independent-python: `Fraction(30,12+3)+Fraction(18,12-3)` |
| c2b-math-word-two-products | word / word.skill.3b2-balance | word-unit-cost | practice | independent-python: `next(2*p for p in range(1,100) if 3*p+2*2*p==210)` |
| c2b-math-word-average-speed | word / word.skill.3b2-rates | word-average-speed | practice | independent-python: `Fraction(120)/(Fraction(60,30)+Fraction(60,60))` |
| c2b-math-word-stock-balance | word / word.skill.3b2-balance | word-stock-equation | practice | independent-python: `next(x for x in range(91) if x-12==90-x+12)` |
| c2b-math-word-work-break | word / word.skill.3b2-rates | word-work-staged | practice | independent-python: `3+(1-Fraction(3,12))/(Fraction(1,12)+Fraction(1,8))` |
| c2b-math-prob-complement | probability / probability.skill.3b2-outcomes | probability-complement | practice | independent-python: `Fraction(30-4,30)` |
| c2b-math-prob-or-intersection | probability / probability.skill.3b2-outcomes | probability-union | practice | independent-python: `Fraction(sum(1 for x in range(1,13) if x%2==0 or x%3==0),12)` |
| c2b-math-prob-one-red | probability / probability.skill.3b2-sequential | probability-without-replacement | practice | independent-python: `Fraction(2,5)*Fraction(3,4)+Fraction(3,5)*Fraction(2,4)` |
| c2b-math-prob-mean-missing | probability / probability.skill.3b2-statistics | statistics-restore-sum | practice | independent-python: `5*8-sum([3,7,9,11])` |
| c2b-math-prob-median-even | probability / probability.skill.3b2-statistics | statistics-median | practice | independent-python: `Fraction(sorted([12,4,7,2,9,6])[2]+sorted([12,4,7,2,9,6])[3],2)` |
| c2b-math-prob-independent | probability / probability.skill.3b2-sequential | probability-independent | practice | independent-python: `Fraction(sum(1 for p in product([0,1],repeat=3) if sum(p)==2),8)` |
| c2b-math-arith-negative-average | arithmetic / arithmetic.skill.3c2-signed-difference | signed-order | practice | independent-python: `-4-7+3` |
| c2b-math-arith-divisibility | arithmetic / arithmetic.skill.3b2-arith-remainders | integer-remainder | practice | independent-python: `84%5` |
| c2b-math-arith-round-money | arithmetic / arithmetic.skill.3b2-arith-rounding | integer-capacity | practice | independent-python: `300//46` |
| c2b-math-arith-test-distribution | arithmetic / arithmetic.skill.3b2-arith-remainders | integer-balance | test | independent-python: `(59-3)//7` |
| c2b-python-list-extend | py-lists / py-lists.skill.indices | python-list-growth | practice | real-cpython: реальный stdout |
| c2b-python-list-append | py-lists / py-lists.skill.length | python-list-growth | practice | real-cpython: реальный stdout |
| c2b-python-list-pop | py-lists / py-lists.skill.indices | python-list-removal | practice | real-cpython: реальный stdout |
| c2b-python-list-rebind | py-lists / py-lists.skill.3c2-alias | python-list-alias | practice | real-cpython: реальный stdout |
| c2b-python-list-copy-mutate | py-lists / py-lists.skill.3c2-alias | python-list-copy | practice | real-cpython: реальный stdout |
| c2b-python-dict-get-no-insert | py-dicts / py-dicts.skill.default | python-dict-default | practice | real-cpython: реальный stdout |
| c2b-python-dict-key-overwrite | py-dicts / py-dicts.skill.update | python-dict-update | practice | real-cpython: реальный stdout |
| c2b-python-dict-alias | py-dicts / py-dicts.skill.update | python-dict-update | practice | real-cpython: реальный stdout |
| c2b-python-loop-continue | py-loops / py-loops.skill.accumulate | python-loop-control | practice | real-cpython: реальный stdout |
| c2b-python-loop-while-pop | py-loops / py-loops.skill.accumulate | python-mutation-iteration | practice | real-cpython: реальный stdout |
| c2b-python-loop-triangular | py-loops / py-loops.skill.range | python-nested-count | practice | real-cpython: реальный stdout |
| c2b-python-if-independent | py-if / py-if.skill.branch | python-branch-sequence | practice | real-cpython: реальный stdout |
| c2b-python-if-short-circuit | py-if / py-if.skill.boundary | python-short-circuit | practice | real-cpython: реальный stdout |
| c2b-python-function-local-rebind | py-functions / py-functions.skill.return | python-function-rebinding | practice | real-cpython: реальный stdout |
| c2b-python-function-test-mutation | py-functions / py-functions.skill.return | python-function-mutation | test | real-cpython: реальный stdout |
| c2b-python-list-test-slice | py-lists / py-lists.skill.3b2-slices | python-list-slice | test | real-cpython: реальный stdout |
| c2b-python-dict-test-membership | py-dicts / py-dicts.skill.default | python-dict-membership | test | real-cpython: реальный stdout |
| c2b-python-positive-prefix | py-lists / py-lists.skill.3c2-prefix-scan | practice | real-cpython: 7 тестов; 2 неверных алгоритма |
| c2b-python-replace-negatives | py-lists / py-lists.skill.3c2-transform | practice | real-cpython: 6 тестов; 2 неверных алгоритма |
| c2b-python-adjacent-increases | py-lists / py-lists.skill.3c2-adjacent | practice | real-cpython: 7 тестов; 2 неверных алгоритма |
| c2b-python-frequent-first | py-dicts / py-dicts.skill.frequency | python-frequency-tie | practice | real-cpython: 7 тестов; 2 неверных алгоритма |
| c2b-python-balance-cut | py-functions / py-functions.skill.3c2-prefix-balance | practice | real-cpython: 7 тестов; 2 неверных алгоритма |
| c2b-python-running-maxima | py-lists / py-lists.skill.3c2-running-extrema | practice | real-cpython: 6 тестов; 2 неверных алгоритма |
| c2b-python-sum-distinct | py-lists / py-lists.skill.3c2-distinct-sum | practice | real-cpython: 7 тестов; 2 неверных алгоритма |
| c2b-python-count-signs | py-loops / py-loops.skill.accumulate | python-filter-count | practice | real-cpython: 6 тестов; 2 неверных алгоритма |
| c2b-russian-speech-infinitive | speech / speech.skill.recognize | speech-context | practice | manual-options: все 4 варианта |
| c2b-russian-speech-ordinal | speech / speech.skill.recognize | speech-numeral | practice | manual-options: все 4 варианта |
| c2b-russian-speech-adverb-degree | speech / speech.skill.context | speech-context | practice | manual-options: все 4 варианта |
| c2b-russian-speech-pronoun | speech / speech.skill.context | speech-pronoun | practice | manual-options: все 4 варианта |
| c2b-russian-speech-preposition | speech / speech.skill.context | speech-function-word | practice | manual-options: все 4 варианта |
| c2b-russian-speech-homonym | speech / speech.skill.context | speech-function-word | practice | manual-options: все 4 варианта |
| c2b-russian-speech-test-participle | speech / speech.skill.context | speech-verbal-adjective | test | manual-options: все 4 варианта |
| c2b-russian-speech-test-gerund | speech / speech.skill.context | speech-verbal-adverb | test | manual-options: все 4 варианта |
| c2b-russian-member-object | members / members.skill.3b2-secondary | member-secondary-role | practice | manual-options: все 4 варианта |
| c2b-russian-member-definition | members / members.skill.3b2-secondary | member-secondary-role | practice | manual-options: все 4 варианта |
| c2b-russian-member-adverbial | members / members.skill.3b2-secondary | member-secondary-role | practice | manual-options: все 4 варианта |
| c2b-russian-member-inverted | members / members.skill.3b2-basis | basis-case | practice | manual-options: все 4 варианта |
| c2b-russian-member-passive | members / members.skill.3b2-basis | basis-passive | practice | manual-options: все 4 варианта |
| c2b-russian-member-infinitive | members / members.skill.3b2-basis | basis-infinitive | practice | manual-options: все 4 варианта |
| c2b-russian-member-test-compound | members / members.skill.3b2-basis | basis-compound-predicate | test | manual-options: все 4 варианта |
| c2b-russian-member-test-nominal | members / members.skill.3b2-basis | basis-compound-nominal | test | manual-options: все 4 варианта |
| c2b-russian-sentence-one-basis | sentence / sentence.skill.main | basis-clause-count | practice | manual-options: все 4 варианта |
| c2b-russian-sentence-two-bases | sentence / sentence.skill.separate | basis-clause-count | practice | manual-options: все 4 варианта |
| c2b-russian-sentence-impersonal | sentence / sentence.skill.main | basis-impersonal | practice | manual-options: все 4 варианта |
| c2b-russian-sentence-relative | sentence / sentence.skill.relative-subject | basis-relative-word | practice | manual-options: все 4 варианта |
| c2b-russian-sentence-indirect-agent | sentence / sentence.skill.main | basis-case | practice | manual-options: все 4 варианта |
| c2b-russian-sentence-test-subordinate | sentence / sentence.skill.subordinate | basis-embedded-clause | test | manual-options: все 4 варианта |
| c2b-russian-union-question-object | unionwords / unionwords.skill.that | union-member-test | practice | manual-options: все 4 варианта |
| c2b-russian-union-report | unionwords / unionwords.skill.that | union-member-test | practice | manual-options: все 4 варианта |
| c2b-russian-union-place | unionwords / unionwords.skill.where | union-member-test | practice | manual-options: все 4 варианта |
| c2b-russian-union-because | unionwords / unionwords.skill.compound | union-semantic-link | practice | manual-options: все 4 варианта |
| c2b-russian-union-if | unionwords / unionwords.skill.compound | union-semantic-link | practice | manual-options: все 4 варианта |
| c2b-russian-union-test-whom | unionwords / unionwords.skill.that | union-member-test | test | manual-options: все 4 варианта |
| c2b-russian-punct-address | punctuation / punctuation.skill.3b2-punct-address | punctuation-address | practice | manual-options: все 4 варианта |
| c2b-russian-punct-adversative | punctuation / punctuation.skill.simple | punctuation-homogeneous | practice | manual-options: все 4 варианта |
| c2b-russian-punct-gerund | punctuation / punctuation.skill.3b2-punct-gerund | punctuation-gerund | practice | manual-options: все 4 варианта |
| c2b-russian-punct-list | punctuation / punctuation.skill.simple | punctuation-homogeneous | practice | manual-options: все 4 варианта |
| c2b-russian-punct-paired | punctuation / punctuation.skill.simple | punctuation-paired | practice | manual-options: все 4 варианта |
| c2b-russian-punct-test-common | punctuation / punctuation.skill.simple | punctuation-common-modifier | test | manual-options: все 4 варианта |
| c2b-russian-text-repeat | text / text.skill.link | text-lexical-repeat | practice | manual-options: все 4 варианта |
| c2b-russian-text-pronoun | text / text.skill.3b2-text-pronoun | text-pronoun-reference | practice | manual-options: все 4 варианта |
| c2b-russian-text-causal | text / text.skill.3b2-text-causal | text-causal-link | practice | manual-options: все 4 варианта |
| c2b-russian-text-adversative | text / text.skill.link | text-adversative-link | practice | manual-options: все 4 варианта |
| c2b-russian-text-synonym | text / text.skill.link | text-synonym-reference | practice | manual-options: все 4 варианта |
| c2b-russian-text-test-order | text / text.skill.link | text-sequence-link | test | manual-options: все 4 варианта |
| c2b-russian-complex-subordinate | complex / complex.skill.3b2-structure | complex-classification | practice | manual-options: все 4 варианта |
| c2b-russian-complex-coordinate | complex / complex.skill.3b2-structure | complex-classification | practice | manual-options: все 4 варианта |
| c2b-russian-complex-purpose | complex / complex.skill.3b2-meaning | complex-semantic-link | practice | manual-options: все 4 варианта |
| c2b-russian-complex-relative | complex / complex.skill.3b2-meaning | complex-semantic-link | practice | manual-options: все 4 варианта |
| c2b-math-exam-prob-seats | probability / probability.skill.3b2-outcomes | exam-classic-complement | exam / ege-math-2027-4 | independent-python: `Fraction(50-8-12,50)` |
| c2b-math-exam-prob-day | probability / probability.skill.3b2-outcomes | exam-classic-calendar | exam / ege-math-2027-4 | independent-python: `Fraction(6+9-3,20)` |
| c2b-math-exam-prob-digit | probability / probability.skill.3b2-outcomes | exam-classic-digit-property | exam / ege-math-2027-4 | independent-python: `Fraction(sum(1 for n in range(10,100) if n%10 in [0,5]),90)` |
| c2b-math-exam-prob-pairs | probability / probability.skill.3b2-outcomes | exam-classic-product-space | exam / ege-math-2027-4 | independent-python: `Fraction(sum(1 for a,b in product(range(1,6),repeat=2) if a>b),25)` |
| c2b-math-exam-equation-reciprocal | linear / linear.skill.solve | exam-rational-equation | exam / ege-math-2027-7 | independent-python: `next(x for x in range(-20,21) if x!=1 and Fraction(12,x-1)==3)` |
| c2b-math-exam-equation-root | roots / roots.skill.principal | exam-root-filter | exam / ege-math-2027-7 | independent-python: `next(x for x in range(0,30) if 3*x+4==x*x)` |
| c2b-math-exam-equation-factor | quadratic / quadratic.skill.3b2-roots | exam-quadratic | exam / ege-math-2027-7 | independent-python: `max(Fraction(n,2) for n in range(-20,21) if (Fraction(n,2)+1)*(2*Fraction(n,2)-5)==0)` |
| c2b-math-exam-equation-power | powers / powers.skill.rules | exam-exponential | exam / ege-math-2027-7 | independent-python: `next(x for x in range(-10,11) if pow(Fraction(3),2*x-1)==27)` |
| c2b-russian-exam-comma-tools | punctuation / punctuation.skill.simple | exam-russian-one-comma | exam / ege-russian-2027-16 | manual-language: все 5 предложений / оба средства связи |
| c2b-russian-exam-comma-evening | punctuation / punctuation.skill.simple | exam-russian-one-comma | exam / ege-russian-2027-16 | manual-language: все 5 предложений / оба средства связи |
| c2b-russian-exam-comma-route | punctuation / punctuation.skill.simple | exam-russian-one-comma | exam / ege-russian-2027-16 | manual-language: все 5 предложений / оба средства связи |
| c2b-russian-exam-link-workshop | text / text.skill.link | exam-russian-pronoun-repeat | exam / ege-russian-2027-26 | manual-language: все 5 предложений / оба средства связи |
| c2b-russian-exam-link-map | text / text.skill.link | exam-russian-pronoun-repeat | exam / ege-russian-2027-26 | manual-language: все 5 предложений / оба средства связи |
| c2b-russian-exam-link-kiosk | text / text.skill.link | exam-russian-pronoun-repeat | exam / ege-russian-2027-26 | manual-language: все 5 предложений / оба средства связи |
| c2b-informatics-exam-prefix-two | encoding / encoding.skill.3b2-prefix | exam-prefix-count | exam / ege-informatics-2027-4 | independent-python: `sum(1 for s in map(''.join,product('01',repeat=3)) if all(not s.startswith(c) and not c.startswith(s) for c in ['000','01','10']))` |
| c2b-informatics-exam-prefix-lexicographic | encoding / encoding.skill.3b2-prefix | exam-prefix-shortest | exam / ege-informatics-2027-4 | independent-python: `min(s for s in map(''.join,product('01',repeat=2)) if all(not s.startswith(c) and not c.startswith(s) for c in ['0','110']))` |
| c2b-informatics-exam-prefix-word | encoding / encoding.skill.3b2-prefix | exam-prefix-word | exam / ege-informatics-2027-4 | independent-python: `2+1+2+1+2` |
| c2b-informatics-exam-base-digit-count | binary / binary.skill.weight | exam-base-borrowing | exam / ege-informatics-2027-14 | independent-python: `digits(pow(5,6)-pow(5,3)+2*pow(5,2)+4,5).count(4)` |
| c2b-informatics-exam-base-unknown | binary / binary.skill.3b2-binary-base | exam-base-find | exam / ege-informatics-2027-14 | independent-python: `next(b for b in range(3,30) if b*b+2*b+1==64)` |
| c2b-informatics-exam-base-even-positions | binary / binary.skill.weight | exam-base-digit-sum | exam / ege-informatics-2027-14 | independent-python: `bin(pow(2,12)+pow(2,8)+pow(2,4)-1).count('1')` |
