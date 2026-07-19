import { api } from "@/lib/api";
import type { VideoSection, VideoSectionsResponse } from "@/types/video";

const DEFAULT_VIDEO_COURSE_ID = 1;

export async function getVideoSections(): Promise<VideoSection[]> {
  const response = await api.get<VideoSectionsResponse>("/section", {
    params: {
      course_id: DEFAULT_VIDEO_COURSE_ID,
    },
  });

  if (!response.data?.success || !Array.isArray(response.data.data)) {
    throw new Error("Invalid video sections response.");
  }

  return response.data.data;
}
