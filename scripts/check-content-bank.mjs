import {checkAuthor500} from './check-author500.mjs';
import { checkContentBank } from './content-bank.mjs';
import {checkWave} from './stage3b2-quality.mjs';
import {checkC2} from './stage3c2-quality.mjs';
const {questions,taxonomy}=checkContentBank();
console.log(`Content bank valid: ${questions.length} questions, ${taxonomy.subtopics.length} subtopics, ${taxonomy.skills.length} skills`);
console.log('Stage 3B.2 independent content checks:',checkWave({structural:false}));

const wave=checkC2();console.log('Stage 3C.2 independent content checks:',{...wave,closePairs:wave.closePairs.length});

const waveB=checkC2("b");console.log("Stage 3C.2 B independent checks:",{...waveB,closePairs:waveB.closePairs.length});

import {checkGenerators} from './check-generators.mjs';
console.log('Generator pilot:',checkGenerators());

console.log("Author packs:",checkAuthor500());
