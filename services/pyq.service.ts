import { api } from "@/lib/api";
import type { PYQPaper, PYQPapersResponse } from "@/types/pyq";

function validateCourseId(courseId: string | number): string {
  const normalizedCourseId = String(courseId).trim();

  if (!normalizedCourseId || !/^\d+$/.test(normalizedCourseId)) {
    throw new Error("A valid course ID is required.");
  }

  return normalizedCourseId;
}

export async function getPYQPapers(
  courseId: string | number,
): Promise<PYQPaper[]> {
  const normalizedCourseId = validateCourseId(courseId);

  const response = await api.get<PYQPapersResponse>(
    `/pyq-mock-test/${normalizedCourseId}/papers`,
  );

  if (!response.data?.success || !Array.isArray(response.data.data)) {
    throw new Error("Invalid PYQ papers response.");
  }

  return response.data.data;
}
