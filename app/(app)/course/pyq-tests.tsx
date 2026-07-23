import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getPYQPapers } from "@/services/pyq.service";
import type { PYQPaper } from "@/types/pyq";

const COLORS = {
  background: "#050A1C",
  surface: "#0C1430",
  surfaceLight: "#111C3D",
  card: "#0F1735",
  white: "#FFFFFF",
  text: "#D8E0F5",
  muted: "#8E99B7",
  mutedDark: "#66728D",
  cyan: "#4CC3FF",
  cyanStrong: "#33D6FF",
  violet: "#A78BFA",
  pink: "#FF5AA5",
  green: "#22C55E",
  yellow: "#FACC15",
  border: "rgba(255,255,255,0.08)",
  borderStrong: "rgba(255,255,255,0.14)",
  danger: "#FF6B9A",
};

type SelectedYear = "All" | number;

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

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-IN").format(value);
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

function LoadingCard({ compact }: { compact: boolean }) {
  return (
    <View style={[styles.skeletonCard, compact && styles.skeletonCardCompact]}>
      <View style={styles.skeletonIcon} />

      <View style={styles.skeletonContent}>
        <View style={styles.skeletonTitle} />

        <View style={styles.skeletonMeta}>
          <View style={styles.skeletonMetaItem} />

          <View style={styles.skeletonMetaItemSmall} />
        </View>
      </View>

      <View style={styles.skeletonButton} />
    </View>
  );
}

function LoadingState({ compact }: { compact: boolean }) {
  return (
    <View style={styles.loadingList}>
      <View style={styles.loadingHeader}>
        <ActivityIndicator size="small" color={COLORS.cyan} />

        <Text style={styles.loadingText}>Loading previous-year papers...</Text>
      </View>

      {Array.from({ length: 5 }).map((_, index) => (
        <LoadingCard key={index} compact={compact} />
      ))}
    </View>
  );
}

