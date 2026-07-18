import type { MockTestOption, MockTestQuestion } from "@/types/mock-test";

export interface PublicLiveTest {
  id: number;
  title: string;
  description?: string | null;
  course_id: number;
  duration_minutes: number;
  total_questions: number;
  start_at?: string | null;
  end_at?: string | null;
  published_at?: string | null;
}

export interface PublicLiveTestsResponse {
  success: boolean;
  message?: string;
  data: PublicLiveTest[];
}

export interface LiveTestAnswer {
  question_id: number;
  selected_option_id: number;
}

export interface LiveTestSession {
  attempt_id: number;
  server_now: string;
  started_at: string;
  expires_at: string;
  remaining_seconds: number;
  status: "in_progress" | "submitted" | "auto_submitted" | "expired";
  answers?: LiveTestAnswer[];
  test: {
    id: number;
    title: string;
    description?: string | null;
    duration_minutes: number;
    total_questions: number;
    start_at?: string | null;
    end_at?: string | null;
    questions: MockTestQuestion[];
  };
}

export interface LiveTestSessionResponse {
  success: boolean;
  message: string;
  data: LiveTestSession;
}

export interface SubmitLiveTestResponse {
  success: boolean;
  message: string;
  data?: {
    attempt_id: number;
    submitted_at: string;
  };
}
