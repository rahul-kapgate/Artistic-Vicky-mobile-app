export type MockTestType = "mock" | "pyq";

export interface MockTestOption {
  id: number;
  text: string;
}

/**
 * Intentionally does not contain correct_option_id.
 * Correct answers must stay on the server until the attempt is submitted.
 */
export interface MockTestQuestion {
  id: number;
  question_text: string;
  options: MockTestOption[];
  difficulty?: string;
  image_url?: string | null;
}

export interface SubmitAnswer {
  question_id: number;
  selected_option_id: number;
}

export interface SubmitTestResponse {
  success: boolean;
  message: string;
  score: number;
  totalQuestions: number;
  data?: unknown;
}

export interface PersistedTestSession {
  version: 1;
  answers: Record<number, number>;
  currentIndex: number;
  startedAt: number;
  deadlineAt: number;
}
