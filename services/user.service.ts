import { api } from "@/lib/api";

export interface UserProfile {
  id: number;
  user_name: string;
  email: string;
  mobile: string;
  is_admin: boolean;
  avatar_id: number;
  created_at: string;
}

export interface Course {
  id: number;
  course_name: string;
  description: string;
  image: string;
  price: number;
  price_without_discount: number;
  category: string;
  language: string;
  duration: string;
  rating: number;
  course_type: string;
  sections: string[];
}

export const getProfile = async (): Promise<UserProfile> => {
  const { data } = await api.get("/user/profile");
  return data.user;
};

export const getEnrolledCourses = async (userId: number): Promise<Course[]> => {
  const { data } = await api.get(`/course/enrolled/${userId}`);
  return data.data;
};
