import { checkContentBank } from './content-bank.mjs';
const {questions,taxonomy}=checkContentBank();
console.log(`Content bank valid: ${questions.length} questions, ${taxonomy.subtopics.length} subtopics, ${taxonomy.skills.length} skills`);
