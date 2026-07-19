import { getCourseById } from "@/services/course.service";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CourseDashboardSkeleton } from "@/components/skeletons/CourseDashboardSkeleton";
import CourseSectionCard from "../../../components/course/CourseSectionCard";
import SECTION_CONFIG from "../../../constants/sectionConfig";

export default function CourseDashboardScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();

  const courseId = Array.isArray(id) ? id[0] : id;

  const {
    data: course,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["course-dashboard", courseId],
    queryFn: () => getCourseById(courseId!),
    enabled: !!courseId,
  });

  const availableSections = useMemo(() => {
    return (course?.sections || []).filter(
      (section: string) => SECTION_CONFIG[section],
    );
  }, [course?.sections]);

  const navigateToSection = (section: string) => {
    if (!courseId) return;

    switch (section) {
      case "resources":
        router.push({
          pathname: "/(app)/course/resources",
        });
        break;

      case "videos":
        router.push({
          pathname: "/(app)/course/videos",
          params: {
            id: courseId,
          },
        });
        break;

      case "mock-test":
        router.push({
          pathname: "/(app)/course/test/[type]/[id]",
          params: {
            type: "mock",
            id: courseId,
          },
        });
        break;

      case "pyq-mock-test":
        router.push({
          pathname: "/(app)/course/pyq-tests",
          params: {
            id: courseId,
          },
        });
        break;

      case "live-test":
        router.push("/(app)/course/live-tests");
        break;

      default:
        console.warn(`Unknown course section: ${section}`);
        break;
    }
  };

  if (isLoading) {
    return <CourseDashboardSkeleton />;
  }

  if (isError || !course || !courseId) {
    return (
      <SafeAreaView style={styles.center} edges={["top", "bottom"]}>
        <StatusBar style="light" backgroundColor="#050A1C" />

        <View style={styles.errorIconBox}>
          <Ionicons name="alert-circle-outline" size={42} color="#FF6B9A" />
        </View>

        <Text style={styles.errorTitle}>Couldn’t load course</Text>

        <Text style={styles.errorDescription}>
          Something went wrong while loading this course. Please try again.
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.retryButton}
          onPress={() => refetch()}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.secondaryBackButton}
          onPress={() => router.back()}
        >
          <Text style={styles.secondaryBackText}>Go Back</Text>
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
            activeOpacity={0.8}
            hitSlop={10}
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Course Dashboard</Text>

          <View style={styles.headerSpacer} />
        </View>

        <LinearGradient
          colors={["#172554", "#111B45", "#080E28"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroTopRow}>
            <View style={styles.heroIconBox}>
              <Ionicons name="school-outline" size={26} color="#FFFFFF" />
            </View>

            <View style={styles.heroBadge}>
              <Ionicons name="sparkles-outline" size={14} color="#33D6FF" />
              <Text style={styles.heroBadgeText}>Enrolled</Text>
            </View>
          </View>

          <Text style={styles.title}>{course.course_name}</Text>

          <Text style={styles.subtitle}>
            Continue your learning journey with videos, resources, mock tests,
            live tests and PYQs.
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{availableSections.length}</Text>
              <Text style={styles.statLabel}>
                {availableSections.length === 1 ? "Section" : "Sections"}
              </Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statCard}>
              <Text style={styles.statValue}>Active</Text>
              <Text style={styles.statLabel}>Access</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Learning Sections</Text>
            <Text style={styles.sectionSubtitle}>
              Choose what you want to study next.
            </Text>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          {availableSections.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="folder-open-outline" size={42} color="#4CC3FF" />

              <Text style={styles.emptyTitle}>No sections available</Text>

              <Text style={styles.emptyText}>
                Course content will appear here once sections are added.
              </Text>
            </View>
          ) : (
            availableSections.map((section: string) => {
              const config = SECTION_CONFIG[section];

              return (
                <CourseSectionCard
                  key={section}
                  title={config.title}
                  subtitle={config.subtitle}
                  icon={config.icon}
                  iconName={config.iconName}
                  colors={config.colors}
                  onPress={() => navigateToSection(section)}
                />
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
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
    justifyContent: "center",
    alignItems: "center",
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
    top: 230,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 240,
    backgroundColor: "rgba(255, 63, 167, 0.11)",
  },

  glowBottomRight: {
    position: "absolute",
    bottom: -120,
    right: -120,
    width: 320,
    height: 320,
    borderRadius: 320,
    backgroundColor: "rgba(51, 214, 255, 0.12)",
  },

  loadingText: {
    color: "#AAB2CC",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 14,
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
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  headerSpacer: {
    width: 46,
  },

  hero: {
    borderRadius: 26,
    padding: 22,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: "rgba(76, 195, 255, 0.14)",
    shadowColor: "#33D6FF",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 8,
  },

  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  heroIconBox: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "rgba(76, 195, 255, 0.18)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(76, 195, 255, 0.28)",
  },

  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(51, 214, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(51, 214, 255, 0.2)",
  },

  heroBadgeText: {
    color: "#33D6FF",
    fontSize: 12,
    fontWeight: "800",
  },

  title: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 38,
    letterSpacing: -0.5,
  },

  subtitle: {
    marginTop: 14,
    color: "#C7D2FE",
    fontSize: 15,
    lineHeight: 24,
  },

  statsRow: {
    marginTop: 22,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(5, 10, 28, 0.45)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    flexDirection: "row",
    alignItems: "center",
  },

  statCard: {
    flex: 1,
    alignItems: "center",
  },

  statValue: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },

  statLabel: {
    color: "#AAB2CC",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },

  statDivider: {
    width: 1,
    height: 34,
    backgroundColor: "rgba(255,255,255,0.12)",
  },

  sectionHeader: {
    marginBottom: 16,
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.3,
  },

  sectionSubtitle: {
    color: "#AAB2CC",
    fontSize: 14,
    fontWeight: "500",
    marginTop: 5,
  },

  sectionContainer: {
    gap: 16,
  },

  emptyCard: {
    backgroundColor: "#0F1735",
    borderRadius: 22,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(76, 195, 255, 0.14)",
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

  secondaryBackButton: {
    marginTop: 14,
    paddingVertical: 12,
  },

  secondaryBackText: {
    color: "#33D6FF",
    fontSize: 15,
    fontWeight: "800",
  },
});
