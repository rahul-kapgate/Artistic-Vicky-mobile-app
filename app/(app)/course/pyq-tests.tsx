import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getPYQPapers } from "@/services/pyq.service";
import type { PYQPaper } from "@/types/pyq";

const COLORS = {
  background: "#050A1C",
  card: "#0F1735",
  white: "#FFFFFF",
  text: "#D8E0F5",
  muted: "#8E99B7",
  cyan: "#4CC3FF",
  cyanStrong: "#33D6FF",
  border: "rgba(255,255,255,0.08)",
  danger: "#FF6B9A",
};

type ListItem =
  | {
      type: "year";
      key: string;
      year: number;
      count: number;
    }
  | {
      type: "paper";
      key: string;
      paper: PYQPaper;
    };

function getParam(value?: string | string[]): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function getPaperTitle(paper: PYQPaper): string {
  if (paper.exam_day) {
    return `MAH AAC CET ${paper.year} — Day ${paper.exam_day}`;
  }

  return `MAH AAC CET ${paper.year}`;
}

function groupPapers(papers: PYQPaper[]): ListItem[] {
  const groupedPapers = new Map<number, PYQPaper[]>();

  papers.forEach((paper) => {
    const currentPapers = groupedPapers.get(paper.year) ?? [];

    currentPapers.push(paper);
    groupedPapers.set(paper.year, currentPapers);
  });

  return Array.from(groupedPapers.entries())
    .sort(([yearA], [yearB]) => yearB - yearA)
    .flatMap(([year, yearPapers]) => {
      const sortedPapers = [...yearPapers].sort((paperA, paperB) => {
        const dayA = paperA.exam_day ?? 0;
        const dayB = paperB.exam_day ?? 0;

        if (dayA !== dayB) {
          return dayA - dayB;
        }

        return paperB.id - paperA.id;
      });

      return [
        {
          type: "year" as const,
          key: `year-${year}`,
          year,
          count: sortedPapers.length,
        },
        ...sortedPapers.map((paper) => ({
          type: "paper" as const,
          key: `paper-${paper.id}`,
          paper,
        })),
      ];
    });
}

function LoadingState() {
  return (
    <View style={styles.centerState}>
      <ActivityIndicator size="large" color={COLORS.cyan} />

      <Text style={styles.stateTitle}>Loading PYQ papers</Text>

      <Text style={styles.stateDescription}>
        Fetching available previous-year question papers...
      </Text>
    </View>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View style={styles.centerState}>
      <View style={styles.errorIcon}>
        <Ionicons name="warning-outline" size={34} color={COLORS.danger} />
      </View>

      <Text style={styles.stateTitle}>Unable to load papers</Text>

      <Text style={styles.stateDescription}>{message}</Text>

      <Pressable
        onPress={onRetry}
        style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
      >
        <Ionicons name="refresh-outline" size={18} color={COLORS.background} />

        <Text style={styles.retryButtonText}>Try Again</Text>
      </Pressable>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.centerState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="documents-outline" size={36} color={COLORS.cyan} />
      </View>

      <Text style={styles.stateTitle}>No papers available</Text>

      <Text style={styles.stateDescription}>
        Previous-year papers will appear here when they are added.
      </Text>
    </View>
  );
}

function YearHeader({ year, count }: { year: number; count: number }) {
  return (
    <View style={styles.yearHeader}>
      <View style={styles.yearBadge}>
        <Ionicons name="calendar-outline" size={15} color={COLORS.cyanStrong} />

        <Text style={styles.yearText}>{year}</Text>
      </View>

      <View style={styles.yearDivider} />

      <Text style={styles.yearCount}>
        {count} {count === 1 ? "paper" : "papers"}
      </Text>
    </View>
  );
}

