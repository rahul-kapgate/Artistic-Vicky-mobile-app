export type ResourceType = "Notes" | "E-books" | "PYQ" | "Sessions";

export interface CourseResource {
  id: number;
  title: string;
  type: ResourceType;
  description: string;
  file_url: string;
  file_name: string;
  mime_type: string;
  uploaded_by: number;
  created_at: string;
  updated_at: string | null;
  course_id: number;
}

export interface CourseResourcesResponse {
  success: boolean;
  message: string;
  count: number;
  data: CourseResource[];
}
