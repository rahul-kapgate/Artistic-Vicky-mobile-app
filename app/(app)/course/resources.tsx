import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { clearTemporaryResourcePdfs } from "@/services/resource-pdf.service";
import { getAllResources } from "@/services/resource.service";
import type { CourseResource, ResourceType } from "@/types/resource";

const COLORS = {
  background: "#050A1C",
  surface: "#0D1633",
  surfaceElevated: "#101B3D",
  surfaceSoft: "rgba(255,255,255,0.045)",
  surfacePressed: "rgba(255,255,255,0.075)",
  white: "#FFFFFF",
  text: "#EAF0FF",
  muted: "#9BA7C2",
  mutedDark: "#6F7B98",
  cyan: "#4CC3FF",
  cyanBright: "#33D6FF",
  cyanSoft: "rgba(76,195,255,0.11)",
  cyanBorder: "rgba(76,195,255,0.21)",
  violet: "#A78BFA",
  green: "#34D399",
  danger: "#FB7185",
  border: "rgba(255,255,255,0.08)",
  borderStrong: "rgba(255,255,255,0.15)",
};

const RESOURCE_FILTERS = [
  {
    label: "All",
    icon: "grid-outline",
  },
  {
    label: "Notes",
    icon: "document-text-outline",
  },
  {
    label: "E-books",
    icon: "book-outline",
  },
  {
    label: "PYQ",
    icon: "reader-outline",
  },
  {
    label: "Sessions",
    icon: "videocam-outline",
  },
] as const;

type ResourceFilter = (typeof RESOURCE_FILTERS)[number]["label"];

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
        border: "rgba(251,191,36,0.23)",
      };

    case "E-books":
      return {
        primary: "#34D399",
        secondary: "#14B8A6",
        soft: "rgba(52,211,153,0.12)",
        border: "rgba(52,211,153,0.23)",
      };

    case "PYQ":
      return {
        primary: "#FB7185",
        secondary: "#EC4899",
        soft: "rgba(251,113,133,0.12)",
        border: "rgba(251,113,133,0.23)",
      };

    case "Sessions":
      return {
        primary: "#A78BFA",
        secondary: "#8B5CF6",
        soft: "rgba(167,139,250,0.12)",
        border: "rgba(167,139,250,0.23)",
      };

    default:
      return {
        primary: COLORS.cyanBright,
        secondary: "#3B82F6",
        soft: COLORS.cyanSoft,
        border: COLORS.cyanBorder,
      };
  }
}

function formatDate(dateValue?: string): string {
  if (!dateValue) {
    return "";
  }

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

function isPdfResource(resource: CourseResource): boolean {
  const fileName = resource.file_name?.toLowerCase() ?? "";

  return resource.mime_type === "application/pdf" || fileName.endsWith(".pdf");
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

      <View style={styles.skeletonBottomRow}>
        <View style={styles.skeletonMeta} />
        <View style={styles.skeletonAction} />
      </View>
    </View>
  );
}

