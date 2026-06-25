import { api } from "@/lib/api";
import { Course } from "@/types/course";

export const getAllCourses = async (): Promise<Course[]> => {
  const { data } = await api.get("/course/all-courses");
  return data.data;
};
