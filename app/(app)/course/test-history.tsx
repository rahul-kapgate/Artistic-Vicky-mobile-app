import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  AttemptType,
  getStudentAttempts,
  TestAttempt,
} from "@/services/attempt.service";

type DateRange = "all" | "7" | "30" | "90";
const TOTAL_TEST_MARKS = 40;

function getParamValue(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function getAccuracy(attempt: TestAttempt): number {
  const score = Number(attempt.score) || 0;

  return Math.max(
    0,
    Math.min(100, Math.round((score / TOTAL_TEST_MARKS) * 100)),
  );
}

function formatDate(value: string): string {
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

function getAttemptTitle(attempt: TestAttempt, type: AttemptType): string {
  if (type === "pyq") {
    return attempt.pyq_papers?.year
      ? `PYQ ${attempt.pyq_papers.year}`
      : "Previous Year Question Paper";
  }

  return attempt.courses?.course_name?.trim() || "MAH AAC CET Mock Test";
}

function getScoreColors(accuracy: number) {
  if (accuracy >= 70) {
    return {
      text: "#34D399",
      background: "rgba(52, 211, 153, 0.12)",
      border: "rgba(52, 211, 153, 0.25)",
    };
  }

  if (accuracy >= 40) {
    return {
      text: "#FBBF24",
      background: "rgba(251, 191, 36, 0.12)",
      border: "rgba(251, 191, 36, 0.25)",
    };
  }

  return {
    text: "#FB7185",
    background: "rgba(251, 113, 133, 0.12)",
    border: "rgba(251, 113, 133, 0.25)",
  };
}

function AttemptCard({
  attempt,
  type,
}: {
  attempt: TestAttempt;
  type: AttemptType;
}) {
  const totalAnswered = attempt.answers?.length ?? 0;
  const accuracy = getAccuracy(attempt);
  const scoreColors = getScoreColors(accuracy);

  const handleReview = () => {
    router.push({
      pathname: "/course/result/[type]/[attemptId]",
      params: {
        type,
        attemptId: String(attempt.id),
      },
    });
  };

  return (
    <Pressable
      onPress={handleReview}
      style={({ pressed }) => [
        styles.attemptCard,
        pressed && styles.pressedCard,
      ]}
    >
      <View style={styles.attemptTop}>
        <View style={styles.attemptHeading}>
          <View style={styles.attemptIcon}>
            <Ionicons
              name={type === "pyq" ? "time-outline" : "clipboard-outline"}
              size={19}
              color="#67E8F9"
            />
          </View>

          <View style={styles.attemptTitleContainer}>
            <Text style={styles.attemptTitle} numberOfLines={2}>
              {getAttemptTitle(attempt, type)}
            </Text>

            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={12} color="#64748B" />

              <Text style={styles.attemptDate}>
                {formatDate(attempt.submitted_at)}
              </Text>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.scoreBadge,
            {
              backgroundColor: scoreColors.background,
              borderColor: scoreColors.border,
            },
          ]}
        >
          <Text style={[styles.scoreValue, { color: scoreColors.text }]}>
            {attempt.score}/{TOTAL_TEST_MARKS}
          </Text>

          <Text style={styles.scoreLabel}>marks</Text>
        </View>
      </View>

      <View style={styles.accuracyHeading}>
        <Text style={styles.accuracyLabel}>Accuracy</Text>

        <Text style={[styles.accuracyValue, { color: scoreColors.text }]}>
          {accuracy}%
        </Text>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressValue,
            {
              width: `${accuracy}%`,
              backgroundColor: scoreColors.text,
            },
          ]}
        />
      </View>

      <View style={styles.attemptFooter}>
        <View style={styles.questionsInfo}>
          <Ionicons name="list-outline" size={15} color="#94A3B8" />

          <Text style={styles.questionsText}>
            {totalAnswered}/{TOTAL_TEST_MARKS} questions answered
          </Text>
        </View>

        <View style={styles.reviewButton}>
          <Text style={styles.reviewText}>Review</Text>

          <Ionicons name="chevron-forward" size={16} color="#22D3EE" />
        </View>
      </View>
    </Pressable>
  );
}

