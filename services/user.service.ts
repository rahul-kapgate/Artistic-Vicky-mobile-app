import { api } from "@/lib/api";
import { Course } from "@/types/course";
import { UserProfile } from "@/types/user";

export const getProfile = async (): Promise<UserProfile> => {
  const { data } = await api.get("/user/profile");
  return data.user;
};

export const getEnrolledCourses = async (userId: number): Promise<Course[]> => {
  const { data } = await api.get(`/course/enrolled/${userId}`);
  return data.data;
};
