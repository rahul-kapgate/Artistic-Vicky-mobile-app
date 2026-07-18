import { api } from "@/lib/api";
import type {
  LiveTestAnswer,
  LiveTestSession,
  LiveTestSessionResponse,
  PublicLiveTest,
  PublicLiveTestsResponse,
  SubmitLiveTestResponse,
} from "@/types/live-test";

export async function getPublicLiveTests(): Promise<PublicLiveTest[]> {
  const response = await api.get<PublicLiveTestsResponse>("/live-test/public");

  if (!response.data?.success || !Array.isArray(response.data.data)) {
    throw new Error(
      response.data?.message || "Invalid public live tests response.",
    );
  }

  return response.data.data;
}

export async function getLiveTestSession(
  testId: string | number,
): Promise<LiveTestSession | null> {
  try {
    const response = await api.get<LiveTestSessionResponse>(
      `/live-test/${testId}/session`,
    );

    if (!response.data?.success || !response.data.data) {
      throw new Error(response.data?.message || "Invalid live test session.");
    }

    return response.data.data;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return null;
    }

    throw error;
  }
}

export async function startLiveTest(
  testId: string | number,
): Promise<LiveTestSession> {
  const response = await api.post<LiveTestSessionResponse>(
    `/live-test/${testId}/start`,
  );

  if (!response.data?.success || !response.data.data) {
    throw new Error(response.data?.message || "Failed to start live test.");
  }

  return response.data.data;
}

export async function submitLiveTest(
  testId: string | number,
  answers: LiveTestAnswer[],
): Promise<SubmitLiveTestResponse> {
  const response = await api.post<SubmitLiveTestResponse>(
    `/live-test/${testId}/submit`,
    { answers },
  );

  if (!response.data?.success) {
    throw new Error(response.data?.message || "Failed to submit live test.");
  }

  return response.data;
}
