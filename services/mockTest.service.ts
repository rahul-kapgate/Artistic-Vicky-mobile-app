import axios from "axios";

import { api } from "@/lib/api";
import type {
  MockTestQuestion,
  MockTestType,
  SubmitAnswer,
  SubmitTestResponse,
} from "@/types/mock-test";

interface QuestionsApiResponse {
  success: boolean;
  data: unknown;
  message?: string;
}

interface SubmitTestParams {
  type: MockTestType;
  resourceId: string;
  answers: SubmitAnswer[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeQuestions(value: unknown): MockTestQuestion[] {
  if (!Array.isArray(value)) {
    throw new Error("The questions API returned an invalid response.");
  }

  return value.map((item, questionIndex) => {
    if (!isRecord(item)) {
      throw new Error(`Question ${questionIndex + 1} is invalid.`);
    }

    const rawOptions = item.options;
    if (!Array.isArray(rawOptions)) {
      throw new Error(`Question ${questionIndex + 1} has invalid options.`);
    }

    const options = rawOptions.map((option, optionIndex) => {
      if (!isRecord(option)) {
        throw new Error(
          `Option ${optionIndex + 1} of question ${questionIndex + 1} is invalid.`,
        );
      }

      const id = Number(option.id);
      const text = typeof option.text === "string" ? option.text.trim() : "";

      if (!Number.isFinite(id) || !text) {
        throw new Error(
          `Option ${optionIndex + 1} of question ${questionIndex + 1} is incomplete.`,
        );
      }

      return { id, text };
    });

    const id = Number(item.id);
    const questionText =
      typeof item.question_text === "string" ? item.question_text.trim() : "";

    if (!Number.isFinite(id) || !questionText || options.length < 2) {
      throw new Error(`Question ${questionIndex + 1} is incomplete.`);
    }

    return {
      id,
      question_text: questionText,
      options,
      difficulty:
        typeof item.difficulty === "string" ? item.difficulty : undefined,
      image_url:
        typeof item.image_url === "string" || item.image_url === null
          ? item.image_url
          : null,
    };
  });
}

function normalizeSubmitResponse(value: unknown): SubmitTestResponse {
  if (!isRecord(value)) {
    throw new Error("The submit API returned an invalid response.");
  }

  const score = Number(value.score);
  const totalQuestions = Number(
    value.totalQuestions ?? value.total_questions ?? 0,
  );

  if (!Number.isFinite(score) || !Number.isFinite(totalQuestions)) {
    throw new Error("The result payload is incomplete.");
  }

  return {
    success: value.success !== false,
    message:
      typeof value.message === "string"
        ? value.message
        : "Test submitted successfully.",
    score,
    totalQuestions,
    data: value.data,
  };
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data;

    if (isRecord(responseData)) {
      const message = responseData.message ?? responseData.error;
      if (typeof message === "string" && message.trim()) {
        return message;
      }
    }

    if (error.code === "ECONNABORTED") {
      return "The request timed out. Check your connection and try again.";
    }

    if (!error.response) {
      return "Unable to reach the server. Check your internet connection.";
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export async function getTestQuestions(
  type: MockTestType,
  resourceId: string,
): Promise<MockTestQuestion[]> {
  const endpoint =
    type === "mock"
      ? `/mock-test/${encodeURIComponent(resourceId)}/questions`
      : `/pyq-mock-test/paper/${encodeURIComponent(resourceId)}/questions`;

  const response = await api.get<QuestionsApiResponse>(endpoint);

  if (!response.data?.success) {
    throw new Error(response.data?.message || "Failed to load questions.");
  }

  return normalizeQuestions(response.data.data);
}

export async function submitTestAttempt({
  type,
  resourceId,
  answers,
}: SubmitTestParams): Promise<SubmitTestResponse> {
  const endpoint =
    type === "mock" ? "/mock-test/submit" : "/pyq-mock-test/attempt/submit";

  const payload =
    type === "mock"
      ? {
          course_id: Number(resourceId),
          answers,
        }
      : {
          paper_id: Number(resourceId),
          answers,
        };

  if (!Number.isFinite(Number(resourceId))) {
    throw new Error("A valid test ID is required.");
  }

  const response = await api.post<unknown>(endpoint, payload);
  return normalizeSubmitResponse(response.data);
}
