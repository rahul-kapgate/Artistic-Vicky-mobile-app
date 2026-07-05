import {
  getAllResourcesByCourseId,
  getResourceStreamUrl,
} from "@/services/resource.service";
import { Resource } from "@/types/resource";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const RESOURCE_TYPES = ["All", "Notes", "E-books", "PYQ", "Sessions"] as const;
type ResourceType = (typeof RESOURCE_TYPES)[number];

const getTypeIcon = (type: string) => {
  switch (type) {
    case "Notes":
      return "notebook-outline";
    case "E-books":
      return "book-open-page-variant-outline";
    case "PYQ":
      return "file-document-outline";
    case "Sessions":
      return "video-outline";
    default:
      return "file-outline";
  }
};

const getTypeColors = (type: string): readonly [string, string] => {
  switch (type) {
    case "Notes":
      return ["#F59E0B", "#F97316"];
    case "E-books":
      return ["#10B981", "#14B8A6"];
    case "PYQ":
      return ["#FB7185", "#EC4899"];
    case "Sessions":
      return ["#8B5CF6", "#A855F7"];
    default:
      return ["#33D6FF", "#4C8DFF"];
  }
};

const formatDate = (date?: string) => {
  if (!date) return "N/A";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function ResourcesScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();

  const courseId = Array.isArray(id) ? id[0] : id;

  const [selectedType, setSelectedType] = useState<ResourceType>("All");
  const [search, setSearch] = useState("");

  const {
    data: resources = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["course-resources", courseId],
    queryFn: () => getAllResourcesByCourseId(courseId!),
    enabled: !!courseId,
  });

  const typeCounts = useMemo(() => {
    const map: Record<string, number> = {
      All: resources.length,
    };

    resources.forEach((resource) => {
      map[resource.type] = (map[resource.type] || 0) + 1;
    });

    return map;
  }, [resources]);

  const filteredResources = useMemo(() => {
    let list =
      selectedType === "All"
        ? resources
        : resources.filter((resource) => resource.type === selectedType);

    if (search.trim()) {
      const query = search.trim().toLowerCase();

      list = list.filter((resource) => {
        return (
          resource.title?.toLowerCase().includes(query) ||
          resource.description?.toLowerCase().includes(query) ||
          resource.file_name?.toLowerCase().includes(query)
        );
      });
    }

    return list;
  }, [resources, selectedType, search]);

  const handleOpenResource = async (resource: Resource) => {
    const streamUrl = getResourceStreamUrl(resource.id);

    const canOpen = await Linking.canOpenURL(streamUrl);

    if (canOpen) {
      await Linking.openURL(streamUrl);
      return;
    }

    if (resource.file_url) {
      await Linking.openURL(resource.file_url);
    }
  };

  if (!courseId) {
    return (
      <SafeAreaView style={styles.center} edges={["top", "bottom"]}>
        <StatusBar style="light" backgroundColor="#050A1C" />

        <Text style={styles.errorTitle}>Invalid course</Text>

        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center} edges={["top", "bottom"]}>
        <StatusBar style="light" backgroundColor="#050A1C" />

        <View style={styles.glowTopLeft} />
        <View style={styles.glowBottomRight} />

        <ActivityIndicator size="large" color="#4CC3FF" />
        <Text style={styles.loadingText}>Loading study materials...</Text>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.center} edges={["top", "bottom"]}>
        <StatusBar style="light" backgroundColor="#050A1C" />

        <View style={styles.errorIconBox}>
          <Ionicons name="alert-circle-outline" size={42} color="#FF6B9A" />
        </View>

        <Text style={styles.errorTitle}>Couldn’t load resources</Text>

        <Text style={styles.errorDescription}>
          Something went wrong while loading study materials. Please try again.
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.retryButton}
          onPress={() => refetch()}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar style="light" backgroundColor="#050A1C" />

      <View style={styles.glowTopLeft} />
      <View style={styles.glowCenter} />
      <View style={styles.glowBottomRight} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.85}
            hitSlop={10}
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Study Materials</Text>

          <View style={styles.headerSpacer} />
        </View>

        <LinearGradient
          colors={["#172554", "#111B45", "#080E28"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroIconBox}>
            <Ionicons name="library-outline" size={30} color="#FFFFFF" />
          </View>

          <Text style={styles.title}>Resources</Text>

          <Text style={styles.subtitle}>
            Browse notes, e-books, PYQs and recorded sessions in one place.
          </Text>

          <View style={styles.totalBadge}>
            <Text style={styles.totalBadgeText}>
              {resources.length}{" "}
              {resources.length === 1 ? "Resource" : "Resources"}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#8A93B8" />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search resources..."
            placeholderTextColor="#8A93B8"
            style={styles.searchInput}
          />

          {!!search && (
            <TouchableOpacity activeOpacity={0.8} onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={20} color="#8A93B8" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {RESOURCE_TYPES.map((type) => {
            const active = selectedType === type;

            return (
              <TouchableOpacity
                key={type}
                activeOpacity={0.85}
                onPress={() => setSelectedType(type)}
                style={[styles.filterPill, active && styles.filterPillActive]}
              >
                <Text
                  style={[styles.filterText, active && styles.filterTextActive]}
                >
                  {type}
                </Text>

                <Text
                  style={[
                    styles.filterCount,
                    active && styles.filterCountActive,
                  ]}
                >
                  {typeCounts[type] || 0}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {filteredResources.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="document-text-outline" size={44} color="#4CC3FF" />

            <Text style={styles.emptyTitle}>No resources found</Text>

            <Text style={styles.emptyText}>
              {search
                ? `No results found for "${search}".`
                : `No resources found for ${selectedType}.`}
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredResources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                onPress={() => handleOpenResource(resource)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ResourceCard({
  resource,
  onPress,
}: {
  resource: Resource;
  onPress: () => void;
}) {
  const colors = getTypeColors(resource.type);
  const iconName = getTypeIcon(resource.type);

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
      <View style={styles.resourceCard}>
        <View style={styles.accentLineWrapper}>
          <LinearGradient
            colors={colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.accentLine}
          />
        </View>

        <View style={styles.resourceTopRow}>
          <LinearGradient colors={colors} style={styles.resourceIconBox}>
            <MaterialCommunityIcons
              name={iconName as any}
              size={25}
              color="#FFFFFF"
            />
          </LinearGradient>

          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{resource.type || "File"}</Text>
          </View>
        </View>

        <Text numberOfLines={2} style={styles.resourceTitle}>
          {resource.title}
        </Text>

        <Text numberOfLines={2} style={styles.resourceDescription}>
          {resource.description || "No description provided."}
        </Text>

        <View style={styles.resourceMetaRow}>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={15} color="#8A93B8" />
            <Text style={styles.resourceDate}>
              {formatDate(resource.created_at)}
            </Text>
          </View>

          <View style={styles.fileTypePill}>
            <Text style={styles.fileTypeText}>
              {resource.mime_type?.includes("pdf") ? "PDF" : "FILE"}
            </Text>
          </View>
        </View>

        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.viewButtonGradient}
        >
          <View style={styles.viewButton}>
            <Text style={styles.viewButtonText}>View Resource</Text>
            <Ionicons name="open-outline" size={18} color="#FFFFFF" />
          </View>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050A1C",
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 42,
  },

  center: {
    flex: 1,
    backgroundColor: "#050A1C",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  glowTopLeft: {
    position: "absolute",
    top: -90,
    left: -110,
    width: 260,
    height: 260,
    borderRadius: 260,
    backgroundColor: "rgba(124, 58, 237, 0.18)",
  },

  glowCenter: {
    position: "absolute",
    top: 260,
    right: -90,
    width: 260,
    height: 260,
    borderRadius: 260,
    backgroundColor: "rgba(255, 63, 167, 0.1)",
  },

  glowBottomRight: {
    position: "absolute",
    bottom: -130,
    right: -130,
    width: 330,
    height: 330,
    borderRadius: 330,
    backgroundColor: "rgba(51, 214, 255, 0.12)",
  },

  loadingText: {
    color: "#AAB2CC",
    marginTop: 14,
    fontSize: 15,
    fontWeight: "600",
  },

  header: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  backButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(22, 35, 74, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  headerSpacer: {
    width: 46,
  },

  hero: {
    borderRadius: 26,
    padding: 22,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(76, 195, 255, 0.14)",
  },

  heroIconBox: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: "rgba(76, 195, 255, 0.16)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(76, 195, 255, 0.24)",
  },

  title: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  subtitle: {
    color: "#C7D2FE",
    fontSize: 15,
    lineHeight: 24,
    marginTop: 10,
  },

  totalBadge: {
    alignSelf: "flex-start",
    marginTop: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(51, 214, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(51, 214, 255, 0.2)",
  },

  totalBadgeText: {
    color: "#33D6FF",
    fontSize: 12,
    fontWeight: "900",
  },

  searchBox: {
    height: 52,
    borderRadius: 16,
    backgroundColor: "#0F1735",
    borderWidth: 1,
    borderColor: "rgba(139,148,200,0.25)",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
    paddingHorizontal: 10,
  },

  filterRow: {
    gap: 10,
    paddingBottom: 18,
  },

  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "rgba(15, 23, 53, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(139,148,200,0.22)",
  },

  filterPillActive: {
    backgroundColor: "rgba(76, 195, 255, 0.14)",
    borderColor: "rgba(76, 195, 255, 0.35)",
  },

  filterText: {
    color: "#AAB2CC",
    fontSize: 13,
    fontWeight: "800",
  },

  filterTextActive: {
    color: "#FFFFFF",
  },

  filterCount: {
    color: "#8A93B8",
    fontSize: 12,
    fontWeight: "900",
  },

  filterCountActive: {
    color: "#33D6FF",
  },

  list: {
    gap: 16,
  },

  resourceCard: {
    backgroundColor: "rgba(15, 23, 53, 0.96)",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(76, 195, 255, 0.14)",
    overflow: "hidden",
  },

  accentLineWrapper: {
    position: "absolute",
    top: 0,
    left: 18,
    right: 18,
    height: 3,
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
    overflow: "hidden",
  },

  accentLine: {
    height: "100%",
    width: "100%",
  },

  resourceTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  resourceIconBox: {
    width: 50,
    height: 50,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  typeBadge: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  typeBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  resourceTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 24,
    marginBottom: 8,
  },

  resourceDescription: {
    color: "#AAB2CC",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 14,
  },

  resourceMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  resourceDate: {
    color: "#8A93B8",
    fontSize: 12,
    fontWeight: "700",
  },

  fileTypePill: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(76, 195, 255, 0.1)",
  },

  fileTypeText: {
    color: "#33D6FF",
    fontSize: 11,
    fontWeight: "900",
  },

  viewButtonGradient: {
    borderRadius: 14,
    overflow: "hidden",
  },

  viewButton: {
    minHeight: 48,
    paddingVertical: 13,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  viewButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  emptyCard: {
    backgroundColor: "rgba(15, 23, 53, 0.95)",
    borderRadius: 22,
    padding: 26,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(76, 195, 255, 0.14)",
    marginTop: 8,
  },

  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 14,
  },

  emptyText: {
    color: "#AAB2CC",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 8,
  },

  errorIconBox: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "rgba(255, 107, 154, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },

  errorTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 8,
    textAlign: "center",
  },

  errorDescription: {
    color: "#AAB2CC",
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
    marginBottom: 22,
  },

  retryButton: {
    width: "100%",
    borderRadius: 999,
    backgroundColor: "#4CC3FF",
    paddingVertical: 15,
    alignItems: "center",
  },

  retryText: {
    color: "#050A1C",
    fontSize: 16,
    fontWeight: "900",
  },
});
