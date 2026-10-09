import { checkContentBank } from './content-bank.mjs';
import {checkWave} from './stage3b2-quality.mjs';
const {questions,taxonomy}=checkContentBank();
console.log(`Content bank valid: ${questions.length} questions, ${taxonomy.subtopics.length} subtopics, ${taxonomy.skills.length} skills`);
console.log('Stage 3B.2 independent content checks:',checkWave({structural:false}));