function LoadingState({ columns }: { columns: number }) {
  const loadingItems = Array.from({
    length: columns === 2 ? 6 : 5,
  });

  return (
    <View
      style={[styles.loadingGrid, columns === 2 && styles.loadingGridTablet]}
    >
      {loadingItems.map((_, index) => (
        <View
          key={index}
          style={columns === 2 ? styles.loadingColumn : undefined}
        >
          <LoadingCard />
        </View>
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
      <View style={styles.errorIconContainer}>
        <Ionicons
          name="cloud-offline-outline"
          size={36}
          color={COLORS.danger}
        />
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
  onClear,
}: {
  search: string;
  selectedType: ResourceFilter;
  onClear: () => void;
}) {
  const message = search.trim()
    ? `No results found for "${search.trim()}".`
    : selectedType === "All"
      ? "No study resources are currently available."
      : `No resources found in ${selectedType}.`;

  const hasActiveFilter = search.trim().length > 0 || selectedType !== "All";

  return (
    <View style={styles.centerState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="folder-open-outline" size={37} color={COLORS.cyan} />
      </View>

      <Text style={styles.stateTitle}>No resources found</Text>

      <Text style={styles.stateDescription}>{message}</Text>

      {hasActiveFilter ? (
        <Pressable
          accessibilityRole="button"
          onPress={onClear}
          style={({ pressed }) => [
            styles.clearFiltersButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="options-outline" size={17} color={COLORS.cyan} />

          <Text style={styles.clearFiltersText}>Clear filters</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function FilterButton({
  filter,
  icon,
  active,
  count,
  onPress,
}: {
  filter: ResourceFilter;
  icon: keyof typeof Ionicons.glyphMap;
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
        name={icon}
        size={15}
        color={active ? COLORS.white : COLORS.muted}
      />

      <Text
        style={[
          styles.filterButtonText,
          active && styles.filterButtonTextActive,
        ]}
      >
        {filter}
      </Text>

      <View
        style={[
          styles.filterCountBadge,
          active && styles.filterCountBadgeActive,
        ]}
      >
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

function SummaryStat({
  icon,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
}) {
  return (
    <View style={styles.summaryStat}>
      <View style={styles.summaryStatIcon}>
        <Ionicons name={icon} size={18} color={COLORS.cyan} />
      </View>

      <View style={styles.summaryStatContent}>
        <Text style={styles.summaryStatValue}>{value}</Text>
        <Text style={styles.summaryStatLabel}>{label}</Text>
      </View>
    </View>
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
  const pdfResource = isPdfResource(resource);

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
        locations={[0, 0.18, 0.82, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.cardAccentLine}
      />

      <View style={styles.resourceCardTop}>
        <View
          style={[
            styles.resourceIconLarge,
            {
              backgroundColor: accent.soft,
              borderColor: accent.border,
            },
          ]}
        >
          <Ionicons name={icon} size={23} color={accent.primary} />
        </View>

        <View style={styles.resourceBadgeColumn}>
          <View
            style={[
              styles.resourceTypeBadge,
              {
                backgroundColor: accent.soft,
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

          <View
            style={[
              styles.fileStatusBadge,
              pdfResource ? styles.fileStatusPdf : styles.fileStatusUnsupported,
            ]}
          >
            <Ionicons
              name={
                pdfResource
                  ? "checkmark-circle-outline"
                  : "information-circle-outline"
              }
              size={12}
              color={pdfResource ? COLORS.green : COLORS.muted}
            />

            <Text
              style={[
                styles.fileStatusText,
                {
                  color: pdfResource ? COLORS.green : COLORS.muted,
                },
              ]}
            >
              {pdfResource ? "PDF" : "Preview only"}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.resourceTitle} numberOfLines={2}>
        {resource.title}
      </Text>

      <Text style={styles.resourceDescription} numberOfLines={3}>
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

            <Text style={styles.metadataText}>{formattedDate}</Text>
          </View>
        ) : null}

        {resource.file_name ? (
          <View style={styles.metadataItem}>
            <Ionicons
              name="document-attach-outline"
              size={13}
              color={COLORS.mutedDark}
            />

            <Text style={styles.fileName} numberOfLines={1}>
              {resource.file_name}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.cardActionRow}>
        <View>
          <Text style={styles.cardActionHint}>
            {pdfResource ? "Open in secure viewer" : "Tap to view details"}
          </Text>

          <Text style={styles.cardActionSubtext}>
            {pdfResource
              ? "Zoom and rotate supported"
              : "PDF preview unavailable"}
          </Text>
        </View>

        <LinearGradient
          colors={[accent.primary, accent.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.openButton}
        >
          <Ionicons
            name={pdfResource ? "eye-outline" : "arrow-forward"}
            size={19}
            color={COLORS.white}
          />
        </LinearGradient>
      </View>
    </Pressable>
  );
}

export default function ResourcesScreen() {
  const { width, height } = useWindowDimensions();

  const [selectedType, setSelectedType] = useState<ResourceFilter>("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    void clearTemporaryResourcePdfs();
  }, []);

  const isTablet = width >= 720;
  const isCompact = width < 360 || height < 700;
  const columns = isTablet ? 2 : 1;

  const horizontalPadding = isTablet ? 28 : isCompact ? 14 : 18;
  const maxContentWidth = isTablet ? 980 : 680;

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

  const pdfCount = useMemo(
    () => resources.filter(isPdfResource).length,
    [resources],
  );

  const categoryCount = useMemo(
    () =>
      RESOURCE_FILTERS.filter(
        (filter) => filter.label !== "All" && typeCounts[filter.label] > 0,
      ).length,
    [typeCounts],
  );

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

  const clearFilters = () => {
    setSearch("");
    setSelectedType("All");
  };

  const openResource = (resource: CourseResource) => {
    if (!isPdfResource(resource)) {
      Alert.alert(
        "Preview unavailable",
        "This resource is not a PDF. In-app viewing is currently available for PDF resources only.",
      );
      return;
    }

    router.push({
      pathname: "/(app)/course/resource-viewer",
      params: {
        id: String(resource.id),
        title: resource.title || "Resource PDF",
      },
    });
  };

  const listHeader = (
    <>
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

        <View style={styles.navigationTitle}>
          <Text style={styles.navigationTitleText}>Study Resources</Text>

          <Text style={styles.navigationSubtitle}>
            Your course learning library
          </Text>
        </View>

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

      <LinearGradient
        colors={["#172554", "#312E81", "#581C87"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.heroGlowOne} />
        <View style={styles.heroGlowTwo} />

        <View style={styles.heroTopRow}>
          <View style={styles.heroIcon}>
            <Ionicons name="library-outline" size={28} color={COLORS.white} />
          </View>

          <View style={styles.heroBadge}>
            <View style={styles.heroBadgeDot} />

            <Text style={styles.heroBadgeText}>ENROLLED ACCESS</Text>
          </View>
        </View>

        <Text style={styles.heroTitle}>Your study material, organised.</Text>

        <Text style={styles.heroDescription}>
          Browse course notes, e-books, previous-year papers and recorded
          learning resources from one place.
        </Text>

        <View style={styles.summaryRow}>
          <SummaryStat
            icon="documents-outline"
            value={resources.length}
            label="Resources"
          />

          <View style={styles.summaryDivider} />

          <SummaryStat
            icon="folder-open-outline"
            value={categoryCount}
            label="Categories"
          />

          <View style={styles.summaryDivider} />

          <SummaryStat
            icon="reader-outline"
            value={pdfCount}
            label="PDF files"
          />
        </View>
      </LinearGradient>

      <View style={styles.contentHeader}>
        <View>
          <Text style={styles.contentEyebrow}>COURSE LIBRARY</Text>
          <Text style={styles.contentTitle}>Learning resources</Text>
        </View>

        <View style={styles.resultBadge}>
          <Text style={styles.resultBadgeText}>{filteredResources.length}</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchIconContainer}>
          <Ionicons name="search-outline" size={19} color={COLORS.cyan} />
        </View>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search title, description or file..."
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

      <FlatList
        horizontal
        data={RESOURCE_FILTERS}
        keyExtractor={(filter) => filter.label}
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.filtersContent}
        style={styles.filtersList}
        renderItem={({ item }) => (
          <FilterButton
            filter={item.label}
            icon={item.icon}
            active={selectedType === item.label}
            count={typeCounts[item.label]}
            onPress={() => setSelectedType(item.label)}
          />
        )}
      />

      {search.trim() || selectedType !== "All" ? (
        <View style={styles.activeFilterRow}>
          <View style={styles.activeFilterInfo}>
            <Ionicons name="options-outline" size={15} color={COLORS.cyan} />

            <Text style={styles.activeFilterText}>
              Showing {filteredResources.length} matching{" "}
              {filteredResources.length === 1 ? "resource" : "resources"}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={clearFilters}
            hitSlop={8}
          >
            <Text style={styles.clearAllText}>Clear</Text>
          </Pressable>
        </View>
      ) : null}
    </>
  );

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
            maxWidth: maxContentWidth,
          },
        ]}
      >
        <FlatList
          key={`resources-${columns}`}
          data={isLoading || isError ? [] : filteredResources}
          keyExtractor={(item) => String(item.id)}
          numColumns={columns}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          columnWrapperStyle={columns === 2 ? styles.columnWrapper : undefined}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
              tintColor={COLORS.cyan}
              colors={[COLORS.cyan]}
              progressBackgroundColor={COLORS.surface}
            />
          }
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            isLoading ? (
              <LoadingState columns={columns} />
            ) : isError ? (
              <ErrorState
                message={
                  error instanceof Error
                    ? error.message
                    : "Network error while loading resources."
                }
                onRetry={() => void refetch()}
              />
            ) : (
              <EmptyState
                search={search}
                selectedType={selectedType}
                onClear={clearFilters}
              />
            )
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.resourceColumn,
                columns === 2 && styles.resourceColumnTablet,
              ]}
            >
              <ResourceCard
                resource={item}
                compact={isCompact}
                onPress={() => openResource(item)}
              />
            </View>
          )}
        />
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
    backgroundColor: "rgba(37,99,235,0.09)",
  },

  backgroundGlowBottom: {
    position: "absolute",
    bottom: -180,
    left: -180,
    width: 430,
    height: 430,
    borderRadius: 430,
    backgroundColor: "rgba(168,85,247,0.07)",
  },

  listContent: {
    paddingBottom: 44,
  },

  navigationHeader: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  navigationButton: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  navigationTitle: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 10,
  },

  navigationTitleText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "900",
  },

  navigationSubtitle: {
    color: COLORS.mutedDark,
    fontSize: 10,
    fontWeight: "600",
    marginTop: 3,
  },

  heroCard: {
    overflow: "hidden",
    borderRadius: 27,
    padding: 21,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  heroGlowOne: {
    position: "absolute",
    top: -70,
    right: -55,
    width: 190,
    height: 190,
    borderRadius: 190,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  heroGlowTwo: {
    position: "absolute",
    bottom: -85,
    left: -65,
    width: 210,
    height: 210,
    borderRadius: 210,
    backgroundColor: "rgba(51,214,255,0.06)",
  },

  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  heroIcon: {
    width: 55,
    height: 55,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(76,195,255,0.17)",
    borderWidth: 1,
    borderColor: "rgba(76,195,255,0.25)",
  },

  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(34,197,94,0.1)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.22)",
  },

  heroBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: 7,
    marginRight: 7,
    backgroundColor: COLORS.green,
  },

  heroBadgeText: {
    color: "#BBF7D0",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.7,
  },

  heroTitle: {
    maxWidth: 560,
    color: COLORS.white,
    fontSize: 27,
    lineHeight: 34,
    fontWeight: "900",
    letterSpacing: -0.6,
    marginTop: 20,
  },

  heroDescription: {
    maxWidth: 620,
    color: "#C7D2FE",
    fontSize: 13,
    lineHeight: 21,
    marginTop: 9,
  },

  summaryRow: {
    minHeight: 74,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 5,
    paddingVertical: 12,
    borderRadius: 18,
    marginTop: 21,
    backgroundColor: "rgba(5,10,28,0.42)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  summaryStat: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 0,
  },

  summaryStatIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.cyanSoft,
  },

  summaryStatContent: {
    marginLeft: 8,
    minWidth: 0,
  },

  summaryStatValue: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "900",
  },

  summaryStatLabel: {
    color: COLORS.muted,
    fontSize: 9,
    marginTop: 2,
  },

  summaryDivider: {
    width: 1,
    height: 34,
    backgroundColor: "rgba(255,255,255,0.1)",
  },

  contentHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 30,
    marginBottom: 15,
  },

  contentEyebrow: {
    color: COLORS.cyan,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  contentTitle: {
    color: COLORS.white,
    fontSize: 23,
    fontWeight: "900",
    marginTop: 5,
  },

  resultBadge: {
    minWidth: 34,
    height: 34,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.cyanSoft,
    borderWidth: 1,
    borderColor: COLORS.cyanBorder,
  },

  resultBadgeText: {
    color: COLORS.cyan,
    fontSize: 12,
    fontWeight: "900",
  },

  searchContainer: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  searchIconContainer: {
    width: 39,
    height: 39,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.cyanSoft,
  },

  searchInput: {
    flex: 1,
    height: 52,
    paddingHorizontal: 11,
    paddingVertical: 0,
    color: COLORS.text,
    fontSize: 13,
  },

  clearButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },

  filtersList: {
    marginHorizontal: -2,
    marginTop: 14,
    marginBottom: 18,
  },

  filtersContent: {
    gap: 8,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },

  filterButton: {
    minHeight: 39,
    paddingHorizontal: 11,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  filterButtonActive: {
    backgroundColor: "rgba(76,195,255,0.13)",
    borderColor: COLORS.cyanBorder,
  },

  filterButtonText: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
  },

  filterButtonTextActive: {
    color: COLORS.white,
  },

  filterCountBadge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  filterCountBadgeActive: {
    backgroundColor: "rgba(76,195,255,0.14)",
  },

  filterCountText: {
    color: COLORS.mutedDark,
    fontSize: 9,
    fontWeight: "800",
  },

  filterCountTextActive: {
    color: COLORS.cyan,
  },

  activeFilterRow: {
    minHeight: 39,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 13,
  },

  activeFilterInfo: {
    flexDirection: "row",
    alignItems: "center",
  },

  activeFilterText: {
    color: COLORS.muted,
    fontSize: 11,
    marginLeft: 7,
  },

  clearAllText: {
    color: COLORS.cyan,
    fontSize: 11,
    fontWeight: "800",
  },

  columnWrapper: {
    gap: 14,
  },

  resourceColumn: {
    flex: 1,
  },

  resourceColumnTablet: {
    maxWidth: "50%",
  },

  resourceCard: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
    padding: 18,
    marginBottom: 14,
    borderRadius: 21,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  resourceCardCompact: {
    padding: 15,
    borderRadius: 18,
    marginBottom: 11,
  },

  resourceCardPressed: {
    backgroundColor: COLORS.surfacePressed,
    borderColor: COLORS.borderStrong,
    transform: [{ scale: 0.995 }],
  },

  cardAccentLine: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    height: 2,
    opacity: 0.82,
  },

  resourceCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 17,
  },

  resourceIconLarge: {
    width: 51,
    height: 51,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  resourceBadgeColumn: {
    alignItems: "flex-end",
    gap: 6,
  },

  resourceTypeBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 9,
    borderWidth: 1,
  },

  resourceTypeText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.65,
    textTransform: "uppercase",
  },

  fileStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },

  fileStatusPdf: {
    backgroundColor: "rgba(52,211,153,0.08)",
    borderColor: "rgba(52,211,153,0.18)",
  },

  fileStatusUnsupported: {
    backgroundColor: "rgba(255,255,255,0.035)",
    borderColor: COLORS.border,
  },

  fileStatusText: {
    fontSize: 8,
    fontWeight: "800",
  },

  resourceTitle: {
    color: COLORS.white,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "900",
  },

  resourceDescription: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 8,
  },

  resourceMetadata: {
    minHeight: 22,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 15,
  },

  metadataItem: {
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  metadataText: {
    color: COLORS.mutedDark,
    fontSize: 10,
    fontVariant: ["tabular-nums"],
  },

  fileName: {
    maxWidth: 180,
    color: COLORS.mutedDark,
    fontSize: 10,
  },

  cardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },

  cardActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  cardActionHint: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "800",
  },

  cardActionSubtext: {
    color: COLORS.mutedDark,
    fontSize: 9,
    marginTop: 3,
  },

  openButton: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingGrid: {
    paddingTop: 1,
  },

  loadingGridTablet: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },

  loadingColumn: {
    width: "48.8%",
  },

  skeletonCard: {
    padding: 18,
    marginBottom: 14,
    borderRadius: 21,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  skeletonTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  skeletonIcon: {
    width: 51,
    height: 51,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  skeletonBadge: {
    width: 72,
    height: 26,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  skeletonTitle: {
    width: "72%",
    height: 18,
    borderRadius: 7,
    marginTop: 19,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  skeletonDescription: {
    width: "100%",
    height: 12,
    borderRadius: 6,
    marginTop: 13,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  skeletonDescriptionShort: {
    width: "66%",
    height: 12,
    borderRadius: 6,
    marginTop: 7,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  skeletonBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 28,
  },

  skeletonMeta: {
    width: 100,
    height: 11,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  skeletonAction: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  centerState: {
    minHeight: 330,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },

  errorIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(251,113,133,0.1)",
    borderWidth: 1,
    borderColor: "rgba(251,113,133,0.2)",
  },

  emptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.cyanSoft,
    borderWidth: 1,
    borderColor: COLORS.cyanBorder,
  },

  stateTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 17,
  },

  stateDescription: {
    maxWidth: 420,
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 8,
  },

  retryButton: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 20,
    backgroundColor: COLORS.cyan,
  },

  retryButtonText: {
    color: COLORS.background,
    fontSize: 13,
    fontWeight: "900",
  },

  clearFiltersButton: {
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 18,
    borderWidth: 1,
    borderColor: COLORS.cyanBorder,
    backgroundColor: COLORS.cyanSoft,
  },

  clearFiltersText: {
    color: COLORS.cyan,
    fontSize: 12,
    fontWeight: "800",
  },

  pressed: {
    opacity: 0.72,
  },

  disabled: {
    opacity: 0.5,
  },
});
