import { api } from "@/lib/api";
import type {
    CourseReview,
    CourseReviewsResponse,
} from "@/types/course-review";

function validateCourseId(courseId: string | number): string {
  const normalizedCourseId = String(courseId).trim();

  if (!normalizedCourseId || !/^\d+$/.test(normalizedCourseId)) {
    throw new Error("A valid course ID is required.");
  }

  return normalizedCourseId;
}

export async function getCourseReviews(
  courseId: string | number,
): Promise<CourseReview[]> {
  const normalizedCourseId = validateCourseId(courseId);

  const response = await api.get<CourseReviewsResponse>(
    `/course-reviews/course/${normalizedCourseId}`,
  );

  if (!response.data?.success || !Array.isArray(response.data.data)) {
    throw new Error("Invalid course reviews response.");
  }

  return response.data.data.filter(
    (review) =>
      review.is_approved && review.status?.toLowerCase() === "approved",
  );
}
