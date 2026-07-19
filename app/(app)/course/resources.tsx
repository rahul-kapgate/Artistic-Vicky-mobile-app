import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
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

import { getAllResources } from "@/services/resource.service";
import type { CourseResource, ResourceType } from "@/types/resource";

const COLORS = {
  background: "#0A0F1E",
  card: "rgba(255,255,255,0.04)",
  cardPressed: "rgba(255,255,255,0.07)",
  white: "#FFFFFF",
  text: "#F3F4F6",
  muted: "#9CA3AF",
  mutedDark: "#6B7280",
  cyan: "#22D3EE",
  border: "rgba(255,255,255,0.07)",
  borderStrong: "rgba(255,255,255,0.14)",
  danger: "#FB7185",
  searchBackground: "rgba(255,255,255,0.05)",
};

const RESOURCE_FILTERS = [
  "All",
  "Notes",
  "E-books",
  "PYQ",
  "Sessions",
] as const;

type ResourceFilter = (typeof RESOURCE_FILTERS)[number];

interface ResourceAccent {
  primary: string;
  secondary: string;
  soft: string;
  border: string;
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

function getResourceAccent(type: ResourceType | string): ResourceAccent {
  switch (type) {
    case "Notes":
      return {
        primary: "#FBBF24",
        secondary: "#F97316",
        soft: "rgba(251,191,36,0.12)",
        border: "rgba(251,191,36,0.22)",
      };

    case "E-books":
      return {
        primary: "#34D399",
        secondary: "#14B8A6",
        soft: "rgba(52,211,153,0.12)",
        border: "rgba(52,211,153,0.22)",
      };

    case "PYQ":
      return {
        primary: "#FB7185",
        secondary: "#EC4899",
        soft: "rgba(251,113,133,0.12)",
        border: "rgba(251,113,133,0.22)",
      };

    case "Sessions":
      return {
        primary: "#A78BFA",
        secondary: "#8B5CF6",
        soft: "rgba(167,139,250,0.12)",
        border: "rgba(167,139,250,0.22)",
      };

    default:
      return {
        primary: "#22D3EE",
        secondary: "#3B82F6",
        soft: "rgba(34,211,238,0.12)",
        border: "rgba(34,211,238,0.22)",
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

function LoadingCard() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonTypeRow}>
        <View style={styles.skeletonIcon} />
        <View style={styles.skeletonType} />
      </View>

      <View style={styles.skeletonTitle} />
      <View style={styles.skeletonDescription} />
      <View style={styles.skeletonDescriptionShort} />
      <View style={styles.skeletonDate} />
      <View style={styles.skeletonButton} />
    </View>
  );
}

function LoadingState() {
  return (
    <View style={styles.loadingList}>
      {Array.from({ length: 5 }).map((_, index) => (
        <LoadingCard key={index} />
      ))}
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
      <View style={styles.stateIconContainer}>
        <Ionicons name="warning-outline" size={32} color={COLORS.danger} />
      </View>

      <Text style={styles.stateTitle}>Unable to load resources</Text>

      <Text style={styles.stateDescription}>{message}</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Retry loading resources"
        onPress={onRetry}
        style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
      >
        <Ionicons name="refresh-outline" size={17} color={COLORS.white} />

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
    ? `No results found for "${search.trim()}".`
    : selectedType === "All"
      ? "No study resources are currently available."
      : `No resources found for ${selectedType}.`;

  return (
    <View style={styles.centerState}>
      <View style={styles.stateIconContainer}>
        <Ionicons name="documents-outline" size={34} color={COLORS.mutedDark} />
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

      <Text
        style={[styles.filterCountText, active && styles.filterCountTextActive]}
      >
        {count}
      </Text>
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
  const formattedDate = formatDate(resource.created_at);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View ${resource.title}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.resourceCard,
        compact && styles.resourceCardCompact,
        pressed && styles.resourceCardPressed,
      ]}
    >
      <LinearGradient
        colors={[
          "transparent",
          accent.primary,
          accent.secondary,
          "transparent",
        ]}
        locations={[0, 0.2, 0.8, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.cardAccentLine}
      />

      <View style={styles.resourceTypeRow}>
        <View
          style={[
            styles.resourceTypeIcon,
            {
              backgroundColor: accent.soft,
              borderColor: accent.border,
            },
          ]}
        >
          <Ionicons name={icon} size={16} color={accent.primary} />
        </View>

        <Text style={[styles.resourceTypeText, { color: accent.primary }]}>
          {resource.type}
        </Text>
      </View>

      <Text style={styles.resourceTitle} numberOfLines={2}>
        {resource.title}
      </Text>

      <Text style={styles.resourceDescription} numberOfLines={2}>
        {resource.description?.trim() || "No description provided."}
      </Text>

      <View style={styles.resourceMetadata}>
        {formattedDate ? (
          <View style={styles.metadataItem}>
            <Ionicons
              name="calendar-outline"
              size={13}
              color={COLORS.mutedDark}
            />

            <Text style={styles.resourceDate}>{formattedDate}</Text>
          </View>
        ) : null}

        {resource.mime_type ? (
          <View style={styles.metadataItem}>
            <Ionicons
              name="document-outline"
              size={13}
              color={COLORS.mutedDark}
            />

            <Text style={styles.mimeType} numberOfLines={1}>
              {resource.mime_type === "application/pdf"
                ? "PDF"
                : resource.mime_type}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.viewButtonWrapper}>
        <LinearGradient
          colors={[accent.primary, accent.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.viewButton}
        >
          <Ionicons name="eye-outline" size={17} color={COLORS.white} />

          <Text style={styles.viewButtonText}>View Resource</Text>

          <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
        </LinearGradient>
      </View>
    </Pressable>
  );
}

export default function ResourcesScreen() {
  const { width, height } = useWindowDimensions();

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
    queryKey: ["all-resources"],

    queryFn: getAllResources,

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

      const title = resource.title?.toLowerCase() ?? "";

      const description = resource.description?.toLowerCase() ?? "";

      const fileName = resource.file_name?.toLowerCase() ?? "";

      return (
        title.includes(normalizedSearch) ||
        description.includes(normalizedSearch) ||
        fileName.includes(normalizedSearch)
      );
    });
  }, [resources, search, selectedType]);

  const openResource = async (resource: CourseResource) => {
    try {
      if (!resource.file_url) {
        throw new Error("The resource file URL is unavailable.");
      }

      const supported = await Linking.canOpenURL(resource.file_url);

      if (!supported) {
        throw new Error("This resource cannot be opened on this device.");
      }

      await Linking.openURL(resource.file_url);
    } catch (openError) {
      console.error("Failed to open resource:", openError);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar style="light" backgroundColor={COLORS.background} />

      <View style={styles.backgroundGlowTop} />
      <View style={styles.backgroundGlowBottom} />

      <View
        style={[
          styles.screen,
          {
            paddingHorizontal: horizontalPadding,
            maxWidth: isTablet ? 820 : undefined,
          },
        ]}
      >
        <View style={styles.navigationHeader}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={10}
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.navigationButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="arrow-back" size={21} color={COLORS.white} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Refresh resources"
            disabled={isRefetching}
            hitSlop={10}
            onPress={() => void refetch()}
            style={({ pressed }) => [
              styles.navigationButton,
              pressed && styles.pressed,
              isRefetching && styles.disabled,
            ]}
          >
            {isRefetching ? (
              <ActivityIndicator size="small" color={COLORS.cyan} />
            ) : (
              <Ionicons name="refresh-outline" size={20} color={COLORS.cyan} />
            )}
          </Pressable>
        </View>

        <View style={styles.pageHeader}>
          <View style={styles.titleRow}>
            <Ionicons name="library-outline" size={26} color={COLORS.cyan} />

            <Text style={styles.pageTitle}>Study Materials</Text>
          </View>

          <Text style={styles.pageDescription}>
            Browse notes, e-books, past papers and recorded sessions—all in one
            place.
          </Text>

          {resources.length > 0 ? (
            <Text style={styles.resourceTotal}>
              {resources.length}{" "}
              {resources.length === 1 ? "resource" : "resources"} available
            </Text>
          ) : null}
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color={COLORS.mutedDark} />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search resources..."
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
                styles.clearButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="close" size={18} color={COLORS.muted} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.filtersContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
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
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={() => void refetch()}
                tintColor={COLORS.cyan}
                colors={[COLORS.cyan]}
                progressBackgroundColor={COLORS.background}
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

  backgroundGlowTop: {
    position: "absolute",
    top: -180,
    right: -190,
    width: 480,
    height: 480,
    borderRadius: 480,
    backgroundColor: "rgba(37,99,235,0.06)",
  },

  backgroundGlowBottom: {
    position: "absolute",
    bottom: -180,
    left: -180,
    width: 430,
    height: 430,
    borderRadius: 430,
    backgroundColor: "rgba(79,70,229,0.05)",
  },

  navigationHeader: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  navigationButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  pageHeader: {
    paddingTop: 12,
    paddingBottom: 25,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  pageTitle: {
    color: COLORS.white,
    fontSize: 27,
    lineHeight: 34,
    fontWeight: "800",
    letterSpacing: -0.7,
  },

  pageDescription: {
    maxWidth: 540,
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 9,
  },

  resourceTotal: {
    color: COLORS.mutedDark,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 9,
  },

  searchContainer: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 13,
    borderRadius: 12,
    backgroundColor: COLORS.searchBackground,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  searchInput: {
    flex: 1,
    height: 44,
    paddingVertical: 0,
    color: COLORS.text,
    fontSize: 14,
  },

  clearButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  filtersContainer: {
    marginHorizontal: -2,
    marginTop: 15,
    marginBottom: 20,
  },

  filtersContent: {
    gap: 8,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },

  filterButton: {
    minHeight: 34,
    paddingHorizontal: 13,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  filterButtonActive: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderColor: "rgba(255,255,255,0.20)",
  },

  filterButtonText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "600",
  },

  filterButtonTextActive: {
    color: COLORS.white,
  },

  filterCountText: {
    color: COLORS.mutedDark,
    fontSize: 10,
    fontWeight: "600",
  },

  filterCountTextActive: {
    color: COLORS.muted,
  },

  listContent: {
    paddingTop: 1,
    paddingBottom: 36,
  },

  resourceCard: {
    position: "relative",
    overflow: "hidden",
    padding: 18,
    marginBottom: 14,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  resourceCardCompact: {
    padding: 15,
    borderRadius: 16,
    marginBottom: 11,
  },

  resourceCardPressed: {
    backgroundColor: COLORS.cardPressed,
    borderColor: COLORS.borderStrong,
    transform: [{ scale: 0.995 }],
  },

  cardAccentLine: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    height: 2,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    opacity: 0.75,
  },

  resourceTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 13,
  },

  resourceTypeIcon: {
    width: 29,
    height: 29,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  resourceTypeText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.65,
    textTransform: "uppercase",
  },

  resourceTitle: {
    color: "#F3F4F6",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
  },

  resourceDescription: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 7,
  },

  resourceMetadata: {
    minHeight: 20,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 14,
  },

  metadataItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  resourceDate: {
    color: COLORS.mutedDark,
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },

  mimeType: {
    maxWidth: 130,
    color: COLORS.mutedDark,
    fontSize: 11,
    textTransform: "uppercase",
  },

  viewButtonWrapper: {
    width: "100%",
    marginTop: 17,
    borderRadius: 12,
    overflow: "hidden",
  },

  viewButton: {
    minHeight: 43,
    paddingHorizontal: 15,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  viewButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "700",
  },

  loadingList: {
    paddingTop: 1,
    paddingBottom: 36,
  },

  skeletonCard: {
    padding: 18,
    marginBottom: 14,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  skeletonTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },

  skeletonIcon: {
    width: 29,
    height: 29,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  skeletonType: {
    width: 72,
    height: 11,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  skeletonTitle: {
    width: "72%",
    height: 17,
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  skeletonDescription: {
    width: "100%",
    height: 12,
    borderRadius: 6,
    marginTop: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  skeletonDescriptionShort: {
    width: "64%",
    height: 12,
    borderRadius: 6,
    marginTop: 7,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  skeletonDate: {
    width: 92,
    height: 10,
    borderRadius: 5,
    marginTop: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  skeletonButton: {
    width: "100%",
    height: 43,
    borderRadius: 12,
    marginTop: 17,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  centerState: {
    flex: 1,
    minHeight: 300,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },

  stateIconContainer: {
    width: 62,
    height: 62,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  stateTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 15,
  },

  stateDescription: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 7,
  },

  retryButton: {
    minHeight: 42,
    paddingHorizontal: 17,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 18,
    backgroundColor: "#2563EB",
  },

  retryButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "700",
  },

  pressed: {
    opacity: 0.72,
  },

  disabled: {
    opacity: 0.5,
  },
});
