import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";

import {
  getApiErrorMessage,
  getTestQuestions,
  submitTestAttempt,
} from "@/services/mockTest.service";
import type {
  MockTestType,
  PersistedTestSession,
  SubmitAnswer,
  SubmitTestResponse,
} from "@/types/mock-test";

const TEST_DURATION_SECONDS = 60 * 60;
const STORAGE_VERSION = 1 as const;

interface UseMockTestSessionParams {
  type: MockTestType;
  resourceId: string;
}

function getRemainingSeconds(deadlineAt: number): number {
  return Math.max(0, Math.ceil((deadlineAt - Date.now()) / 1000));
}

function isPersistedSession(value: unknown): value is PersistedTestSession {
  if (typeof value !== "object" || value === null) return false;

  const session = value as Partial<PersistedTestSession>;
  return (
    session.version === STORAGE_VERSION &&
    typeof session.answers === "object" &&
    session.answers !== null &&
    Number.isFinite(session.currentIndex) &&
    Number.isFinite(session.startedAt) &&
    Number.isFinite(session.deadlineAt)
  );
}

export function useMockTestSession({
  type,
  resourceId,
}: UseMockTestSessionParams) {
  const storageKey = useMemo(
    () => `@artistic-vicky/test-session/${type}/${resourceId}`,
    [resourceId, type],
  );

  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [testStarted, setTestStarted] = useState(false);
  const [startedAt, setStartedAt] = useState(0);
  const [deadlineAt, setDeadlineAt] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TEST_DURATION_SECONDS);
  const [result, setResult] = useState<SubmitTestResponse | null>(null);
  const [restored, setRestored] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const answersRef = useRef(answers);
  const autoSubmitStartedRef = useRef(false);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const questionsQuery = useQuery({
    queryKey: ["test-questions", type, resourceId],
    queryFn: () => getTestQuestions(type, resourceId),
    enabled: Boolean(resourceId),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const submitMutation = useMutation({
    mutationFn: submitTestAttempt,
  });

  useEffect(() => {
    let active = true;

    setAnswers({});
    setCurrentIndex(0);
    setTestStarted(false);
    setStartedAt(0);
    setDeadlineAt(0);
    setTimeLeft(TEST_DURATION_SECONDS);
    setResult(null);
    setSubmitError(null);
    setRestored(false);
    autoSubmitStartedRef.current = false;

    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        if (!active || !raw) return;

        const parsed: unknown = JSON.parse(raw);
        if (!isPersistedSession(parsed)) {
          await AsyncStorage.removeItem(storageKey);
          return;
        }

        const safeAnswers = Object.fromEntries(
          Object.entries(parsed.answers)
            .map(([questionId, optionId]) => [
              Number(questionId),
              Number(optionId),
            ])
            .filter(
              ([questionId, optionId]) =>
                Number.isFinite(questionId) && Number.isFinite(optionId),
            ),
        ) as Record<number, number>;

        setAnswers(safeAnswers);
        setCurrentIndex(Math.max(0, parsed.currentIndex));
        setStartedAt(parsed.startedAt);
        setDeadlineAt(parsed.deadlineAt);
        setTimeLeft(getRemainingSeconds(parsed.deadlineAt));
        setTestStarted(true);
      } catch {
        await AsyncStorage.removeItem(storageKey);
      } finally {
        if (active) setRestored(true);
      }
    })();

    return () => {
      active = false;
    };
  }, [storageKey]);

  useEffect(() => {
    if (!questionsQuery.data?.length) return;

    setCurrentIndex((index) =>
      Math.min(Math.max(index, 0), questionsQuery.data.length - 1),
    );
  }, [questionsQuery.data]);

  useEffect(() => {
    if (!restored || !testStarted || result || !deadlineAt) return;

    const snapshot: PersistedTestSession = {
      version: STORAGE_VERSION,
      answers,
      currentIndex,
      startedAt,
      deadlineAt,
    };

    const timeout = setTimeout(() => {
      void AsyncStorage.setItem(storageKey, JSON.stringify(snapshot));
    }, 150);

    return () => clearTimeout(timeout);
  }, [
    answers,
    currentIndex,
    deadlineAt,
    restored,
    result,
    startedAt,
    storageKey,
    testStarted,
  ]);

  const submit = useCallback(
    async ({ allowEmpty = false }: { allowEmpty?: boolean } = {}) => {
      if (submitMutation.isPending) {
        return {
          ok: false as const,
          error: "Submission is already in progress.",
        };
      }

      const answerEntries = Object.entries(answersRef.current);
      if (!allowEmpty && answerEntries.length === 0) {
        return {
          ok: false as const,
          error: "Attempt at least one question first.",
        };
      }

      const formattedAnswers: SubmitAnswer[] = answerEntries.map(
        ([questionId, optionId]) => ({
          question_id: Number(questionId),
          selected_option_id: Number(optionId),
        }),
      );

      setSubmitError(null);

      try {
        const submitResult = await submitMutation.mutateAsync({
          type,
          resourceId,
          answers: formattedAnswers,
        });

        setResult(submitResult);
        setTestStarted(false);
        await AsyncStorage.removeItem(storageKey);
        return { ok: true as const };
      } catch (error) {
        const message = getApiErrorMessage(error, "Failed to submit the test.");
        setSubmitError(message);
        return { ok: false as const, error: message };
      }
    },
    [resourceId, storageKey, submitMutation, type],
  );

  useEffect(() => {
    if (!testStarted || result || !deadlineAt) return;

    const updateTimer = () => {
      const remaining = getRemainingSeconds(deadlineAt);
      setTimeLeft(remaining);

      if (remaining === 0 && !autoSubmitStartedRef.current) {
        autoSubmitStartedRef.current = true;
        void submit({ allowEmpty: true });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") updateTimer();
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [deadlineAt, result, submit, testStarted]);

  const startTest = useCallback(() => {
    const now = Date.now();
    const deadline = now + TEST_DURATION_SECONDS * 1000;

    setStartedAt(now);
    setDeadlineAt(deadline);
    setTimeLeft(TEST_DURATION_SECONDS);
    setTestStarted(true);
    setSubmitError(null);
    autoSubmitStartedRef.current = false;
  }, []);

  const selectAnswer = useCallback((questionId: number, optionId: number) => {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: optionId,
    }));
  }, []);

  const jumpToQuestion = useCallback((index: number) => {
    setCurrentIndex(Math.max(0, index));
  }, []);

  const goPrevious = useCallback(() => {
    setCurrentIndex((index) => Math.max(0, index - 1));
  }, []);

  const goNext = useCallback(() => {
    const lastIndex = Math.max(0, (questionsQuery.data?.length ?? 1) - 1);
    setCurrentIndex((index) => Math.min(lastIndex, index + 1));
  }, [questionsQuery.data?.length]);

  const answeredCount = Object.keys(answers).length;
  const currentQuestion = questionsQuery.data?.[currentIndex];
  const progress = questionsQuery.data?.length
    ? ((currentIndex + 1) / questionsQuery.data.length) * 100
    : 0;

  return {
    questions: questionsQuery.data ?? [],
    questionsLoading: questionsQuery.isLoading || !restored,
    questionsError: questionsQuery.error
      ? getApiErrorMessage(questionsQuery.error, "Failed to load questions.")
      : null,
    retryQuestions: questionsQuery.refetch,
    answers,
    answeredCount,
    currentIndex,
    currentQuestion,
    progress,
    testStarted,
    timeLeft,
    result,
    submitting: submitMutation.isPending,
    submitError,
    startTest,
    selectAnswer,
    jumpToQuestion,
    goPrevious,
    goNext,
    submit,
  };
}
