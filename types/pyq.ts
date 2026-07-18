export interface PYQPaper {
  id: number;
  course_id: number;
  year: number;
  total_questions: number;
  created_at: string;
  exam_day: number | null;
}

export interface PYQPapersResponse {
  success: boolean;
  count: number;
  data: PYQPaper[];
}
