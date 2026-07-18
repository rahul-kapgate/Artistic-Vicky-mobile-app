import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
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

import { getCourseResources } from "@/services/resource.service";
import type { CourseResource, ResourceType } from "@/types/resource";

const COLORS = {
  background: "#050A1C",
  card: "#0F1735",
  cardPressed: "#151F45",
  white: "#FFFFFF",
  text: "#D8E0F5",
  muted: "#8E99B7",
  cyan: "#4CC3FF",
  cyanStrong: "#33D6FF",
  border: "rgba(255,255,255,0.08)",
  danger: "#FF6B9A",
  input: "#0C1430",
};

const RESOURCE_FILTERS = [
  "All",
  "Notes",
  "E-books",
  "PYQ",
  "Sessions",
] as const;

type ResourceFilter = (typeof RESOURCE_FILTERS)[number];

function getParam(value?: string | string[]): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function getResourceIcon(
  type: ResourceType | string,
): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case "Notes":
      return "document-text-outline";

    case "E-books":
      return "book-outline";

    case "PYQ":
      return "reader-outline";

    case "Sessions":
      return "videocam-outline";

    default:
      return "document-outline";
  }
}

function getResourceAccent(type: ResourceType | string) {
  switch (type) {
    case "Notes":
      return {
        primary: "#F59E0B",
        background: "rgba(245,158,11,0.13)",
        border: "rgba(245,158,11,0.24)",
        gradient: ["rgba(245,158,11,0.18)", "rgba(249,115,22,0.06)"] as const,
      };

    case "E-books":
      return {
        primary: "#34D399",
        background: "rgba(52,211,153,0.13)",
        border: "rgba(52,211,153,0.24)",
        gradient: ["rgba(52,211,153,0.18)", "rgba(20,184,166,0.06)"] as const,
      };

    case "PYQ":
      return {
        primary: "#FB7185",
        background: "rgba(251,113,133,0.13)",
        border: "rgba(251,113,133,0.24)",
        gradient: ["rgba(251,113,133,0.18)", "rgba(236,72,153,0.06)"] as const,
      };

    case "Sessions":
      return {
        primary: "#A78BFA",
        background: "rgba(167,139,250,0.13)",
        border: "rgba(167,139,250,0.24)",
        gradient: ["rgba(167,139,250,0.18)", "rgba(124,58,237,0.06)"] as const,
      };

    default:
      return {
        primary: COLORS.cyan,
        background: "rgba(76,195,255,0.13)",
        border: "rgba(76,195,255,0.24)",
        gradient: ["rgba(76,195,255,0.18)", "rgba(37,99,235,0.06)"] as const,
      };
  }
}