function PaperCard({
  paper,
  compact,
  onPress,
}: {
  paper: PYQPaper;
  compact: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Start ${getPaperTitle(paper)}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.paperCard,
        compact && styles.paperCardCompact,
        pressed && styles.paperCardPressed,
      ]}
    >
      <LinearGradient
        colors={["rgba(76,195,255,0.16)", "rgba(37,99,235,0.07)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.paperIcon}
      >
        <Ionicons name="document-text-outline" size={24} color={COLORS.cyan} />
      </LinearGradient>

      <View style={styles.paperContent}>
        <Text style={styles.paperTitle} numberOfLines={2}>
          {getPaperTitle(paper)}
        </Text>

        <View style={styles.paperMetaRow}>
          <View style={styles.metaItem}>
            <Ionicons
              name="help-circle-outline"
              size={14}
              color={COLORS.muted}
            />

            <Text style={styles.metaText}>
              {paper.total_questions} questions
            </Text>
          </View>

          {paper.exam_day ? (
            <View style={styles.metaItem}>
              <Ionicons name="sunny-outline" size={14} color={COLORS.muted} />

              <Text style={styles.metaText}>Day {paper.exam_day}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.startButton}>
        <Text style={styles.startButtonText}>Start</Text>

        <Ionicons name="chevron-forward" size={16} color={COLORS.cyanStrong} />
      </View>
    </Pressable>
  );
}

export default function PYQTestsScreen() {
  const { width, height } = useWindowDimensions();

  const params = useLocalSearchParams<{
    id?: string | string[];
    courseId?: string | string[];
  }>();

  const courseId = getParam(params.courseId) ?? getParam(params.id);

  const isTablet = width >= 768;
  const isCompact = width < 360 || height < 700;

  const horizontalPadding = isTablet ? 28 : isCompact ? 14 : 18;

  const {
    data: papers = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["pyq-papers", courseId],
    queryFn: () => getPYQPapers(courseId!),
    enabled: Boolean(courseId),

    // Avoid unnecessary repeated requests.
    staleTime: 5 * 60 * 1000,

    retry: 2,
  });

  const groupedItems = useMemo(() => {
    return groupPapers(papers);
  }, [papers]);

  const openPaper = (paperId: number) => {
    router.push({
      pathname: "/(app)/course/test/[type]/[id]",
      params: {
        type: "pyq",

        // This must be the paper ID, not course ID.
        id: String(paperId),
      },
    });
  };

  if (!courseId) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <StatusBar style="light" backgroundColor={COLORS.background} />

        <ErrorState
          message="The course ID is missing."
          onRetry={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar style="light" backgroundColor={COLORS.background} />

      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <View
        style={[
          styles.screen,
          {
            paddingHorizontal: horizontalPadding,
            maxWidth: isTablet ? 820 : undefined,
          },
        ]}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={10}
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="arrow-back" size={22} color={COLORS.white} />
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Previous Year Papers</Text>

            <Text style={styles.headerSubtitle}>
              {papers.length > 0
                ? `${papers.length} papers available`
                : "Choose a paper to begin"}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Refresh papers"
            disabled={isRefetching}
            hitSlop={10}
            onPress={() => void refetch()}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.pressed,
              isRefetching && styles.disabled,
            ]}
          >
            {isRefetching ? (
              <ActivityIndicator size="small" color={COLORS.cyan} />
            ) : (
              <Ionicons name="refresh-outline" size={21} color={COLORS.cyan} />
            )}
          </Pressable>
        </View>

        <LinearGradient
          colors={["#172554", "#111B45", "#080E28"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroCard, isCompact && styles.heroCardCompact]}
        >
          <View style={styles.heroIcon}>
            <Ionicons name="library-outline" size={27} color={COLORS.white} />
          </View>

          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Practice from real papers</Text>

            <Text style={styles.heroText}>
              Select a year and attempt the paper using the timed test
              interface.
            </Text>
          </View>
        </LinearGradient>

        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState
            message={
              error instanceof Error
                ? error.message
                : "Network error while loading papers."
            }
            onRetry={() => void refetch()}
          />
        ) : papers.length === 0 ? (
          <EmptyState />
        ) : (
          <FlatList
            data={groupedItems}
            keyExtractor={(item) => item.key}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={() => void refetch()}
                tintColor={COLORS.cyan}
                colors={[COLORS.cyan]}
                progressBackgroundColor={COLORS.card}
              />
            }
            renderItem={({ item }) => {
              if (item.type === "year") {
                return <YearHeader year={item.year} count={item.count} />;
              }

              return (
                <PaperCard
                  paper={item.paper}
                  compact={isCompact}
                  onPress={() => openPaper(item.paper.id)}
                />
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  screen: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
  },

  glowTop: {
    position: "absolute",
    top: -120,
    right: -110,
    width: 300,
    height: 300,
    borderRadius: 300,
    backgroundColor: "rgba(51,214,255,0.09)",
  },

  glowBottom: {
    position: "absolute",
    bottom: -150,
    left: -130,
    width: 340,
    height: 340,
    borderRadius: 340,
    backgroundColor: "rgba(124,58,237,0.12)",
  },

  header: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  headerCenter: {
    flex: 1,
    alignItems: "center",
  },

  headerTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
  },

  headerSubtitle: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 3,
    textAlign: "center",
  },

  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(22,35,74,0.88)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  heroCard: {
    borderRadius: 22,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: "rgba(76,195,255,0.14)",
    marginBottom: 14,
  },

  heroCardCompact: {
    padding: 14,
    borderRadius: 18,
  },

  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(76,195,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(76,195,255,0.24)",
  },

  heroContent: {
    flex: 1,
  },

  heroTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "900",
  },

  heroText: {
    color: "#C7D2FE",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },

  listContent: {
    paddingBottom: 32,
  },

  yearHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 17,
    paddingBottom: 9,
    paddingHorizontal: 2,
  },

  yearBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  yearText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },

  yearDivider: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  yearCount: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
  },

  paperCard: {
    minHeight: 82,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    padding: 13,
    borderRadius: 18,
    marginBottom: 10,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  paperCardCompact: {
    minHeight: 76,
    padding: 11,
    gap: 10,
    borderRadius: 16,
  },

  paperCardPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.995 }],
  },

  paperIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  paperContent: {
    flex: 1,
    minWidth: 0,
  },

  paperTitle: {
    color: COLORS.white,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
  },

  paperMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginTop: 7,
  },

  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  metaText: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "600",
  },

  startButton: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 10,
    borderRadius: 11,
    backgroundColor: "rgba(51,214,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(51,214,255,0.15)",
  },

  startButtonText: {
    color: COLORS.cyanStrong,
    fontSize: 12,
    fontWeight: "900",
  },

  centerState: {
    flex: 1,
    minHeight: 340,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  errorIcon: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,107,154,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,107,154,0.18)",
  },

  emptyIcon: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(76,195,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(76,195,255,0.15)",
  },

  stateTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 18,
    textAlign: "center",
  },

  stateDescription: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    textAlign: "center",
  },

  retryButton: {
    marginTop: 22,
    minHeight: 46,
    paddingHorizontal: 20,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.cyan,
  },

  retryButtonText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: "900",
  },

  pressed: {
    opacity: 0.78,
  },

  disabled: {
    opacity: 0.5,
  },
});