export default function TestHistoryScreen() {
  const params = useLocalSearchParams<{
    type?: string | string[];
    studentId?: string | string[];
  }>();

  const typeParam = getParamValue(params.type);
  const studentIdParam = getParamValue(params.studentId);

  const studentId = Number(studentIdParam);

  const initialType: AttemptType = typeParam === "pyq" ? "pyq" : "mock";

  const [selectedType, setSelectedType] = useState<AttemptType>(initialType);

  const [mockAttempts, setMockAttempts] = useState<TestAttempt[]>([]);
  const [pyqAttempts, setPyqAttempts] = useState<TestAttempt[]>([]);

  const [dateRange, setDateRange] = useState<DateRange>("all");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedType(initialType);
  }, [initialType]);

  const loadAttempts = useCallback(
    async (refresh = false) => {
      if (!studentId || Number.isNaN(studentId)) {
        setError("Student information is unavailable.");
        setLoading(false);
        return;
      }

      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const [mockResult, pyqResult] = await Promise.allSettled([
          getStudentAttempts(studentId, "mock"),
          getStudentAttempts(studentId, "pyq"),
        ]);

        if (
          mockResult.status === "rejected" &&
          pyqResult.status === "rejected"
        ) {
          throw new Error("Unable to load test history.");
        }

        setMockAttempts(
          mockResult.status === "fulfilled" ? mockResult.value : [],
        );

        setPyqAttempts(pyqResult.status === "fulfilled" ? pyqResult.value : []);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load test history.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [studentId],
  );

  useEffect(() => {
    loadAttempts();
  }, [loadAttempts]);

  const selectedAttempts = selectedType === "mock" ? mockAttempts : pyqAttempts;

  const filteredAttempts = useMemo(() => {
    if (dateRange === "all") {
      return selectedAttempts;
    }

    const days = Number(dateRange);
    const cutoff = new Date();

    cutoff.setDate(cutoff.getDate() - days);
    cutoff.setHours(0, 0, 0, 0);

    return selectedAttempts.filter(
      (attempt) => new Date(attempt.submitted_at).getTime() >= cutoff.getTime(),
    );
  }, [selectedAttempts, dateRange]);

  const averageAccuracy = useMemo(() => {
    if (filteredAttempts.length === 0) {
      return 0;
    }

    const total = filteredAttempts.reduce(
      (sum, attempt) => sum + getAccuracy(attempt),
      0,
    );

    return Math.round(total / filteredAttempts.length);
  }, [filteredAttempts]);

  const bestAccuracy = useMemo(() => {
    if (filteredAttempts.length === 0) {
      return 0;
    }

    return Math.max(...filteredAttempts.map((attempt) => getAccuracy(attempt)));
  }, [filteredAttempts]);

  const renderHeader = () => (
    <View>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </Pressable>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerEyebrow}>YOUR PROGRESS</Text>
          <Text style={styles.headerTitle}>Test History</Text>
        </View>

        <Pressable
          onPress={() => loadAttempts(true)}
          style={styles.refreshButton}
        >
          <Ionicons name="refresh-outline" size={21} color="#67E8F9" />
        </Pressable>
      </View>

      <LinearGradient
        colors={["rgba(30, 41, 59, 0.96)", "rgba(30, 27, 75, 0.9)"]}
        style={styles.summaryCard}
      >
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{filteredAttempts.length}</Text>
          <Text style={styles.summaryLabel}>Attempts</Text>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{averageAccuracy}%</Text>
          <Text style={styles.summaryLabel}>Average</Text>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{bestAccuracy}%</Text>
          <Text style={styles.summaryLabel}>Best</Text>
        </View>
      </LinearGradient>

      <View style={styles.tabs}>
        <Pressable
          onPress={() => setSelectedType("mock")}
          style={[styles.tab, selectedType === "mock" && styles.activeTab]}
        >
          <Ionicons
            name="clipboard-outline"
            size={17}
            color={selectedType === "mock" ? "#FFFFFF" : "#94A3B8"}
          />

          <Text
            style={[
              styles.tabText,
              selectedType === "mock" && styles.activeTabText,
            ]}
          >
            Mock Tests
          </Text>

          <View style={styles.tabCount}>
            <Text style={styles.tabCountText}>{mockAttempts.length}</Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => setSelectedType("pyq")}
          style={[styles.tab, selectedType === "pyq" && styles.activeTab]}
        >
          <Ionicons
            name="time-outline"
            size={17}
            color={selectedType === "pyq" ? "#FFFFFF" : "#94A3B8"}
          />

          <Text
            style={[
              styles.tabText,
              selectedType === "pyq" && styles.activeTabText,
            ]}
          >
            PYQ
          </Text>

          <View style={styles.tabCount}>
            <Text style={styles.tabCountText}>{pyqAttempts.length}</Text>
          </View>
        </Pressable>
      </View>

      <View style={styles.filters}>
        {(
          [
            ["all", "All"],
            ["7", "7 Days"],
            ["30", "30 Days"],
            ["90", "90 Days"],
          ] as const
        ).map(([value, label]) => (
          <Pressable
            key={value}
            onPress={() => setDateRange(value)}
            style={[
              styles.filterButton,
              dateRange === value && styles.activeFilterButton,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                dateRange === value && styles.activeFilterText,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.resultsHeading}>
        {selectedType === "pyq" ? "PYQ" : "Mock Test"} Attempts
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#22D3EE" />
          <Text style={styles.stateText}>Loading test history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centerState}>
          <Ionicons name="alert-circle-outline" size={42} color="#FB7185" />

          <Text style={styles.errorTitle}>Unable to load history</Text>

          <Text style={styles.stateText}>{error}</Text>

          <Pressable onPress={() => loadAttempts()} style={styles.retryButton}>
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <FlatList
        data={filteredAttempts}
        keyExtractor={(item) => `${selectedType}-${item.id}`}
        renderItem={({ item }) => (
          <AttemptCard attempt={item} type={selectedType} />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={40} color="#64748B" />

            <Text style={styles.emptyTitle}>No attempts found</Text>

            <Text style={styles.stateText}>
              No tests were submitted during this period.
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadAttempts(true)}
            tintColor="#22D3EE"
            colors={["#22D3EE"]}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#070B18",
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
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

  headerTitleContainer: {
    flex: 1,
    marginLeft: 13,
  },

  headerEyebrow: {
    color: "#22D3EE",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.3,
  },

  headerTitle: {
    marginTop: 3,
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
  },

  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34,211,238,0.08)",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.15)",
  },

  summaryCard: {
    paddingVertical: 18,
    borderRadius: 21,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  summaryItem: {
    flex: 1,
    alignItems: "center",
  },

  summaryValue: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },

  summaryLabel: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 10,
    fontWeight: "600",
  },

  summaryDivider: {
    width: 1,
    height: 34,
    backgroundColor: "rgba(255,255,255,0.09)",
  },

  tabs: {
    marginTop: 18,
    padding: 4,
    borderRadius: 16,
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  tab: {
    flex: 1,
    minHeight: 45,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  activeTab: {
    backgroundColor: "#4F46E5",
  },

  tabText: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "700",
  },

  activeTabText: {
    color: "#FFFFFF",
  },

  tabCount: {
    minWidth: 23,
    height: 23,
    paddingHorizontal: 5,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
  },

  tabCountText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },

  filters: {
    marginTop: 15,
    flexDirection: "row",
    gap: 8,
  },

  filterButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  activeFilterButton: {
    backgroundColor: "rgba(34,211,238,0.1)",
    borderColor: "rgba(34,211,238,0.25)",
  },

  filterText: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "700",
  },

  activeFilterText: {
    color: "#67E8F9",
  },

  resultsHeading: {
    marginTop: 24,
    marginBottom: 12,
    color: "#CBD5E1",
    fontSize: 14,
    fontWeight: "700",
  },

  attemptCard: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
  },

  pressedCard: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },

  attemptTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

  attemptHeading: {
    flex: 1,
    flexDirection: "row",
    gap: 11,
  },

  attemptIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34,211,238,0.08)",
  },

  attemptTitleContainer: {
    flex: 1,
  },

  attemptTitle: {
    color: "#F8FAFC",
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
  },

  dateRow: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  attemptDate: {
    color: "#64748B",
    fontSize: 10,
  },

  scoreBadge: {
    minWidth: 55,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 13,
    alignItems: "center",
    borderWidth: 1,
  },

  scoreValue: {
    fontSize: 18,
    fontWeight: "900",
  },

  scoreLabel: {
    color: "#64748B",
    fontSize: 9,
  },

  accuracyHeading: {
    marginTop: 15,
    marginBottom: 7,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  accuracyLabel: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "600",
  },

  accuracyValue: {
    fontSize: 10,
    fontWeight: "800",
  },

  progressTrack: {
    height: 5,
    borderRadius: 99,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  progressValue: {
    height: "100%",
    borderRadius: 99,
  },

  attemptFooter: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  questionsInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  questionsText: {
    color: "#94A3B8",
    fontSize: 10,
  },

  reviewButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },

  reviewText: {
    color: "#22D3EE",
    fontSize: 11,
    fontWeight: "700",
  },

  centerState: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  stateText: {
    marginTop: 9,
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
    paddingVertical: 70,
    alignItems: "center",
  },

  emptyTitle: {
    marginTop: 12,
    color: "#E2E8F0",
    fontSize: 15,
    fontWeight: "700",
  },
});
