export type SubjectId = 'math' | 'russian' | 'informatics' | 'python';
export type TopicStatus = 'Не изучено' | 'Изучаю' | 'Нужна практика' | 'Уверенно' | 'Повторить';
export type Origin = 'official' | 'generated' | 'reconstructed' | 'custom' | 'private-import';
export type AnswerType = 'number' | 'text' | 'choice' | 'selection';
export type AttemptContext = 'practice' | 'test' | 'easy' | 'session' | 'error' | 'adaptive';
export type LocalDate = string;

export interface Subject { id: SubjectId; title: string; short: string; description: string; symbol: string; tone: string }
export interface Topic {
  id: string; subject: SubjectId; title: string; description: string;
  order: number; materialStatus: 'ready' | 'planned' | 'pending-transfer'; minutes?: number;
  subtopics: string[]; requires: string[]; related: string[]; remediates?: string[];
}
export interface Subtopic { id: string; topic: string; title: string }
export interface Skill { id: string; topic: string; subtopic: string; title: string; requires: string[]; related: string[]; remediates: string[] }
export interface Question {
  id: string; subject: SubjectId; topic: string; subtopic: string | null;
  difficulty: 'unspecified' | 'easy' | 'medium' | 'hard';
  origin: Origin; source: string; sourceYear: number | null;
  sourceType: 'training' | 'exam' | 'lesson'; examTaskType: string | null;
  answerType: AnswerType; prompt: string; answer: string; options?: string[];
  hint: string; explanation: string; solution: string; principle: string;
  wrongAnswers?: Record<string, string>; easy?: boolean; version: number;
  requires: string[]; related: string[];
  skills?: string[]; remediates?: string[];
}
export interface Attempt {
  id: string; questionId: string; questionVersion: number; topic: string;
  answer: string; correct: boolean; date: LocalDate; at: string; context: AttemptContext;
  subject?: SubjectId; subtopic?: string | null; skills?: string[]; sessionId?: string;
}
export interface LearningError {
  id: string; topic: string; questionId?: string; attemptId?: string;
  prompt: string; wrong: string; correct: string; reason: string; principle: string;
  solution: string; note: string; date: LocalDate;
  status: 'не понял' | 'понял' | 'закрепил'; due: LocalDate; stage: number; question?: Question;
}
export interface TopicProgress { topic: string; status: TopicStatus; note: string; last?: LocalDate }
export interface Review { id: string; targetType: 'topic' | 'error'; targetId: string; due: LocalDate; stage: number; last?: LocalDate }
export interface Activity { id: string; date: LocalDate; topic: string; kind: 'answer' | 'lesson' | 'review' }
export interface LegacyStudyState {
  app: 'ege-local-center'; schemaVersion: 1; contentVersion: string;
  topics: Record<string, TopicProgress>; attempts: Attempt[]; errors: LearningError[];
  reviews: Record<string, Review>; activity: Activity[];
  settings: { theme: 'light' | 'dark'; lastTopic?: string }; updatedAt: string;
}
export interface PriorityReason { code: string; points: number; label: string }
export interface AdaptiveItem { question: Question; score: number; reasons: PriorityReason[]; firstCorrect: boolean | null; correct: boolean | null; attemptIds: string[]; shownAt?: string }
export interface AdaptiveSession { id: string; requested: 5 | 10 | 15 | 20; subject: SubjectId | 'all'; startedAt: string; completedAt?: string; index: number; items: AdaptiveItem[] }
export interface QuestionExposure { id: string; sessionId: string; index: number; questionId: string; topic: string; skills: string[]; at: string }
export interface StudyState extends Omit<LegacyStudyState, 'schemaVersion'> {
  schemaVersion: 2;
  adaptive: { sessions: AdaptiveSession[]; exposures: QuestionExposure[] };
}
export interface ContentNode { tag: string; className: string; children: (ContentNode | string | number)[] }
export interface Sentence {
  text: string; words: string[]; main: number[]; sub: number[];
  ms: number[]; mp: number[]; ss: number[]; sp: number[]; role: string; explain: string; link: string;
}
export interface PythonBridge { algorithm: string; pseudo: string; code: string; note: string }