function formatDate(dateValue: string): string {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function LoadingState() {
  return (
    <View style={styles.centerState}>
      <ActivityIndicator size="large" color={COLORS.cyan} />

      <Text style={styles.stateTitle}>Loading resources</Text>

      <Text style={styles.stateDescription}>
        Fetching available study materials...
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

      <Text style={styles.stateTitle}>Unable to load resources</Text>

      <Text style={styles.stateDescription}>{message}</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Retry loading resources"
        onPress={onRetry}
        style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
      >
        <Ionicons name="refresh-outline" size={18} color={COLORS.background} />

        <Text style={styles.retryButtonText}>Try Again</Text>
      </Pressable>
    </View>
  );
}

function EmptyState({
  search,
  selectedType,
}: {
  search: string;
  selectedType: ResourceFilter;
}) {
  const message = search.trim()
    ? `No resources found for "${search.trim()}".`
    : selectedType === "All"
      ? "No study resources are currently available."
      : `No ${selectedType} resources are currently available.`;

  return (
    <View style={styles.centerState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="library-outline" size={36} color={COLORS.cyan} />
      </View>

      <Text style={styles.stateTitle}>No resources found</Text>

      <Text style={styles.stateDescription}>{message}</Text>
    </View>
  );
}

function FilterButton({
  filter,
  active,
  count,
  onPress,
}: {
  filter: ResourceFilter;
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
      <Text
        style={[
          styles.filterButtonText,
          active && styles.filterButtonTextActive,
        ]}
      >
        {filter}
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

function ResourceCard({
  resource,
  compact,
  onPress,
}: {
  resource: CourseResource;
  compact: boolean;
  onPress: () => void;
}) {
  const accent = getResourceAccent(resource.type);
  const icon = getResourceIcon(resource.type);
  const date = formatDate(resource.created_at);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${resource.title}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.resourceCard,
        compact && styles.resourceCardCompact,
        pressed && styles.resourceCardPressed,
      ]}
    >
      <LinearGradient
        colors={accent.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.resourceIcon,
          {
            borderColor: accent.border,
          },
        ]}
      >
        <Ionicons name={icon} size={24} color={accent.primary} />
      </LinearGradient>

      <View style={styles.resourceContent}>
        <View style={styles.resourceTopRow}>
          <View
            style={[
              styles.resourceTypeBadge,
              {
                backgroundColor: accent.background,
                borderColor: accent.border,
              },
            ]}
          >
            <Text
              style={[
                styles.resourceTypeText,
                {
                  color: accent.primary,
                },
              ]}
            >
              {resource.type}
            </Text>
          </View>

          {date ? <Text style={styles.resourceDate}>{date}</Text> : null}
        </View>

        <Text style={styles.resourceTitle} numberOfLines={2}>
          {resource.title}
        </Text>

        <Text style={styles.resourceDescription} numberOfLines={2}>
          {resource.description?.trim() || "No description provided."}
        </Text>

        <View style={styles.resourceBottomRow}>
          <View style={styles.fileInfo}>
            <Ionicons
              name="document-attach-outline"
              size={14}
              color={COLORS.muted}
            />

            <Text style={styles.fileName} numberOfLines={1}>
              {resource.file_name}
            </Text>
          </View>

          <View
            style={[
              styles.openButton,
              {
                backgroundColor: accent.background,
                borderColor: accent.border,
              },
            ]}
          >
            <Text
              style={[
                styles.openButtonText,
                {
                  color: accent.primary,
                },
              ]}
            >
              Open
            </Text>

            <Ionicons name="chevron-forward" size={15} color={accent.primary} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function CourseResourcesScreen() {
  const { width, height } = useWindowDimensions();

  const params = useLocalSearchParams<{
    id?: string | string[];
    courseId?: string | string[];
  }>();

  const courseId = getParam(params.courseId) ?? getParam(params.id);

  const [selectedType, setSelectedType] = useState<ResourceFilter>("All");

  const [search, setSearch] = useState("");

  const isTablet = width >= 768;
  const isCompact = width < 360 || height < 700;

  const horizontalPadding = isTablet ? 28 : isCompact ? 14 : 18;

  const {
    data: resources = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["course-resources", courseId],

    queryFn: () => getCourseResources(courseId!),

    enabled: Boolean(courseId),

    staleTime: 5 * 60 * 1000,

    retry: 2,
  });

  const typeCounts = useMemo(() => {
    const counts: Record<ResourceFilter, number> = {
      All: resources.length,
      Notes: 0,
      "E-books": 0,
      PYQ: 0,
      Sessions: 0,
    };

    resources.forEach((resource) => {
      if (resource.type in counts) {
        counts[resource.type as ResourceType] += 1;
      }
    });

    return counts;
  }, [resources]);

  const filteredResources = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return resources.filter((resource) => {
      const matchesType =
        selectedType === "All" || resource.type === selectedType;

      if (!matchesType) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return (
        resource.title.toLowerCase().includes(normalizedSearch) ||
        resource.description?.toLowerCase().includes(normalizedSearch) ||
        resource.file_name.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [resources, search, selectedType]);

  const openResource = async (resource: CourseResource) => {
    try {
      /*
       * Recommended:
       * Navigate to your own PDF viewer screen.
       *
       * router.push({
       *   pathname: "/(app)/resource-viewer/[id]",
       *   params: {
       *     id: String(resource.id),
       *     title: resource.title,
       *     url: resource.file_url,
       *   },
       * });
       */

      const supported = await Linking.canOpenURL(resource.file_url);

      if (!supported) {
        throw new Error("This resource URL cannot be opened.");
      }

      await Linking.openURL(resource.file_url);
    } catch (openError) {
      console.error("Failed to open resource:", openError);
    }
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
            <Text style={styles.headerTitle}>Study Materials</Text>

            <Text style={styles.headerSubtitle}>
              {resources.length > 0
                ? `${resources.length} resources available`
                : "Notes, books and sessions"}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Refresh resources"
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
            <Text style={styles.heroTitle}>Everything in one place</Text>

            <Text style={styles.heroText}>
              Browse notes, e-books, previous papers and recorded sessions for
              this course.
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={19} color={COLORS.muted} />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search resources..."
            placeholderTextColor={COLORS.muted}
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
                styles.clearButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="close-circle" size={20} color={COLORS.muted} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.filtersWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContent}
          >
            {RESOURCE_FILTERS.map((filter) => (
              <FilterButton
                key={filter}
                filter={filter}
                active={selectedType === filter}
                count={typeCounts[filter]}
                onPress={() => setSelectedType(filter)}
              />
            ))}
          </ScrollView>
        </View>

        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState
            message={
              error instanceof Error
                ? error.message
                : "Network error while loading resources."
            }
            onRetry={() => void refetch()}
          />
        ) : filteredResources.length === 0 ? (
          <EmptyState search={search} selectedType={selectedType} />
        ) : (
          <FlatList
            data={filteredResources}
            keyExtractor={(item) => String(item.id)}
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
            renderItem={({ item }) => (
              <ResourceCard
                resource={item}
                compact={isCompact}
                onPress={() => void openResource(item)}
              />
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

  searchContainer: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: COLORS.input,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  searchInput: {
    flex: 1,
    height: "100%",
    paddingVertical: 0,
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },

  clearButton: {
    alignItems: "center",
    justifyContent: "center",
  },

  filtersWrapper: {
    marginHorizontal: -2,
    marginTop: 12,
    marginBottom: 10,
  },

  filtersContent: {
    gap: 8,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },

  filterButton: {
    minHeight: 38,
    paddingHorizontal: 13,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(15,23,53,0.78)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  filterButtonActive: {
    backgroundColor: "rgba(76,195,255,0.13)",
    borderColor: "rgba(76,195,255,0.35)",
  },

  filterButtonText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "800",
  },

  filterButtonTextActive: {
    color: COLORS.cyanStrong,
  },

  filterCount: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  filterCountActive: {
    backgroundColor: "rgba(76,195,255,0.16)",
  },

  filterCountText: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },

  filterCountTextActive: {
    color: COLORS.cyanStrong,
  },

  listContent: {
    paddingTop: 5,
    paddingBottom: 32,
  },

  resourceCard: {
    minHeight: 154,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 13,
    padding: 14,
    marginBottom: 11,
    borderRadius: 19,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  resourceCardCompact: {
    minHeight: 144,
    gap: 10,
    padding: 11,
    borderRadius: 16,
  },

  resourceCardPressed: {
    opacity: 0.88,
    backgroundColor: COLORS.cardPressed,
    transform: [{ scale: 0.995 }],
  },

  resourceIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  resourceContent: {
    flex: 1,
    minWidth: 0,
  },

  resourceTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  resourceTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },

  resourceTypeText: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  resourceDate: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "700",
  },

  resourceTitle: {
    color: COLORS.white,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
    marginTop: 9,
  },

  resourceDescription: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 5,
  },

  resourceBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },

  fileInfo: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  fileName: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "600",
  },

  openButton: {
    minHeight: 32,
    paddingHorizontal: 10,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderWidth: 1,
  },

  openButtonText: {
    fontSize: 11,
    fontWeight: "900",
  },

  centerState: {
    flex: 1,
    minHeight: 280,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },

  stateTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 14,
  },

  stateDescription: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 7,
  },

  errorIcon: {
    width: 66,
    height: 66,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,107,154,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,107,154,0.22)",
  },

  emptyIcon: {
    width: 66,
    height: 66,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(76,195,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(76,195,255,0.22)",
  },

  retryButton: {
    minHeight: 42,
    paddingHorizontal: 17,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 17,
    backgroundColor: COLORS.cyanStrong,
  },

  retryButtonText: {
    color: COLORS.background,
    fontSize: 13,
    fontWeight: "900",
  },

  pressed: {
    opacity: 0.76,
  },

  disabled: {
    opacity: 0.55,
  },
});
