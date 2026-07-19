import { api } from "@/lib/api";
import type { CourseResource, CourseResourcesResponse } from "@/types/resource";

export async function getAllResources(): Promise<CourseResource[]> {
  const response = await api.get<CourseResourcesResponse>(
    "/resource/all-resources",
  );

  if (!response.data?.success || !Array.isArray(response.data.data)) {
    throw new Error("Invalid resources response.");
  }

  return response.data.data;
}
