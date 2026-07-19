export interface CourseReviewUser {
  id: number;
  user_name: string | null;
}

export interface CourseReview {
  id: number;
  course_id: number;
  user_id: number;
  rating: number;
  review_text: string | null;
  is_approved: boolean;
  created_at: string;
  updated_at: string | null;
  status: string;
  show_on_home: boolean;
  user?: CourseReviewUser | null;
}

export interface CourseReviewsResponse {
  success: boolean;
  message: string;
  count: number;
  data: CourseReview[];
}