function ErrorState({
  message,
  onRetry,
  onBack,
}: {
  message: string;
  onRetry: () => void;
  onBack?: () => void;
}) {
  return (
    <View style={styles.centerState}>
      <View style={styles.errorIcon}>
        <Ionicons name="warning-outline" size={35} color={COLORS.danger} />
      </View>

      <Text style={styles.stateTitle}>Unable to load papers</Text>

      <Text style={styles.stateDescription}>{message}</Text>

      <Pressable
        accessibilityRole="button"
        onPress={onRetry}
        style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
      >
        <Ionicons name="refresh-outline" size={18} color={COLORS.background} />

        <Text style={styles.retryButtonText}>Try Again</Text>
      </Pressable>

      {onBack ? (
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.secondaryButtonText}>Go Back</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function EmptyState({
  hasFilters,
  onClear,
}: {
  hasFilters: boolean;
  onClear: () => void;
}) {
  return (
    <View style={styles.centerState}>
      <View style={styles.emptyIcon}>
        <Ionicons
          name={hasFilters ? "search-outline" : "documents-outline"}
          size={36}
          color={COLORS.cyan}
        />
      </View>

      <Text style={styles.stateTitle}>
        {hasFilters ? "No matching papers" : "No papers available"}
      </Text>

      <Text style={styles.stateDescription}>
        {hasFilters
          ? "Try another year or clear your search."
          : "Previous-year papers will appear here once they are added."}
      </Text>

      {hasFilters ? (
        <Pressable
          accessibilityRole="button"
          onPress={onClear}
          style={({ pressed }) => [
            styles.clearFiltersButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="close-circle-outline" size={18} color={COLORS.cyan} />

          <Text style={styles.clearFiltersButtonText}>Clear Filters</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function SummaryCard({
  icon,
  value,
  label,
  color,
  backgroundColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  color: string;
  backgroundColor: string;
}) {
  return (
    <View style={styles.summaryCard}>
      <View style={[styles.summaryIcon, { backgroundColor }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>

      <Text style={styles.summaryValue}>{value}</Text>

      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function YearFilterButton({
  year,
  active,
  count,
  onPress,
}: {
  year: SelectedYear;
  active: boolean;
  count: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{
        selected: active,
      }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.yearFilterButton,
        active && styles.yearFilterButtonActive,
        pressed && styles.pressed,
      ]}
    >
      {year !== "All" ? (
        <Ionicons
          name="calendar-outline"
          size={14}
          color={active ? COLORS.white : COLORS.muted}
        />
      ) : (
        <Ionicons
          name="apps-outline"
          size={14}
          color={active ? COLORS.white : COLORS.muted}
        />
      )}

      <Text
        style={[styles.yearFilterText, active && styles.yearFilterTextActive]}
      >
        {year}
      </Text>

      <View
        style={[styles.yearFilterCount, active && styles.yearFilterCountActive]}
      >
        <Text
          style={[
            styles.yearFilterCountText,
            active && styles.yearFilterCountTextActive,
          ]}
        >
          {count}
        </Text>
      </View>
    </Pressable>
  );
}

function YearHeader({
  year,
  count,
  latestYear,
}: {
  year: number;
  count: number;
  latestYear: number | null;
}) {
  const isLatest = year === latestYear;

  return (
    <View style={styles.yearHeader}>
      <View style={styles.yearHeading}>
        <View style={styles.yearBadge}>
          <Ionicons
            name="calendar-outline"
            size={15}
            color={COLORS.cyanStrong}
          />

          <Text style={styles.yearText}>{year}</Text>
        </View>

        {isLatest ? (
          <View style={styles.latestBadge}>
            <View style={styles.latestDot} />

            <Text style={styles.latestBadgeText}>LATEST</Text>
          </View>
        ) : null}
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
  latestYear,
  onPress,
}: {
  paper: PYQPaper;
  compact: boolean;
  latestYear: number | null;
  onPress: () => void;
}) {
  const isLatest = paper.year === latestYear;

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
        colors={["rgba(76,195,255,0.18)", "rgba(124,58,237,0.11)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.paperIcon}
      >
        <Ionicons name="document-text-outline" size={25} color={COLORS.cyan} />
      </LinearGradient>

      <View style={styles.paperContent}>
        <View style={styles.paperTitleRow}>
          <Text style={styles.paperTitle} numberOfLines={2}>
            {getPaperTitle(paper)}
          </Text>

          {isLatest ? (
            <View style={styles.smallLatestBadge}>
              <Text style={styles.smallLatestBadgeText}>NEW</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.paperMetaRow}>
          <View style={styles.metaItem}>
            <Ionicons
              name="help-circle-outline"
              size={14}
              color={COLORS.muted}
            />

            <Text style={styles.metaText}>
              {formatNumber(paper.total_questions ?? 0)} questions
            </Text>
          </View>

          {paper.exam_day ? (
            <View style={styles.metaItem}>
              <Ionicons name="sunny-outline" size={14} color={COLORS.muted} />

              <Text style={styles.metaText}>Day {paper.exam_day}</Text>
            </View>
          ) : null}

          <View style={styles.metaItem}>
            <Ionicons name="timer-outline" size={14} color={COLORS.muted} />

            <Text style={styles.metaText}>Timed test</Text>
          </View>
        </View>
      </View>

      <View style={styles.startButton}>
        <Text style={styles.startButtonText}>Start</Text>

        <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
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

  const [search, setSearch] = useState("");

  const [selectedYear, setSelectedYear] = useState<SelectedYear>("All");

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
  } = useQuery<PYQPaper[]>({
    queryKey: ["pyq-papers", courseId],

    queryFn: () => getPYQPapers(courseId!),

    enabled: Boolean(courseId),

    staleTime: 5 * 60 * 1000,

    retry: 2,
  });

  const availableYears = useMemo(() => {
    return Array.from(new Set(papers.map((paper) => paper.year))).sort(
      (yearA, yearB) => yearB - yearA,
    );
  }, [papers]);

  const latestYear = availableYears[0] ?? null;

  const totalQuestions = useMemo(() => {
    return papers.reduce(
      (total, paper) => total + (paper.total_questions ?? 0),
      0,
    );
  }, [papers]);

  const yearCounts = useMemo(() => {
    const counts = new Map<number, number>();

    papers.forEach((paper) => {
      counts.set(paper.year, (counts.get(paper.year) ?? 0) + 1);
    });

    return counts;
  }, [papers]);

  const filteredPapers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return papers.filter((paper) => {
      const matchesYear = selectedYear === "All" || paper.year === selectedYear;

      if (!matchesYear) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const title = getPaperTitle(paper).toLowerCase();

      const year = String(paper.year);

      const examDay = paper.exam_day ? `day ${paper.exam_day}` : "";

      return (
        title.includes(normalizedSearch) ||
        year.includes(normalizedSearch) ||
        examDay.includes(normalizedSearch)
      );
    });
  }, [papers, search, selectedYear]);

  const groupedItems = useMemo(() => {
    return groupPapers(filteredPapers);
  }, [filteredPapers]);

  const hasFilters = search.trim().length > 0 || selectedYear !== "All";

  const clearFilters = () => {
    setSearch("");
    setSelectedYear("All");
  };

  const openPaper = (paperId: number) => {
    router.push({
      pathname: "/(app)/course/test/[type]/[id]",

      params: {
        type: "pyq",

        // Must remain the paper ID.
        id: String(paperId),
      },
    });
  };

  if (!courseId) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <StatusBar style="light" backgroundColor={COLORS.background} />

        <ErrorState
          message="The course ID is missing. Return to your course dashboard and try again."
          onRetry={() => router.back()}
          onBack={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar style="light" backgroundColor={COLORS.background} />

      <View style={styles.glowTop} />
      <View style={styles.glowCenter} />
      <View style={styles.glowBottom} />

      <View
        style={[
          styles.screen,
          {
            paddingHorizontal: horizontalPadding,

            maxWidth: isTablet ? 880 : undefined,
          },
        ]}
      >
        {/* Navigation */}
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

            <Text style={styles.headerSubtitle}>MAH AAC CET practice</Text>
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

        {isLoading ? (
          <LoadingState compact={isCompact} />
        ) : isError ? (
          <ErrorState
            message={
              error instanceof Error
                ? error.message
                : "Network error while loading papers."
            }
            onRetry={() => void refetch()}
            onBack={() => router.back()}
          />
        ) : (
          <FlatList
            data={groupedItems}
            keyExtractor={(item) => item.key}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={() => void refetch()}
                tintColor={COLORS.cyan}
                colors={[COLORS.cyan]}
                progressBackgroundColor={COLORS.card}
              />
            }
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <>
                {/* Hero */}
                <LinearGradient
                  colors={["#172554", "#312E81", "#581C87"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.heroCard, isCompact && styles.heroCardCompact]}
                >
                  <View style={styles.heroDecorationOne} />

                  <View style={styles.heroDecorationTwo} />

                  <View style={styles.heroTopRow}>
                    <View style={styles.heroIcon}>
                      <Ionicons
                        name="library-outline"
                        size={28}
                        color={COLORS.white}
                      />
                    </View>

                    <View style={styles.practiceBadge}>
                      <View style={styles.practiceDot} />

                      <Text style={styles.practiceBadgeText}>
                        EXAM PRACTICE
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.heroTitle}>
                    Practice with real previous-year papers
                  </Text>

                  <Text style={styles.heroText}>
                    Select a paper, answer questions in the timed test interface
                    and prepare with real exam patterns.
                  </Text>

                  <View style={styles.summaryRow}>
                    <SummaryCard
                      icon="documents-outline"
                      value={String(papers.length)}
                      label={papers.length === 1 ? "Paper" : "Papers"}
                      color={COLORS.cyan}
                      backgroundColor="rgba(76,195,255,0.12)"
                    />

                    <SummaryCard
                      icon="calendar-outline"
                      value={String(availableYears.length)}
                      label={availableYears.length === 1 ? "Year" : "Years"}
                      color={COLORS.violet}
                      backgroundColor="rgba(167,139,250,0.12)"
                    />

                    <SummaryCard
                      icon="help-circle-outline"
                      value={formatNumber(totalQuestions)}
                      label="Questions"
                      color={COLORS.yellow}
                      backgroundColor="rgba(250,204,21,0.12)"
                    />
                  </View>
                </LinearGradient>

                {/* Search */}
                <View style={styles.searchContainer}>
                  <Ionicons
                    name="search-outline"
                    size={19}
                    color={COLORS.mutedDark}
                  />

                  <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search by year or exam day..."
                    placeholderTextColor={COLORS.mutedDark}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="search"
                    style={styles.searchInput}
                  />

                  {search.length > 0 ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Clear search"
                      hitSlop={8}
                      onPress={() => setSearch("")}
                      style={({ pressed }) => [
                        styles.clearSearchButton,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Ionicons name="close" size={19} color={COLORS.muted} />
                    </Pressable>
                  ) : null}
                </View>

                {/* Year filters */}
                <View style={styles.filtersContainer}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={styles.filtersContent}
                  >
                    <YearFilterButton
                      year="All"
                      active={selectedYear === "All"}
                      count={papers.length}
                      onPress={() => setSelectedYear("All")}
                    />

                    {availableYears.map((year) => (
                      <YearFilterButton
                        key={year}
                        year={year}
                        active={selectedYear === year}
                        count={yearCounts.get(year) ?? 0}
                        onPress={() => setSelectedYear(year)}
                      />
                    ))}
                  </ScrollView>
                </View>

                {/* Content heading */}
                <View style={styles.contentHeading}>
                  <View>
                    <Text style={styles.contentEyebrow}>AVAILABLE PAPERS</Text>

                    <Text style={styles.contentTitle}>Choose a paper</Text>

                    <Text style={styles.contentSubtitle}>
                      {filteredPapers.length}{" "}
                      {filteredPapers.length === 1 ? "paper" : "papers"} found
                    </Text>
                  </View>

                  {hasFilters ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={clearFilters}
                      style={({ pressed }) => [
                        styles.clearHeaderButton,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Ionicons
                        name="close-outline"
                        size={16}
                        color={COLORS.cyan}
                      />

                      <Text style={styles.clearHeaderText}>Clear</Text>
                    </Pressable>
                  ) : (
                    <View style={styles.resultCountBadge}>
                      <Ionicons
                        name="list-outline"
                        size={15}
                        color={COLORS.cyan}
                      />

                      <Text style={styles.resultCountText}>
                        {filteredPapers.length}
                      </Text>
                    </View>
                  )}
                </View>
              </>
            }
            ListEmptyComponent={
              <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
            }
            renderItem={({ item }) => {
              if (item.type === "year") {
                return (
                  <YearHeader
                    year={item.year}
                    count={item.count}
                    latestYear={latestYear}
                  />
                );
              }

              return (
                <PaperCard
                  paper={item.paper}
                  compact={isCompact}
                  latestYear={latestYear}
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
    top: -130,
    right: -120,
    width: 330,
    height: 330,
    borderRadius: 330,
    backgroundColor: "rgba(51,214,255,0.09)",
  },

  glowCenter: {
    position: "absolute",
    top: 380,
    left: -130,
    width: 300,
    height: 300,
    borderRadius: 300,
    backgroundColor: "rgba(255,90,165,0.07)",
  },

  glowBottom: {
    position: "absolute",
    bottom: -160,
    right: -140,
    width: 350,
    height: 350,
    borderRadius: 350,
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
    fontSize: 10,
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

  listContent: {
    paddingBottom: 40,
  },

  heroCard: {
    borderRadius: 27,
    padding: 21,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(76,195,255,0.14)",
    marginTop: 5,
    marginBottom: 20,
  },

  heroCardCompact: {
    padding: 17,
    borderRadius: 22,
  },

  heroDecorationOne: {
    position: "absolute",
    top: -60,
    right: -45,
    width: 170,
    height: 170,
    borderRadius: 170,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  heroDecorationTwo: {
    position: "absolute",
    bottom: -85,
    left: -55,
    width: 190,
    height: 190,
    borderRadius: 190,
    backgroundColor: "rgba(51,214,255,0.05)",
  },

  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 17,
  },

  heroIcon: {
    width: 55,
    height: 55,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(76,195,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(76,195,255,0.25)",
  },

  practiceBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(34,197,94,0.10)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.22)",
  },

  practiceDot: {
    width: 7,
    height: 7,
    borderRadius: 7,
    marginRight: 7,
    backgroundColor: COLORS.green,
  },

  practiceBadgeText: {
    color: "#BBF7D0",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.7,
  },

  heroTitle: {
    maxWidth: 510,
    color: COLORS.white,
    fontSize: 27,
    lineHeight: 35,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  heroText: {
    maxWidth: 560,
    color: "#C7D2FE",
    fontSize: 13,
    lineHeight: 21,
    marginTop: 10,
  },

  summaryRow: {
    flexDirection: "row",
    gap: 9,
    marginTop: 21,
  },

  summaryCard: {
    flex: 1,
    minHeight: 104,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    borderRadius: 17,
    backgroundColor: "rgba(5,10,28,0.38)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  summaryIcon: {
    width: 35,
    height: 35,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 7,
  },

  summaryValue: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "900",
  },

  summaryLabel: {
    color: "#AAB2CC",
    fontSize: 9,
    fontWeight: "700",
    marginTop: 4,
    textAlign: "center",
  },

  searchContainer: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "rgba(15,23,53,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  searchInput: {
    flex: 1,
    height: 50,
    color: COLORS.text,
    fontSize: 13,
    paddingVertical: 0,
  },

  clearSearchButton: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  filtersContainer: {
    marginHorizontal: -2,
    marginTop: 13,
  },

  filtersContent: {
    gap: 8,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },

  yearFilterButton: {
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  yearFilterButtonActive: {
    backgroundColor: "#2563EB",
    borderColor: "rgba(96,165,250,0.45)",
  },

  yearFilterText: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "800",
  },

  yearFilterTextActive: {
    color: COLORS.white,
  },

  yearFilterCount: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  yearFilterCountActive: {
    backgroundColor: "rgba(255,255,255,0.17)",
  },

  yearFilterCountText: {
    color: COLORS.mutedDark,
    fontSize: 9,
    fontWeight: "900",
  },

  yearFilterCountTextActive: {
    color: COLORS.white,
  },

  contentHeading: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 28,
    marginBottom: 8,
  },

  contentEyebrow: {
    color: COLORS.cyan,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },

  contentTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 5,
  },

  contentSubtitle: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 4,
  },

  resultCountBadge: {
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(76,195,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(76,195,255,0.18)",
  },

  resultCountText: {
    color: COLORS.cyan,
    fontSize: 11,
    fontWeight: "900",
  },

  clearHeaderButton: {
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(76,195,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(76,195,255,0.16)",
  },

  clearHeaderText: {
    color: COLORS.cyan,
    fontSize: 10,
    fontWeight: "900",
  },

  yearHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingTop: 19,
    paddingBottom: 10,
    paddingHorizontal: 2,
  },

  yearHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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

  latestBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(34,197,94,0.09)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.20)",
  },

  latestDot: {
    width: 5,
    height: 5,
    borderRadius: 5,
    marginRight: 4,
    backgroundColor: COLORS.green,
  },

  latestBadgeText: {
    color: "#86EFAC",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  yearDivider: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  yearCount: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "700",
  },

  paperCard: {
    minHeight: 96,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    padding: 14,
    borderRadius: 19,
    marginBottom: 11,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  paperCardCompact: {
    minHeight: 88,
    padding: 11,
    gap: 10,
    borderRadius: 16,
  },

  paperCardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.995 }],
    borderColor: COLORS.borderStrong,
  },

  paperIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  paperContent: {
    flex: 1,
    minWidth: 0,
  },

  paperTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
  },

  paperTitle: {
    flex: 1,
    color: COLORS.white,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "900",
  },

  smallLatestBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "rgba(34,197,94,0.10)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.18)",
  },

  smallLatestBadgeText: {
    color: "#86EFAC",
    fontSize: 7,
    fontWeight: "900",
  },

  paperMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },

  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  metaText: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "600",
  },

  startButton: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.30)",
  },

  startButtonText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "900",
  },

  loadingList: {
    flex: 1,
    paddingTop: 14,
  },

  loadingHeader: {
    minHeight: 55,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },

  loadingText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "600",
  },

  skeletonCard: {
    minHeight: 96,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    padding: 14,
    borderRadius: 19,
    marginBottom: 11,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  skeletonCardCompact: {
    minHeight: 88,
    padding: 11,
    gap: 10,
    borderRadius: 16,
  },

  skeletonIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  skeletonContent: {
    flex: 1,
  },

  skeletonTitle: {
    width: "75%",
    height: 15,
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  skeletonMeta: {
    flexDirection: "row",
    gap: 8,
    marginTop: 11,
  },

  skeletonMetaItem: {
    width: 95,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  skeletonMetaItemSmall: {
    width: 55,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  skeletonButton: {
    width: 64,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.07)",
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
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,107,154,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,107,154,0.18)",
  },

  emptyIcon: {
    width: 74,
    height: 74,
    borderRadius: 25,
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
    maxWidth: 390,
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 20,
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
    fontSize: 13,
    fontWeight: "900",
  },

  secondaryButton: {
    minHeight: 42,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },

  secondaryButtonText: {
    color: COLORS.cyan,
    fontSize: 13,
    fontWeight: "800",
  },

  clearFiltersButton: {
    minHeight: 44,
    paddingHorizontal: 17,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 20,
    backgroundColor: "rgba(76,195,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(76,195,255,0.17)",
  },

  clearFiltersButtonText: {
    color: COLORS.cyan,
    fontSize: 12,
    fontWeight: "900",
  },

  pressed: {
    opacity: 0.76,
  },

  disabled: {
    opacity: 0.5,
  },
});
