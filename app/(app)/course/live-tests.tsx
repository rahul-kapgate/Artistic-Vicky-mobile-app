import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getPublicLiveTests } from "@/services/liveTest.service";
import type { PublicLiveTest } from "@/types/live-test";

const COLORS = {
  background: "#050A1C",
  card: "#0F1735",
  white: "#FFFFFF",
  text: "#D8E0F5",
  muted: "#8E99B7",
  mutedDark: "#66728D",
  cyan: "#4CC3FF",
  cyanStrong: "#33D6FF",
  violet: "#A78BFA",
  green: "#34D399",
  amber: "#FBBF24",
  red: "#F87171",
  border: "rgba(255,255,255,0.08)",
  borderStrong: "rgba(255,255,255,0.14)",
};

type LiveState = "upcoming" | "live" | "ended";
type LiveFilter = "all" | LiveState;

const FILTERS: Array<{
  key: LiveFilter;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { key: "all", label: "All", icon: "apps-outline" },
  { key: "live", label: "Live", icon: "radio-outline" },
  { key: "upcoming", label: "Upcoming", icon: "calendar-outline" },
  { key: "ended", label: "Ended", icon: "checkmark-done-outline" },
];

function getTimestamp(value?: string | null): number | null {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function getLiveState(test: PublicLiveTest, now: number): LiveState {
  const start = getTimestamp(test.start_at);
  const end = getTimestamp(test.end_at);

  if (end !== null && now >= end) return "ended";
  if (start !== null && now < start) return "upcoming";
  return "live";
}

function formatDateTime(value?: string | null): string {
  const timestamp = getTimestamp(value);

  if (timestamp === null) return "Not specified";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function formatDuration(minutes?: number | null): string {
  if (!minutes || minutes <= 0) return "Duration unavailable";
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function formatRemainingTime(milliseconds: number): string {
  if (milliseconds <= 0) return "Now";

  const totalMinutes = Math.floor(milliseconds / 60_000);
  const days = Math.floor(totalMinutes / 1_440);
  const hours = Math.floor((totalMinutes % 1_440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;

  return `${Math.max(minutes, 1)}m`;
}

function getCountdownText(
  test: PublicLiveTest,
  state: LiveState,
  now: number,
): string {
  if (state === "upcoming") {
    const start = getTimestamp(test.start_at);
    return start === null
      ? "Schedule pending"
      : `Starts in ${formatRemainingTime(start - now)}`;
  }

  if (state === "live") {
    const end = getTimestamp(test.end_at);
    return end === null
      ? "Live now"
      : `Ends in ${formatRemainingTime(end - now)}`;
  }

  return "Test window closed";
}

function getStateLabel(state: LiveState): string {
  if (state === "live") return "LIVE NOW";
  if (state === "upcoming") return "UPCOMING";
  return "ENDED";
}

function getStateColor(state: LiveState): string {
  if (state === "live") return COLORS.green;
  if (state === "upcoming") return COLORS.amber;
  return COLORS.red;
}

function getStateIcon(state: LiveState): keyof typeof Ionicons.glyphMap {
  if (state === "live") return "radio-outline";
  if (state === "upcoming") return "calendar-outline";
  return "checkmark-done-outline";
}

function getActionLabel(state: LiveState): string {
  if (state === "live") return "Open Live Test";
  if (state === "upcoming") return "View Schedule";
  return "View Details";
}

function SummaryCard({
  icon,
  value,
  label,
  color,
  backgroundColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
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

function FilterButton({
  filter,
  active,
  count,
  onPress,
}: {
  filter: (typeof FILTERS)[number];
  active: boolean;
  count: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterButton,
        active && styles.filterButtonActive,
        pressed && styles.pressed,
      ]}
    >
      <Ionicons
        name={filter.icon}
        size={15}
        color={active ? COLORS.white : COLORS.muted}
      />

      <Text
        style={[
          styles.filterButtonText,
          active && styles.filterButtonTextActive,
        ]}
      >
        {filter.label}
      </Text>

      <View style={[styles.filterCount, active && styles.filterCountActive]}>
        <Text
          style={[
            styles.filterCountText,
            active && styles.filterCountTextActive,
          ]}
        >
          {count}
        </Text>
      </View>
    </Pressable>
  );
}

function LoadingCard() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonTopRow}>
        <View style={styles.skeletonIcon} />
        <View style={styles.skeletonBadge} />
      </View>

      <View style={styles.skeletonTitle} />
      <View style={styles.skeletonDescription} />
      <View style={styles.skeletonDescriptionShort} />

      <View style={styles.skeletonMetaRow}>
        <View style={styles.skeletonMeta} />
        <View style={styles.skeletonMetaSmall} />
      </View>

      <View style={styles.skeletonSchedule} />
      <View style={styles.skeletonButton} />
    </View>
  );
}

function LoadingState({ isTablet }: { isTablet: boolean }) {
  const count = isTablet ? 4 : 3;

  return (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingHeader}>
        <ActivityIndicator size="small" color={COLORS.cyan} />
        <Text style={styles.loadingText}>Loading available live tests...</Text>
      </View>

      <View style={isTablet ? styles.loadingGrid : undefined}>
        {Array.from({ length: count }).map((_, index) => (
          <View
            key={index}
            style={isTablet ? styles.loadingGridItem : undefined}
          >
            <LoadingCard />
          </View>
        ))}
      </View>
    </View>
  );
}

function EmptyState({
  filter,
  onClear,
}: {
  filter: LiveFilter;
  onClear: () => void;
}) {
  const filtered = filter !== "all";

  return (
    <View style={styles.centerState}>
      <View style={styles.emptyIcon}>
        <Ionicons
          name={filtered ? "filter-outline" : "calendar-outline"}
          size={38}
          color={COLORS.cyan}
        />
      </View>

      <Text style={styles.stateTitle}>
        {filtered ? `No ${filter} tests` : "No live tests available"}
      </Text>

      <Text style={styles.stateDescription}>
        {filtered
          ? "Choose another filter to view the available test sessions."
          : "Published live tests will appear here once they are scheduled."}
      </Text>

      {filtered ? (
        <Pressable
          accessibilityRole="button"
          onPress={onClear}
          style={({ pressed }) => [
            styles.secondaryAction,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="close-circle-outline" size={18} color={COLORS.cyan} />

          <Text style={styles.secondaryActionText}>Show All Tests</Text>
        </Pressable>
      ) : null}
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
        <Ionicons name="warning-outline" size={38} color={COLORS.red} />
      </View>

      <Text style={styles.stateTitle}>Unable to load live tests</Text>

      <Text style={styles.stateDescription}>{message}</Text>

      <Pressable
        accessibilityRole="button"
        onPress={onRetry}
        style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
      >
        <Ionicons name="refresh-outline" size={18} color={COLORS.background} />

        <Text style={styles.retryText}>Try Again</Text>
      </Pressable>
    </View>
  );
}

function LiveTestCard({
  test,
  now,
  compact,
}: {
  test: PublicLiveTest;
  now: number;
  compact: boolean;
}) {
  const state = getLiveState(test, now);
  const stateColor = getStateColor(state);
  const stateIcon = getStateIcon(state);
  const actionLabel = getActionLabel(state);
  const countdown = getCountdownText(test, state, now);

  const openTest = () => {
    router.push({
      pathname: "/(app)/course/live-test/[id]",
      params: { id: String(test.id) },
    });
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${actionLabel}: ${test.title}`}
      onPress={openTest}
      style={({ pressed }) => [
        styles.testCard,
        compact && styles.testCardCompact,
        state === "live" && styles.liveTestCard,
        pressed && styles.testCardPressed,
      ]}
    >
      <LinearGradient
        colors={[`${stateColor}28`, "rgba(15,23,53,0)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGlow}
      />

      <View style={styles.cardTopRow}>
        <View
          style={[
            styles.cardIcon,
            {
              backgroundColor: `${stateColor}16`,
              borderColor: `${stateColor}30`,
            },
          ]}
        >
          <Ionicons name={stateIcon} size={24} color={stateColor} />
        </View>

        <View
          style={[
            styles.statusBadge,
            {
              borderColor: `${stateColor}50`,
              backgroundColor: `${stateColor}16`,
            },
          ]}
        >
          <View style={[styles.statusDot, { backgroundColor: stateColor }]} />

          <Text style={[styles.statusText, { color: stateColor }]}>
            {getStateLabel(state)}
          </Text>
        </View>
      </View>

      <Text style={styles.cardTitle} numberOfLines={2}>
        {test.title}
      </Text>

      <Text style={styles.cardDescription} numberOfLines={3}>
        {test.description?.trim() ||
          "Open the test to review its schedule, instructions and availability."}
      </Text>

      <View style={styles.countdownBox}>
        <Ionicons
          name={
            state === "live"
              ? "timer-outline"
              : state === "upcoming"
                ? "alarm-outline"
                : "time-outline"
          }
          size={17}
          color={stateColor}
        />

        <Text style={[styles.countdownText, { color: stateColor }]}>
          {countdown}
        </Text>
      </View>

      <View style={styles.metaGrid}>
        <View style={styles.metaItem}>
          <View style={styles.metaIcon}>
            <Ionicons name="time-outline" size={15} color={COLORS.cyan} />
          </View>

          <View>
            <Text style={styles.metaValue}>
              {formatDuration(test.duration_minutes)}
            </Text>
            <Text style={styles.metaLabel}>Duration</Text>
          </View>
        </View>

        <View style={styles.metaItem}>
          <View style={styles.metaIcon}>
            <Ionicons
              name="help-circle-outline"
              size={15}
              color={COLORS.violet}
            />
          </View>

          <View>
            <Text style={styles.metaValue}>{test.total_questions ?? 0}</Text>
            <Text style={styles.metaLabel}>Questions</Text>
          </View>
        </View>
      </View>

      <View style={styles.scheduleBox}>
        <View style={styles.scheduleRow}>
          <View style={styles.scheduleLabelRow}>
            <Ionicons name="play-outline" size={14} color={COLORS.green} />
            <Text style={styles.scheduleLabel}>Starts</Text>
          </View>

          <Text style={styles.scheduleValue} numberOfLines={1}>
            {formatDateTime(test.start_at)}
          </Text>
        </View>

        <View style={styles.scheduleDivider} />

        <View style={styles.scheduleRow}>
          <View style={styles.scheduleLabelRow}>
            <Ionicons name="stop-outline" size={14} color={COLORS.red} />
            <Text style={styles.scheduleLabel}>Ends</Text>
          </View>

          <Text style={styles.scheduleValue} numberOfLines={1}>
            {formatDateTime(test.end_at)}
          </Text>
        </View>
      </View>

      <View
        style={[styles.openButton, state === "live" && styles.openButtonLive]}
      >
        <Text
          style={[styles.openText, state === "live" && styles.openTextLive]}
        >
          {actionLabel}
        </Text>

        <View
          style={[styles.openIcon, state === "live" && styles.openIconLive]}
        >
          <Ionicons
            name="arrow-forward"
            size={17}
            color={state === "live" ? COLORS.background : COLORS.cyanStrong}
          />
        </View>
      </View>
    </Pressable>
  );
}

export default function LiveTestsScreen() {
  const { width, height } = useWindowDimensions();

  const [now, setNow] = useState(() => Date.now());
  const [selectedFilter, setSelectedFilter] = useState<LiveFilter>("all");

  const isTablet = width >= 768;
  const isCompact = width < 360 || height < 700;

  const horizontalPadding = isTablet ? 28 : isCompact ? 14 : 18;

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 30_000);

    return () => clearInterval(timer);
  }, []);

  const {
    data: tests = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery<PublicLiveTest[]>({
    queryKey: ["public-live-tests"],
    queryFn: getPublicLiveTests,
    staleTime: 30_000,
    retry: 2,
  });

  const stateCounts = useMemo(() => {
    const counts: Record<LiveFilter, number> = {
      all: tests.length,
      live: 0,
      upcoming: 0,
      ended: 0,
    };

    tests.forEach((test) => {
      counts[getLiveState(test, now)] += 1;
    });

    return counts;
  }, [now, tests]);

  const sortedTests = useMemo(() => {
    const priority: Record<LiveState, number> = {
      live: 0,
      upcoming: 1,
      ended: 2,
    };

    return [...tests].sort((first, second) => {
      const firstState = getLiveState(first, now);
      const secondState = getLiveState(second, now);

      if (priority[firstState] !== priority[secondState]) {
        return priority[firstState] - priority[secondState];
      }

      const firstStart = getTimestamp(first.start_at) ?? 0;
      const secondStart = getTimestamp(second.start_at) ?? 0;

      return firstState === "upcoming"
        ? firstStart - secondStart
        : secondStart - firstStart;
    });
  }, [now, tests]);

  const filteredTests = useMemo(() => {
    if (selectedFilter === "all") return sortedTests;

    return sortedTests.filter(
      (test) => getLiveState(test, now) === selectedFilter,
    );
  }, [now, selectedFilter, sortedTests]);

  const nextUpcomingTest = useMemo(() => {
    return sortedTests.find((test) => getLiveState(test, now) === "upcoming");
  }, [now, sortedTests]);

  const activeSummary =
    stateCounts.live > 0
      ? `${stateCounts.live} test${stateCounts.live === 1 ? "" : "s"} live now`
      : nextUpcomingTest
        ? getCountdownText(nextUpcomingTest, "upcoming", now)
        : "No active test window";

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
            maxWidth: isTablet ? 920 : undefined,
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
            <Text style={styles.headerTitle}>Live Tests</Text>
            <Text style={styles.headerSubtitle}>
              Scheduled exams and active sessions
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Refresh live tests"
            onPress={() => void refetch()}
            disabled={isRefetching}
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
          <LoadingState isTablet={isTablet} />
        ) : isError ? (
          <ErrorState
            message={
              error instanceof Error
                ? error.message
                : "A network error occurred while loading live tests."
            }
            onRetry={() => void refetch()}
          />
        ) : (
          <FlatList
            key={isTablet ? "tablet-live-tests" : "phone-live-tests"}
            data={filteredTests}
            numColumns={isTablet ? 2 : 1}
            keyExtractor={(item) => String(item.id)}
            showsVerticalScrollIndicator={false}
            columnWrapperStyle={isTablet ? styles.columnWrapper : undefined}
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
            ListHeaderComponent={
              <>
                <LinearGradient
                  colors={["#172554", "#312E81", "#581C87"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.hero, isCompact && styles.heroCompact]}
                >
                  <View style={styles.heroDecorationOne} />
                  <View style={styles.heroDecorationTwo} />

                  <View style={styles.heroTopRow}>
                    <View style={styles.heroIcon}>
                      <Ionicons
                        name="radio-outline"
                        size={29}
                        color={COLORS.white}
                      />
                    </View>

                    <View style={styles.secureBadge}>
                      <Ionicons
                        name="shield-checkmark-outline"
                        size={14}
                        color="#86EFAC"
                      />
                      <Text style={styles.secureBadgeText}>SERVER TIMED</Text>
                    </View>
                  </View>

                  <Text style={styles.heroTitle}>Timed live examination</Text>

                  <Text style={styles.heroText}>
                    Join only during the allowed test window. The server
                    controls timing, availability and final submission.
                  </Text>

                  <View style={styles.activeSummary}>
                    <View
                      style={[
                        styles.activeSummaryDot,
                        {
                          backgroundColor:
                            stateCounts.live > 0 ? COLORS.green : COLORS.amber,
                        },
                      ]}
                    />
                    <Text style={styles.activeSummaryText}>
                      {activeSummary}
                    </Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <SummaryCard
                      icon="radio-outline"
                      value={stateCounts.live}
                      label="Live"
                      color={COLORS.green}
                      backgroundColor="rgba(52,211,153,0.12)"
                    />
                    <SummaryCard
                      icon="calendar-outline"
                      value={stateCounts.upcoming}
                      label="Upcoming"
                      color={COLORS.amber}
                      backgroundColor="rgba(251,191,36,0.12)"
                    />
                    <SummaryCard
                      icon="checkmark-done-outline"
                      value={stateCounts.ended}
                      label="Ended"
                      color={COLORS.red}
                      backgroundColor="rgba(248,113,113,0.12)"
                    />
                  </View>
                </LinearGradient>

                <View style={styles.filterSection}>
                  <View>
                    <Text style={styles.sectionEyebrow}>TEST SESSIONS</Text>
                    <Text style={styles.sectionTitle}>Available tests</Text>
                    <Text style={styles.sectionSubtitle}>
                      {filteredTests.length}{" "}
                      {filteredTests.length === 1 ? "test" : "tests"} shown
                    </Text>
                  </View>

                  {selectedFilter !== "all" ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setSelectedFilter("all")}
                      style={({ pressed }) => [
                        styles.clearFilterButton,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Ionicons
                        name="close-outline"
                        size={16}
                        color={COLORS.cyan}
                      />
                      <Text style={styles.clearFilterText}>Clear</Text>
                    </Pressable>
                  ) : null}
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filtersContent}
                >
                  {FILTERS.map((filter) => (
                    <FilterButton
                      key={filter.key}
                      filter={filter}
                      active={selectedFilter === filter.key}
                      count={stateCounts[filter.key]}
                      onPress={() => setSelectedFilter(filter.key)}
                    />
                  ))}
                </ScrollView>
              </>
            }
            ListEmptyComponent={
              <EmptyState
                filter={selectedFilter}
                onClear={() => setSelectedFilter("all")}
              />
            }
            renderItem={({ item }) => (
              <View
                style={[
                  styles.cardWrapper,
                  isTablet && styles.cardWrapperTablet,
                ]}
              >
                <LiveTestCard test={item} now={now} compact={isCompact} />
              </View>
            )}
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
    top: 390,
    left: -140,
    width: 320,
    height: 320,
    borderRadius: 320,
    backgroundColor: "rgba(255,90,165,0.07)",
  },
  glowBottom: {
    position: "absolute",
    left: -130,
    bottom: -160,
    width: 350,
    height: 350,
    borderRadius: 350,
    backgroundColor: "rgba(124,58,237,0.12)",
  },
  header: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
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
  columnWrapper: {
    gap: 14,
  },
  hero: {
    overflow: "hidden",
    borderRadius: 27,
    padding: 21,
    marginTop: 5,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "rgba(76,195,255,0.14)",
  },
  heroCompact: {
    padding: 17,
    borderRadius: 22,
  },
  heroDecorationOne: {
    position: "absolute",
    top: -65,
    right: -45,
    width: 180,
    height: 180,
    borderRadius: 180,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  heroDecorationTwo: {
    position: "absolute",
    bottom: -90,
    left: -55,
    width: 200,
    height: 200,
    borderRadius: 200,
    backgroundColor: "rgba(51,214,255,0.05)",
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(76,195,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(76,195,255,0.25)",
  },
  secureBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(34,197,94,0.1)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.22)",
  },
  secureBadgeText: {
    color: "#BBF7D0",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.7,
    marginLeft: 6,
  },
  heroTitle: {
    color: COLORS.white,
    fontSize: 28,
    lineHeight: 35,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  heroText: {
    maxWidth: 580,
    color: "#C7D2FE",
    fontSize: 13,
    lineHeight: 21,
    marginTop: 10,
  },
  activeSummary: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 999,
    marginTop: 17,
    backgroundColor: "rgba(5,10,28,0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  activeSummaryDot: {
    width: 7,
    height: 7,
    borderRadius: 7,
    marginRight: 7,
  },
  activeSummaryText: {
    color: "#E7ECFA",
    fontSize: 10,
    fontWeight: "800",
  },
  summaryRow: {
    flexDirection: "row",
    gap: 9,
    marginTop: 20,
  },
  summaryCard: {
    flex: 1,
    minHeight: 102,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    paddingHorizontal: 7,
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
    fontSize: 18,
    fontWeight: "900",
  },
  summaryLabel: {
    color: "#AAB2CC",
    fontSize: 9,
    fontWeight: "700",
    marginTop: 4,
  },
  filterSection: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 13,
  },
  sectionEyebrow: {
    color: COLORS.cyan,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 5,
  },
  sectionSubtitle: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 4,
  },
  clearFilterButton: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    borderRadius: 11,
    backgroundColor: "rgba(76,195,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(76,195,255,0.16)",
  },
  clearFilterText: {
    color: COLORS.cyan,
    fontSize: 10,
    fontWeight: "900",
    marginLeft: 3,
  },
  filtersContent: {
    gap: 8,
    paddingBottom: 18,
  },
  filterButton: {
    minHeight: 39,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterButtonActive: {
    backgroundColor: "#2563EB",
    borderColor: "rgba(96,165,250,0.42)",
  },
  filterButtonText: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "800",
    marginLeft: 6,
  },
  filterButtonTextActive: {
    color: COLORS.white,
  },
  filterCount: {
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    borderRadius: 7,
    marginLeft: 7,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  filterCountActive: {
    backgroundColor: "rgba(255,255,255,0.17)",
  },
  filterCountText: {
    color: COLORS.mutedDark,
    fontSize: 9,
    fontWeight: "900",
  },
  filterCountTextActive: {
    color: COLORS.white,
  },
  cardWrapper: {
    flex: 1,
  },
  cardWrapperTablet: {
    maxWidth: "50%",
  },
  testCard: {
    position: "relative",
    overflow: "hidden",
    padding: 17,
    borderRadius: 21,
    marginBottom: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  testCardCompact: {
    padding: 14,
    borderRadius: 18,
  },
  liveTestCard: {
    borderColor: "rgba(52,211,153,0.24)",
  },
  testCardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.995 }],
    borderColor: COLORS.borderStrong,
  },
  cardGlow: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 180,
    height: 180,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardIcon: {
    width: 49,
    height: 49,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 7,
    marginRight: 6,
  },
  statusText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.55,
  },
  cardTitle: {
    color: COLORS.white,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "900",
    marginTop: 15,
  },
  cardDescription: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 7,
  },
  countdownBox: {
    alignSelf: "flex-start",
    minHeight: 35,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    borderRadius: 11,
    marginTop: 14,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  countdownText: {
    fontSize: 10,
    fontWeight: "900",
    marginLeft: 6,
  },
  metaGrid: {
    flexDirection: "row",
    gap: 10,
    marginTop: 15,
  },
  metaItem: {
    flex: 1,
    minHeight: 59,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  metaIcon: {
    width: 33,
    height: 33,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
    backgroundColor: "rgba(76,195,255,0.07)",
  },
  metaValue: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "900",
  },
  metaLabel: {
    color: COLORS.mutedDark,
    fontSize: 9,
    marginTop: 3,
  },
  scheduleBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  scheduleLabelRow: {
    width: 72,
    flexDirection: "row",
    alignItems: "center",
  },
  scheduleLabel: {
    color: COLORS.muted,
    fontSize: 10,
    marginLeft: 5,
  },
  scheduleValue: {
    flex: 1,
    color: COLORS.text,
    fontSize: 10,
    textAlign: "right",
    fontWeight: "700",
  },
  scheduleDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
    marginVertical: 9,
  },
  openButton: {
    minHeight: 47,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 14,
    paddingRight: 7,
    borderRadius: 14,
    marginTop: 15,
    backgroundColor: "rgba(76,195,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(76,195,255,0.16)",
  },
  openButtonLive: {
    backgroundColor: COLORS.green,
    borderColor: "rgba(134,239,172,0.35)",
  },
  openText: {
    color: COLORS.cyanStrong,
    fontSize: 11,
    fontWeight: "900",
  },
  openTextLive: {
    color: COLORS.background,
  },
  openIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(76,195,255,0.1)",
  },
  openIconLive: {
    backgroundColor: "rgba(5,10,28,0.12)",
  },
  loadingContainer: {
    flex: 1,
    paddingTop: 8,
  },
  loadingHeader: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 9,
  },
  loadingGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  loadingGridItem: {
    width: "48.5%",
  },
  skeletonCard: {
    padding: 17,
    borderRadius: 21,
    marginBottom: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  skeletonTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  skeletonIcon: {
    width: 49,
    height: 49,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  skeletonBadge: {
    width: 78,
    height: 27,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  skeletonTitle: {
    width: "72%",
    height: 18,
    borderRadius: 8,
    marginTop: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  skeletonDescription: {
    width: "100%",
    height: 11,
    borderRadius: 6,
    marginTop: 12,
    backgroundColor: "rgba(255,255,255,0.055)",
  },
  skeletonDescriptionShort: {
    width: "67%",
    height: 11,
    borderRadius: 6,
    marginTop: 7,
    backgroundColor: "rgba(255,255,255,0.055)",
  },
  skeletonMetaRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 17,
  },
  skeletonMeta: {
    flex: 1,
    height: 58,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  skeletonMetaSmall: {
    flex: 1,
    height: 58,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  skeletonSchedule: {
    height: 75,
    borderRadius: 15,
    marginTop: 14,
    backgroundColor: "rgba(255,255,255,0.045)",
  },
  skeletonButton: {
    height: 47,
    borderRadius: 14,
    marginTop: 15,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  centerState: {
    flex: 1,
    minHeight: 350,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(76,195,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(76,195,255,0.16)",
  },
  errorIcon: {
    width: 76,
    height: 76,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(248,113,113,0.1)",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.2)",
  },
  stateTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 17,
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
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    borderRadius: 14,
    marginTop: 21,
    backgroundColor: COLORS.cyan,
  },
  retryText: {
    color: COLORS.background,
    fontSize: 13,
    fontWeight: "900",
    marginLeft: 7,
  },
  secondaryAction: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderRadius: 13,
    marginTop: 20,
    backgroundColor: "rgba(76,195,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(76,195,255,0.17)",
  },
  secondaryActionText: {
    color: COLORS.cyan,
    fontSize: 12,
    fontWeight: "900",
    marginLeft: 7,
  },
  pressed: {
    opacity: 0.78,
  },
  disabled: {
    opacity: 0.5,
  },
});
