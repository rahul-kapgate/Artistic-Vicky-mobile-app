export interface VideoLecture {
  id: number;
  title: string;
  description?: string | null;
  youtube_url: string;
  thumbnail_url?: string | null;
  duration?: number | null;
  is_free?: boolean;
  created_at: string;
}

export interface VideoSection {
  id: number;
  title: string;
  description?: string | null;
  course_id: number;
  created_at: string;
  video_lectures?: VideoLecture[];
}

export interface VideoSectionsResponse {
  success: boolean;
  message?: string;
  data: VideoSection[];
}
