import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  AttemptDetails,
  AttemptOption,
  AttemptQuestionDetail,
  AttemptType,
  getAttemptDetails,
} from "@/services/attempt.service";

type ReviewFilter = "all" | "correct" | "incorrect";
const TOTAL_TEST_MARKS = 40;

function getParamValue(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function formatSubmittedDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function capitalize(value?: string | null): string {
  if (!value) {
    return "Unknown";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getOptionState(
  question: AttemptQuestionDetail,
  option: AttemptOption,
) {
  const isCorrectOption = option.id === question.correct_option_id;

  const isSelectedOption = option.id === question.selected_option_id;

  if (isCorrectOption) {
    return {
      background: "rgba(16,185,129,0.11)",
      border: "rgba(52,211,153,0.35)",
      icon: "checkmark-circle" as const,
      iconColor: "#34D399",
      textColor: "#D1FAE5",
    };
  }

  if (isSelectedOption && !question.is_correct) {
    return {
      background: "rgba(244,63,94,0.11)",
      border: "rgba(251,113,133,0.35)",
      icon: "close-circle" as const,
      iconColor: "#FB7185",
      textColor: "#FFE4E6",
    };
  }

  return {
    background: "rgba(255,255,255,0.025)",
    border: "rgba(255,255,255,0.07)",
    icon: "ellipse-outline" as const,
    iconColor: "#475569",
    textColor: "#94A3B8",
  };
}

function OptionRow({
  option,
  question,
}: {
  option: AttemptOption;
  question: AttemptQuestionDetail;
}) {
  const state = getOptionState(question, option);

  const isCorrectOption = option.id === question.correct_option_id;

  const isSelectedOption = option.id === question.selected_option_id;

  let label: string | null = null;

  if (isCorrectOption && isSelectedOption) {
    label = "Your answer • Correct";
  } else if (isCorrectOption) {
    label = "Correct answer";
  } else if (isSelectedOption) {
    label = "Your answer";
  }

  return (
    <View
      style={[
        styles.optionRow,
        {
          backgroundColor: state.background,
          borderColor: state.border,
        },
      ]}
    >
      <Ionicons name={state.icon} size={20} color={state.iconColor} />

      <View style={styles.optionContent}>
        <Text style={[styles.optionText, { color: state.textColor }]}>
          {option.text}
        </Text>

        {label && (
          <Text style={[styles.optionLabel, { color: state.iconColor }]}>
            {label}
          </Text>
        )}
      </View>
    </View>
  );
}

function QuestionCard({
  question,
  index,
}: {
  question: AttemptQuestionDetail;
  index: number;
}) {
  return (
    <View style={styles.questionCard}>
      <View style={styles.questionHeader}>
        <View style={styles.questionNumber}>
          <Text style={styles.questionNumberText}>{index + 1}</Text>
        </View>

        <View
          style={[
            styles.resultStatus,
            question.is_correct ? styles.correctStatus : styles.incorrectStatus,
          ]}
        >
          <Ionicons
            name={question.is_correct ? "checkmark-circle" : "close-circle"}
            size={15}
            color={question.is_correct ? "#34D399" : "#FB7185"}
          />

          <Text
            style={[
              styles.resultStatusText,
              {
                color: question.is_correct ? "#34D399" : "#FB7185",
              },
            ]}
          >
            {question.is_correct ? "Correct" : "Incorrect"}
          </Text>
        </View>
      </View>

      <Text style={styles.questionText}>{question.question_text}</Text>

      <View style={styles.questionMeta}>
        <View style={styles.difficultyBadge}>
          <Ionicons name="speedometer-outline" size={13} color="#A78BFA" />

          <Text style={styles.difficultyText}>
            {capitalize(question.difficulty)}
          </Text>
        </View>

        <Text style={styles.questionId}>Question #{question.id}</Text>
      </View>

      {question.image_url ? (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: question.image_url }}
            style={styles.questionImage}
            resizeMode="contain"
          />
        </View>
      ) : null}

      <View style={styles.optionsContainer}>
        {question.options.map((option) => (
          <OptionRow key={option.id} option={option} question={question} />
        ))}
      </View>
    </View>
  );
}

export default function AttemptResultScreen() {
  const params = useLocalSearchParams<{
    type?: string | string[];
    attemptId?: string | string[];
  }>();

  const typeParam = getParamValue(params.type);
  const attemptIdParam = getParamValue(params.attemptId);

  const type: AttemptType = typeParam === "pyq" ? "pyq" : "mock";

  const attemptId = Number(attemptIdParam);

  const [details, setDetails] = useState<AttemptDetails | null>(null);

  const [filter, setFilter] = useState<ReviewFilter>("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDetails = useCallback(async () => {
    if (!attemptId || Number.isNaN(attemptId)) {
      setError("Invalid attempt ID.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getAttemptDetails(attemptId, type);

      setDetails(result);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load the result.",
      );
    } finally {
      setLoading(false);
    }
  }, [attemptId, type]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const correctCount = useMemo(
    () => details?.data.filter((question) => question.is_correct).length ?? 0,
    [details],
  );

  const incorrectCount = useMemo(
    () => details?.data.filter((question) => !question.is_correct).length ?? 0,
    [details],
  );

  const unansweredCount = useMemo(
    () =>
      details?.data.filter(
        (question) =>
          question.selected_option_id === null ||
          question.selected_option_id === undefined,
      ).length ?? 0,
    [details],
  );

  const accuracy = useMemo(() => {
    if (!details) {
      return 0;
    }

    const score = Number(details.score) || 0;

    return Math.max(
      0,
      Math.min(100, Math.round((score / TOTAL_TEST_MARKS) * 100)),
    );
  }, [details]);

  const filteredQuestions = useMemo(() => {
    if (!details) {
      return [];
    }

    if (filter === "correct") {
      return details.data.filter((question) => question.is_correct);
    }

    if (filter === "incorrect") {
      return details.data.filter((question) => !question.is_correct);
    }

    return details.data;
  }, [details, filter]);

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#22D3EE" />
          <Text style={styles.loadingText}>Loading result review...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !details) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centerState}>
          <Ionicons name="alert-circle-outline" size={44} color="#FB7185" />

          <Text style={styles.errorTitle}>Unable to load result</Text>

          <Text style={styles.loadingText}>
            {error || "Result data is unavailable."}
          </Text>

          <Pressable onPress={loadDetails} style={styles.retryButton}>
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </Pressable>

          <View style={styles.headerTextContainer}>
            <Text style={styles.headerEyebrow}>
              {type === "pyq" ? "PYQ RESULT" : "MOCK TEST RESULT"}
            </Text>

            <Text style={styles.headerTitle}>Result Review</Text>
          </View>
        </View>

        <LinearGradient
          colors={["rgba(49, 46, 129, 0.95)", "rgba(30, 41, 59, 0.96)"]}
          style={styles.scoreCard}
        >
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreCircleValue}>{accuracy}%</Text>
            <Text style={styles.scoreCircleLabel}>Accuracy</Text>
          </View>

          <View style={styles.scoreDetails}>
            <Text style={styles.scoreTitle}>
              {details.score} out of {TOTAL_TEST_MARKS} marks
            </Text>

            <Text style={styles.scoreSubtitle}>
              Submitted {formatSubmittedDate(details.submitted_at)}
            </Text>

            <View style={styles.scoreBreakdown}>
              <View style={styles.breakdownItem}>
                <View
                  style={[styles.breakdownDot, { backgroundColor: "#34D399" }]}
                />

                <Text style={styles.breakdownText}>{correctCount} correct</Text>
              </View>

              <View style={styles.breakdownItem}>
                <View
                  style={[styles.breakdownDot, { backgroundColor: "#FB7185" }]}
                />

                <Text style={styles.breakdownText}>
                  {incorrectCount} incorrect
                </Text>
              </View>

              {unansweredCount > 0 && (
                <View style={styles.breakdownItem}>
                  <View
                    style={[
                      styles.breakdownDot,
                      { backgroundColor: "#94A3B8" },
                    ]}
                  />

                  <Text style={styles.breakdownText}>
                    {unansweredCount} unanswered
                  </Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>

        <View style={styles.filters}>
          {(
            [
              ["all", `All ${details.data.length}`],
              ["correct", `Correct ${correctCount}`],
              ["incorrect", `Incorrect ${incorrectCount}`],
            ] as const
          ).map(([value, label]) => (
            <Pressable
              key={value}
              onPress={() => setFilter(value)}
              style={[
                styles.filterButton,
                filter === value && styles.activeFilterButton,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === value && styles.activeFilterText,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.reviewHeading}>
          <View>
            <Text style={styles.reviewEyebrow}>ANSWER REVIEW</Text>

            <Text style={styles.reviewTitle}>
              {filteredQuestions.length}{" "}
              {filteredQuestions.length === 1 ? "Question" : "Questions"}
            </Text>
          </View>

          <Ionicons name="document-text-outline" size={24} color="#67E8F9" />
        </View>

        {filteredQuestions.length > 0 ? (
          filteredQuestions.map((question, index) => (
            <QuestionCard key={question.id} question={question} index={index} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="checkmark-done-circle-outline"
              size={42}
              color="#64748B"
            />

            <Text style={styles.emptyTitle}>No questions in this filter</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#070B18",
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 45,
  },

  header: {
    paddingTop: 12,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "center",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  headerTextContainer: {
    marginLeft: 13,
  },

  headerEyebrow: {
    color: "#22D3EE",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
  },

  headerTitle: {
    marginTop: 3,
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
  },

  scoreCard: {
    padding: 20,
    borderRadius: 23,
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  scoreCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34,211,238,0.08)",
    borderWidth: 5,
    borderColor: "rgba(34,211,238,0.4)",
  },

  scoreCircleValue: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "900",
  },

  scoreCircleLabel: {
    marginTop: 1,
    color: "#94A3B8",
    fontSize: 9,
    fontWeight: "600",
  },

  scoreDetails: {
    flex: 1,
  },

  scoreTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "800",
  },

  scoreSubtitle: {
    marginTop: 5,
    color: "#94A3B8",
    fontSize: 10,
    lineHeight: 15,
  },

  scoreBreakdown: {
    marginTop: 12,
    gap: 6,
  },

  breakdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  breakdownDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  breakdownText: {
    color: "#CBD5E1",
    fontSize: 10,
    fontWeight: "600",
  },

  filters: {
    marginTop: 18,
    flexDirection: "row",
    gap: 8,
  },

  filterButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 13,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  activeFilterButton: {
    backgroundColor: "rgba(79,70,229,0.8)",
    borderColor: "rgba(129,140,248,0.5)",
  },

  filterText: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "700",
  },

  activeFilterText: {
    color: "#FFFFFF",
  },

  reviewHeading: {
    marginTop: 25,
    marginBottom: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  reviewEyebrow: {
    color: "#22D3EE",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
  },

  reviewTitle: {
    marginTop: 3,
    color: "#F8FAFC",
    fontSize: 17,
    fontWeight: "800",
  },

  questionCard: {
    marginBottom: 15,
    padding: 17,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
  },

  questionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  questionNumber: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34,211,238,0.09)",
  },

  questionNumberText: {
    color: "#67E8F9",
    fontSize: 13,
    fontWeight: "900",
  },

  resultStatus: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
  },

  correctStatus: {
    backgroundColor: "rgba(16,185,129,0.1)",
    borderColor: "rgba(52,211,153,0.22)",
  },

  incorrectStatus: {
    backgroundColor: "rgba(244,63,94,0.1)",
    borderColor: "rgba(251,113,133,0.22)",
  },

  resultStatusText: {
    fontSize: 10,
    fontWeight: "800",
  },

  questionText: {
    marginTop: 15,
    color: "#F8FAFC",
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "700",
  },

  questionMeta: {
    marginTop: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  difficultyBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(139,92,246,0.09)",
  },

  difficultyText: {
    color: "#A78BFA",
    fontSize: 9,
    fontWeight: "700",
  },

  questionId: {
    color: "#475569",
    fontSize: 9,
  },

  imageContainer: {
    marginTop: 15,
    padding: 7,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  questionImage: {
    width: "100%",
    height: 220,
    borderRadius: 11,
  },

  optionsContainer: {
    marginTop: 16,
    gap: 9,
  },

  optionRow: {
    minHeight: 52,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
  },

  optionContent: {
    flex: 1,
  },

  optionText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
  },

  optionLabel: {
    marginTop: 3,
    fontSize: 8,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  centerState: {
    flex: 1,
    paddingHorizontal: 25,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 10,
    color: "#64748B",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },

  errorTitle: {
    marginTop: 12,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  retryButton: {
    marginTop: 18,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 13,
    backgroundColor: "#4F46E5",
  },

  retryText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  emptyState: {
    paddingVertical: 60,
    alignItems: "center",
  },

  emptyTitle: {
    marginTop: 12,
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "700",
  },
});
