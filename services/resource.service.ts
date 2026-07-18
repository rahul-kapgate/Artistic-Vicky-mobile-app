import { api } from "@/lib/api";
import type { CourseResource, CourseResourcesResponse } from "@/types/resource";

function validateCourseId(courseId: string | number): string {
  const normalizedCourseId = String(courseId).trim();

  if (!normalizedCourseId || !/^\d+$/.test(normalizedCourseId)) {
    throw new Error("A valid course ID is required.");
  }

  return normalizedCourseId;
}

export async function getCourseResources(
  courseId: string | number,
): Promise<CourseResource[]> {
  const normalizedCourseId = validateCourseId(courseId);

  const response = await api.get<CourseResourcesResponse>(
    "/resource/all-resources",
    {
      params: {
        course_id: normalizedCourseId,
      },
    },
  );

  if (!response.data?.success || !Array.isArray(response.data.data)) {
    throw new Error("Invalid course resources response.");
  }

  return response.data.data;
}
