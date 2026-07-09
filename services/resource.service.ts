import { api } from "@/lib/api";
import { Resource } from "@/types/resource";

export const getAllResourcesByCourseId = async (
  courseId: string,
): Promise<Resource[]> => {
  const { data } = await api.get("/resource/all-resources", {
    params: {
      course_id: courseId,
    },
  });

  return data.data || [];
};

export const getResourceStreamUrl = (resourceId: number) => {
  const baseURL = api.defaults.baseURL?.replace(/\/+$/, "") || "";
  return `${baseURL}/resource/${resourceId}/file`;
};
