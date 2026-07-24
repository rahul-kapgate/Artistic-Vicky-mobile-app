import { api } from "@/lib/api";

export type AttemptType = "mock" | "pyq";

export interface AttemptAnswer {
  question_id: number;
  selected_option_id: number;
}

export interface TestAttempt {
  id: number;
  student_id: number;
  course_id?: number;
  paper_id?: number;
  answers: AttemptAnswer[];
  score: number;
  submitted_at: string;

  courses?: {
    course_name: string;
  };

  pyq_papers?: {
    year: number;
    course_id: number;
  };
}

export interface AttemptOption {
  id: number;
  text: string;
}

export interface AttemptQuestionDetail {
  id: number;
  question_text: string;
  options: AttemptOption[];
  correct_option_id: number;
  selected_option_id: number | null;
  image_url: string | null;
  difficulty: string | null;
  is_correct: boolean;
}

export interface AttemptDetails {
  success: boolean;
  attempt_id: number;
  student_id: number;
  course_id?: number;
  paper_id?: number;
  score: number;
  total_questions: number;
  submitted_at: string;
  data: AttemptQuestionDetail[];
}

interface AttemptsResponse {
  success: boolean;
  count: number;
  data: TestAttempt[];
}

const attemptsEndpoints: Record<AttemptType, (studentId: number) => string> = {
  mock: (studentId) => `/mock-test/attempts/${studentId}`,
  pyq: (studentId) => `/pyq-mock-test/attempts/${studentId}`,
};

const attemptDetailsEndpoints: Record<
  AttemptType,
  (attemptId: number) => string
> = {
  mock: (attemptId) => `/mock-test/attempt/${attemptId}/details`,

  pyq: (attemptId) => `/pyq-mock-test/attempt/${attemptId}/details`,
};

export async function getStudentAttempts(
  studentId: number,
  type: AttemptType,
): Promise<TestAttempt[]> {
  if (!studentId || Number.isNaN(studentId)) {
    throw new Error("A valid student ID is required.");
  }

  const response = await api.get<AttemptsResponse>(
    attemptsEndpoints[type](studentId),
  );

  if (!response.data?.success || !Array.isArray(response.data.data)) {
    throw new Error(`Unable to load ${type} test attempts.`);
  }

  return [...response.data.data].sort(
    (first, second) =>
      new Date(second.submitted_at).getTime() -
      new Date(first.submitted_at).getTime(),
  );
}

export async function getAttemptDetails(
  attemptId: number,
  type: AttemptType,
): Promise<AttemptDetails> {
  if (!attemptId || Number.isNaN(attemptId)) {
    throw new Error("A valid attempt ID is required.");
  }

  const response = await api.get<AttemptDetails>(
    attemptDetailsEndpoints[type](attemptId),
  );

  if (!response.data?.success || !Array.isArray(response.data.data)) {
    throw new Error("Unable to load the test result.");
  }

  return response.data;
}
