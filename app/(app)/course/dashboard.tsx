import { CourseDashboardSkeleton } from "@/components/skeletons/CourseDashboardSkeleton";
import { getCourseById } from "@/services/course.service";
import { getEnrolledCourses, getProfile } from "@/services/user.service";
import { Course } from "@/types/course";
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

import CourseSectionCard from "../../../components/course/CourseSectionCard";
import SECTION_CONFIG from "../../../constants/sectionConfig";

export default function CourseDashboardScreen() {
  const router = useRouter();

  const { id } = useLocalSearchParams<{
    id?: string | string[];
  }>();

  const courseId = Array.isArray(id) ? id[0] : id;

  /*
   * Load the authenticated user's profile.
   */
  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
  });

  /*
   * Load only the courses enrolled by the current user.
   */
  const {
    data: enrolledCourses = [],
    isLoading: enrolledCoursesLoading,
    isError: enrolledCoursesError,
    refetch: refetchEnrolledCourses,
  } = useQuery<Course[]>({
    queryKey: ["enrolled-courses", profile?.id],
    queryFn: () => getEnrolledCourses(profile!.id),
    enabled: !!profile?.id,
  });

  /*
   * Check whether the selected course belongs to the user.
   */
  const isCourseEnrolled = enrolledCourses.some(
    (enrolledCourse) => String(enrolledCourse.id) === String(courseId),
  );

  /*
   * Fetch course details only after enrollment is confirmed.
   */
  const {
    data: course,
    isLoading: courseLoading,
    isError: courseError,
    refetch: refetchCourse,
  } = useQuery<Course>({
    queryKey: ["enrolled-course-dashboard", courseId],
    queryFn: () => getCourseById(courseId!),
    enabled:
      !!courseId &&
      !!profile?.id &&
      !enrolledCoursesLoading &&
      isCourseEnrolled,
  });

  const availableSections = useMemo(() => {
    return (course?.sections || []).filter(
      (section: string) => SECTION_CONFIG[section],
    );
  }, [course?.sections]);

  const handleGoToMyCourses = () => {
    router.replace("/(app)/home");
  };

  const handleRetryProfile = () => {
    refetchProfile();
  };

  const handleRetryEnrollment = () => {
    refetchEnrolledCourses();
  };

  const handleRetryCourse = () => {
    refetchCourse();
  };

  const navigateToSection = (section: string) => {
    if (!courseId || !isCourseEnrolled) {
      return;
    }

    switch (section) {
      case "resources":
        router.push({
          pathname: "/(app)/course/resources",
          params: {
            id: String(courseId),
          },
        });
        break;

      case "videos":
        router.push({
          pathname: "/(app)/course/videos",
          params: {
            id: String(courseId),
          },
        });
        break;

      case "mock-test":
        router.push({
          pathname: "/(app)/course/test/[type]/[id]",
          params: {
            type: "mock",
            id: String(courseId),
          },
        });
        break;

      case "pyq-mock-test":
        router.push({
          pathname: "/(app)/course/pyq-tests",
          params: {
            id: String(courseId),
          },
        });
        break;

      case "live-test":
        router.push({
          pathname: "/(app)/course/live-tests",
          params: {
            id: String(courseId),
          },
        });
        break;

      default:
        console.warn(`Unknown course section: ${section}`);
        break;
    }
  };

  const isLoading =
    profileLoading ||
    enrolledCoursesLoading ||
    (isCourseEnrolled && courseLoading);

  if (isLoading) {
    return <CourseDashboardSkeleton />;
  }

  /*
   * Missing course ID.
   */
  if (!courseId) {
    return (
      <SafeAreaView style={styles.center} edges={["top", "bottom"]}>
        <StatusBar style="light" backgroundColor="#050A1C" />

        <View style={styles.errorIconBox}>
          <Ionicons name="alert-circle-outline" size={42} color="#FF6B9A" />
        </View>

        <Text style={styles.errorTitle}>Invalid course</Text>

        <Text style={styles.errorDescription}>
          The selected course could not be identified.
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.retryButton}
          onPress={handleGoToMyCourses}
        >
          <Text style={styles.retryText}>View My Courses</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  /*
   * Profile request failed.
   */
  if (profileError || !profile?.id) {
    return (
      <SafeAreaView style={styles.center} edges={["top", "bottom"]}>
        <StatusBar style="light" backgroundColor="#050A1C" />

        <View style={styles.errorIconBox}>
          <Ionicons name="person-circle-outline" size={44} color="#FF6B9A" />
        </View>

        <Text style={styles.errorTitle}>Profile unavailable</Text>

        <Text style={styles.errorDescription}>
          We couldn&apos;t verify your account. Please try again.
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.retryButton}
          onPress={handleRetryProfile}
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

  /*
   * Enrolled-course request failed.
   */
  if (enrolledCoursesError) {
    return (
      <SafeAreaView style={styles.center} edges={["top", "bottom"]}>
        <StatusBar style="light" backgroundColor="#050A1C" />

        <View style={styles.errorIconBox}>
          <Ionicons name="cloud-offline-outline" size={42} color="#FF6B9A" />
        </View>

        <Text style={styles.errorTitle}>Unable to verify enrollment</Text>

        <Text style={styles.errorDescription}>
          We couldn&apos;t load your enrolled courses. Check your connection and
          try again.
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.retryButton}
          onPress={handleRetryEnrollment}
        >
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.secondaryBackButton}
          onPress={handleGoToMyCourses}
        >
          <Text style={styles.secondaryBackText}>View My Courses</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  /*
   * Block access to courses that are not enrolled.
   */
  if (!isCourseEnrolled) {
    return (
      <SafeAreaView style={styles.center} edges={["top", "bottom"]}>
        <StatusBar style="light" backgroundColor="#050A1C" />

        <View style={styles.lockIconBox}>
          <Ionicons name="lock-closed-outline" size={40} color="#4CC3FF" />
        </View>

        <Text style={styles.errorTitle}>Course not enrolled</Text>

        <Text style={styles.errorDescription}>
          You can access this dashboard only for courses enrolled in your
          account.
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.retryButton}
          onPress={handleGoToMyCourses}
        >
          <Text style={styles.retryText}>View My Courses</Text>
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

  /*
   * Course-detail request failed.
   */
  if (courseError || !course) {
    return (
      <SafeAreaView style={styles.center} edges={["top", "bottom"]}>
        <StatusBar style="light" backgroundColor="#050A1C" />

        <View style={styles.errorIconBox}>
          <Ionicons name="alert-circle-outline" size={42} color="#FF6B9A" />
        </View>

        <Text style={styles.errorTitle}>Couldn&apos;t load course</Text>

        <Text style={styles.errorDescription}>
          Something went wrong while loading this course. Please try again.
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.retryButton}
          onPress={handleRetryCourse}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.secondaryBackButton}
          onPress={handleGoToMyCourses}
        >
          <Text style={styles.secondaryBackText}>View My Courses</Text>
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.8}
            hitSlop={10}
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Course Dashboard</Text>
            <Text style={styles.headerSubtitle}>Your enrolled course</Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>

        {/* Course Hero */}
        <LinearGradient
          colors={["#172554", "#312E81", "#581C87"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroDecorationOne} />
          <View style={styles.heroDecorationTwo} />

          <View style={styles.heroTopRow}>
            <View style={styles.heroIconBox}>
              <Ionicons name="school-outline" size={27} color="#FFFFFF" />
            </View>

            <View style={styles.heroBadge}>
              <View style={styles.enrolledDot} />

              <Text style={styles.heroBadgeText}>ENROLLED</Text>
            </View>
          </View>

          {!!course.category && (
            <Text style={styles.courseCategory}>{course.category}</Text>
          )}

          <Text style={styles.title}>{course.course_name}</Text>

          <Text style={styles.subtitle}>
            Continue your learning journey with videos, resources, mock tests,
            live tests and previous-year questions.
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
              <View style={styles.accessRow}>
                <View style={styles.accessDot} />
                <Text style={styles.statValue}>Active</Text>
              </View>

              <Text style={styles.statLabel}>Course Access</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Learning Sections */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>COURSE CONTENT</Text>

            <Text style={styles.sectionTitle}>Learning Sections</Text>

            <Text style={styles.sectionSubtitle}>
              Choose what you want to study next.
            </Text>
          </View>

          <View style={styles.sectionCountBadge}>
            <Text style={styles.sectionCountText}>
              {availableSections.length}
            </Text>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          {availableSections.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconBox}>
                <Ionicons
                  name="folder-open-outline"
                  size={39}
                  color="#4CC3FF"
                />
              </View>

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

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.backToCoursesButton}
          onPress={handleGoToMyCourses}
        >
          <Ionicons name="library-outline" size={21} color="#4CC3FF" />

          <View style={styles.backToCoursesContent}>
            <Text style={styles.backToCoursesTitle}>My Courses</Text>

            <Text style={styles.backToCoursesSubtitle}>
              Return to your enrolled courses
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={21} color="#8290AF" />
        </TouchableOpacity>
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
    paddingBottom: 48,
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
    backgroundColor: "rgba(124,58,237,0.18)",
  },

  glowCenter: {
    position: "absolute",
    top: 230,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 240,
    backgroundColor: "rgba(255,63,167,0.11)",
  },

  glowBottomRight: {
    position: "absolute",
    bottom: -120,
    right: -120,
    width: 320,
    height: 320,
    borderRadius: 320,
    backgroundColor: "rgba(51,214,255,0.12)",
  },

  header: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: "rgba(22,35,74,0.9)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  headerTextContainer: {
    flex: 1,
    alignItems: "center",
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  headerSubtitle: {
    color: "#7F8AA5",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 3,
  },

  headerSpacer: {
    width: 44,
  },

  hero: {
    borderRadius: 27,
    padding: 22,
    marginBottom: 32,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(76,195,255,0.14)",
    shadowColor: "#33D6FF",
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 8,
  },

  heroDecorationOne: {
    position: "absolute",
    top: -65,
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
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  heroIconBox: {
    width: 55,
    height: 55,
    borderRadius: 18,
    backgroundColor: "rgba(76,195,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(76,195,255,0.28)",
  },

  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(34,197,94,0.12)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.25)",
  },

  enrolledDot: {
    width: 7,
    height: 7,
    borderRadius: 7,
    marginRight: 7,
    backgroundColor: "#22C55E",
  },

  heroBadgeText: {
    color: "#BBF7D0",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.7,
  },

  courseCategory: {
    color: "#67E8F9",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 29,
    fontWeight: "900",
    lineHeight: 37,
    letterSpacing: -0.5,
  },

  subtitle: {
    marginTop: 13,
    color: "#C7D2FE",
    fontSize: 14,
    lineHeight: 23,
  },

  statsRow: {
    marginTop: 22,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(5,10,28,0.45)",
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
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
  },

  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: "rgba(255,255,255,0.12)",
  },

  accessRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  accessDot: {
    width: 7,
    height: 7,
    borderRadius: 7,
    marginRight: 7,
    backgroundColor: "#22C55E",
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 18,
  },

  sectionEyebrow: {
    color: "#4CC3FF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.3,
    marginTop: 5,
  },

  sectionSubtitle: {
    color: "#AAB2CC",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 5,
  },

  sectionCountBadge: {
    minWidth: 34,
    height: 34,
    borderRadius: 12,
    paddingHorizontal: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(76,195,255,0.13)",
  },

  sectionCountText: {
    color: "#4CC3FF",
    fontSize: 13,
    fontWeight: "900",
  },

  sectionContainer: {
    gap: 16,
  },

  emptyCard: {
    minHeight: 235,
    backgroundColor: "#0F1735",
    borderRadius: 22,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(76,195,255,0.14)",
  },

  emptyIconBox: {
    width: 70,
    height: 70,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(76,195,255,0.1)",
  },

  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 16,
  },

  emptyText: {
    color: "#AAB2CC",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 8,
  },

  backToCoursesButton: {
    minHeight: 76,
    borderRadius: 20,
    paddingHorizontal: 16,
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(76,195,255,0.14)",
    backgroundColor: "rgba(15,23,53,0.92)",
  },

  backToCoursesContent: {
    flex: 1,
    marginLeft: 13,
  },

  backToCoursesTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  backToCoursesSubtitle: {
    color: "#8995AF",
    fontSize: 11,
    marginTop: 4,
  },

  errorIconBox: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "rgba(255,107,154,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },

  lockIconBox: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "rgba(76,195,255,0.12)",
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
