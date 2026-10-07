export interface ExternalLink {
  label: string;
  url: string;
}

export interface Question {
  id: string;
  group: string;
  topic: string;
  question: string;
  answer: string; // Markdown (fenced code and ```mermaid blocks allowed)
  tags?: string[];
  notes?: string; // public: stored in the JSON
  source?: string; // public: stored in the JSON
  relatedIds?: string[];
  diagram?: string; // svg / png / webp path
  codeLanguage?: string;
  externalLinks?: ExternalLink[];
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface QuestionsFile {
  questions: Question[];
}

export type StudyStatus = 'learned' | 'revise';
export type StatusFilter = 'all' | StudyStatus | 'unmarked';

export interface QuestionStats {
  lastStudied: string; // ISO
  timesRevised: number;
}

export interface LastPosition {
  group: string;
  topic: string;
  questionId: string;
  mode: 'browse' | 'practice' | 'interview';
}
