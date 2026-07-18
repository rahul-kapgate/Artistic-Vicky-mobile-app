import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
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

import { getPublicLiveTests } from "@/services/liveTest.service";
import type { PublicLiveTest } from "@/types/live-test";

const COLORS = {
  background: "#050A1C",
  card: "#0F1735",
  white: "#FFFFFF",
  text: "#D8E0F5",
  muted: "#8E99B7",
  cyan: "#4CC3FF",
  cyanStrong: "#33D6FF",
  green: "#34D399",
  amber: "#FBBF24",
  red: "#F87171",
  border: "rgba(255,255,255,0.08)",
};

type LiveState = "upcoming" | "live" | "ended";

function getLiveState(test: PublicLiveTest, now: number): LiveState {
  const start = test.start_at ? new Date(test.start_at).getTime() : null;
  const end = test.end_at ? new Date(test.end_at).getTime() : null;

  if (end && now >= end) return "ended";
  if (start && now < start) return "upcoming";
  return "live";
}

function formatDateTime(value?: string | null): string {
  if (!value) return "--";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "--";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getStateLabel(state: LiveState) {
  if (state === "live") return "LIVE NOW";
  if (state === "upcoming") return "UPCOMING";
  return "ENDED";
}

function getStateColor(state: LiveState) {
  if (state === "live") return COLORS.green;
  if (state === "upcoming") return COLORS.amber;
  return COLORS.red;
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

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${test.title}`}
      onPress={() =>
        router.push({
          pathname: "/(app)/course/live-test/[id]",
          params: { id: String(test.id) },
        })
      }
      style={({ pressed }) => [
        styles.testCard,
        compact && styles.testCardCompact,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.cardTopRow}>
        <View style={styles.cardIcon}>
          <Ionicons name="radio-outline" size={24} color={COLORS.cyan} />
        </View>

        <View
          style={[
            styles.statusBadge,
            {
              borderColor: `${stateColor}55`,
              backgroundColor: `${stateColor}18`,
            },
          ]}
        >
          <View style={[styles.statusDot, { backgroundColor: stateColor }]} />
          <Text style={[styles.statusText, { color: stateColor }]}>
            {getStateLabel(state)}
          </Text>
        </View>
      </View>

      <Text style={styles.cardTitle}>{test.title}</Text>

      {test.description ? (
        <Text style={styles.cardDescription}>{test.description}</Text>
      ) : null}

      <View style={styles.metaGrid}>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={15} color={COLORS.muted} />
          <Text style={styles.metaText}>{test.duration_minutes} minutes</Text>
        </View>

        <View style={styles.metaItem}>
          <Ionicons
            name="help-circle-outline"
            size={15}
            color={COLORS.muted}
          />
          <Text style={styles.metaText}>{test.total_questions} questions</Text>
        </View>
      </View>

      <View style={styles.scheduleBox}>
        <View style={styles.scheduleRow}>
          <Text style={styles.scheduleLabel}>Starts</Text>
          <Text style={styles.scheduleValue}>
            {formatDateTime(test.start_at)}
          </Text>
        </View>

        <View style={styles.scheduleRow}>
          <Text style={styles.scheduleLabel}>Ends</Text>
          <Text style={styles.scheduleValue}>
            {formatDateTime(test.end_at)}
          </Text>
        </View>
      </View>

      <View style={styles.openRow}>
        <Text style={styles.openText}>
          {state === "live"
            ? "Open live test"
            : state === "upcoming"
              ? "View schedule"
              : "View details"}
        </Text>

        <Ionicons
          name="chevron-forward"
          size={18}
          color={COLORS.cyanStrong}
        />
      </View>
    </Pressable>
  );
}

export default function LiveTestsScreen() {
  const { width, height } = useWindowDimensions();
  const [now] = useState(() => Date.now());

  const isTablet = width >= 768;
  const isCompact = width < 360 || height < 700;
  const horizontalPadding = isTablet ? 28 : isCompact ? 14 : 18;

  const {
    data: tests = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["public-live-tests"],
    queryFn: getPublicLiveTests,
    staleTime: 30_000,
    retry: 2,
  });

  const sortedTests = useMemo(() => {
    return [...tests].sort((a, b) => {
      const aStart = a.start_at ? new Date(a.start_at).getTime() : 0;
      const bStart = b.start_at ? new Date(b.start_at).getTime() : 0;
      return bStart - aStart;
    });
  }, [tests]);

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
              Scheduled tests and active sessions
            </Text>
          </View>

          <Pressable
            onPress={() => void refetch()}
            disabled={isRefetching}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.pressed,
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
          style={styles.hero}
        >
          <View style={styles.heroIcon}>
            <Ionicons name="radio-outline" size={28} color={COLORS.white} />
          </View>

          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Timed live examination</Text>
            <Text style={styles.heroText}>
              Start only during the allowed window. The server controls the
              remaining time and submission.
            </Text>
          </View>
        </LinearGradient>

        {isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={COLORS.cyan} />
            <Text style={styles.stateTitle}>Loading live tests</Text>
          </View>
        ) : isError ? (
          <View style={styles.centerState}>
            <Ionicons name="warning-outline" size={38} color={COLORS.red} />
            <Text style={styles.stateTitle}>Unable to load live tests</Text>
            <Text style={styles.stateDescription}>
              {error instanceof Error ? error.message : "Please try again."}
            </Text>
            <Pressable
              onPress={() => void refetch()}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Try Again</Text>
            </Pressable>
          </View>
        ) : sortedTests.length === 0 ? (
          <View style={styles.centerState}>
            <Ionicons name="calendar-outline" size={40} color={COLORS.cyan} />
            <Text style={styles.stateTitle}>No live tests available</Text>
            <Text style={styles.stateDescription}>
              Published live tests will appear here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={sortedTests}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={() => void refetch()}
                tintColor={COLORS.cyan}
                colors={[COLORS.cyan]}
                progressBackgroundColor={COLORS.card}
              />
            }
            renderItem={({ item }) => (
              <LiveTestCard test={item} now={now} compact={isCompact} />
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  screen: { flex: 1, width: "100%", alignSelf: "center" },
  glowTop: {
    position: "absolute",
    top: -120,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 300,
    backgroundColor: "rgba(51,214,255,0.08)",
  },
  glowBottom: {
    position: "absolute",
    left: -130,
    bottom: -150,
    width: 340,
    height: 340,
    borderRadius: 340,
    backgroundColor: "rgba(124,58,237,0.12)",
  },
  header: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { color: COLORS.white, fontSize: 17, fontWeight: "900" },
  headerSubtitle: {
    color: COLORS.muted,
    fontSize: 11,
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
  hero: {
    borderRadius: 22,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(76,195,255,0.14)",
  },
  heroIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(76,195,255,0.16)",
  },
  heroContent: { flex: 1 },
  heroTitle: { color: COLORS.white, fontSize: 17, fontWeight: "900" },
  heroText: {
    color: "#C7D2FE",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
  listContent: { paddingBottom: 34 },
  testCard: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 13,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  testCardCompact: { padding: 13, borderRadius: 17 },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(76,195,255,0.10)",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: "900" },
  cardTitle: {
    color: COLORS.white,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "900",
    marginTop: 14,
  },
  cardDescription: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 14,
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { color: COLORS.muted, fontSize: 12, fontWeight: "600" },
  scheduleBox: {
    marginTop: 15,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    gap: 8,
  },
  scheduleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  scheduleLabel: { color: COLORS.muted, fontSize: 12 },
  scheduleValue: {
    flex: 1,
    color: COLORS.text,
    fontSize: 12,
    textAlign: "right",
    fontWeight: "700",
  },
  openRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 4,
    marginTop: 14,
  },
  openText: { color: COLORS.cyanStrong, fontSize: 12, fontWeight: "900" },
  centerState: {
    flex: 1,
    minHeight: 340,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  stateTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 16,
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
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 13,
    backgroundColor: COLORS.cyan,
  },
  retryText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: "900",
  },
  pressed: { opacity: 0.8, transform: [{ scale: 0.995 }] },
});
