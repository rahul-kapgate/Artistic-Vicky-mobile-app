import { HomeScreenSkeleton } from "@/components/skeletons/HomeScreenSkeleton";
import { getEnrolledCourses, getProfile } from "@/services/user.service";
import { Course } from "@/types/course";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const router = useRouter();

  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
  });

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

  const handleRetry = async () => {
    await refetchProfile();

    if (profile?.id) {
      await refetchEnrolledCourses();
    }
  };

  const handleContinueCourse = (courseId: Course["id"]) => {
    router.push({
      pathname: "/(app)/course/dashboard",
      params: {
        id: String(courseId),
      },
    });
  };

  if (profileLoading) {
    return <HomeScreenSkeleton />;
  }

  if (profileError) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <StatusBar style="light" />

        <Text style={styles.errorTitle}>Something went wrong</Text>

        <Text style={styles.errorDescription}>
          We could not load your profile.
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.retryButton}
          onPress={handleRetry}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.glowTopRight} />
      <View style={styles.glowCenterLeft} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.greeting}>Welcome Back 👋</Text>

            <Text numberOfLines={1} style={styles.name}>
              {profile?.user_name || "Student"}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.avatar}
            onPress={() => router.push("/(app)/profile")}
          >
            <Text style={styles.avatarText}>
              {profile?.user_name?.[0]?.toUpperCase() || "S"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Hero */}
        <LinearGradient
          colors={["#172554", "#312E81", "#581C87"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroContent}>
            <Text style={styles.heroEyebrow}>YOUR LEARNING SPACE</Text>

            <Text style={styles.heroTitle}>
              Continue building your artistic skills.
            </Text>

            <Text style={styles.heroDescription}>
              Access your enrolled courses, continue your lessons and keep
              moving towards your goal.
            </Text>
          </View>

          <View style={styles.heroIconContainer}>
            <Text style={styles.heroIcon}>🎨</Text>
          </View>
        </LinearGradient>

        {/* My Courses */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>ENROLLED COURSES</Text>
            <Text style={styles.sectionTitle}>My Courses</Text>
          </View>

          {!enrolledCoursesLoading && enrolledCourses.length > 0 && (
            <View style={styles.courseCountBadge}>
              <Text style={styles.courseCountText}>
                {enrolledCourses.length}
              </Text>
            </View>
          )}
        </View>

        {enrolledCoursesLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CC3FF" />

            <Text style={styles.loadingText}>
              Loading your enrolled courses...
            </Text>
          </View>
        ) : enrolledCoursesError ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorIcon}>!</Text>

            <Text style={styles.errorCardTitle}>
              Unable to load your courses
            </Text>

            <Text style={styles.errorCardDescription}>
              Please check your connection and try again.
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.retryButton}
              onPress={() => refetchEnrolledCourses()}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : enrolledCourses.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconContainer}>
              <Text style={styles.emptyIcon}>📚</Text>
            </View>

            <Text style={styles.emptyTitle}>No enrolled courses yet</Text>

            <Text style={styles.emptyDescription}>
              Explore the available courses and enrol in the right course for
              your artistic journey.
            </Text>

            <LinearGradient
              colors={["#FF3FA7", "#A855F7", "#33D6FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.exploreGradient}
            >
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.exploreButton}
                onPress={() => router.push("/courses")}
              >
                <Text style={styles.exploreButtonText}>Explore Courses</Text>
                <Text style={styles.exploreButtonArrow}>→</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        ) : (
          <View style={styles.courseList}>
            {enrolledCourses.map((course) => (
              <View key={course.id} style={styles.courseCard}>
                {!!course.image && (
                  <View style={styles.courseImageContainer}>
                    <Image
                      source={{ uri: course.image }}
                      style={styles.courseImage}
                      resizeMode="cover"
                    />

                    <View style={styles.courseImageOverlay} />

                    <View style={styles.enrolledBadge}>
                      <View style={styles.enrolledDot} />
                      <Text style={styles.enrolledBadgeText}>ENROLLED</Text>
                    </View>
                  </View>
                )}

                <View style={styles.courseContent}>
                  {!!course.category && (
                    <Text style={styles.courseCategory}>{course.category}</Text>
                  )}

                  <Text numberOfLines={2} style={styles.courseTitle}>
                    {course.course_name}
                  </Text>

                  {!!course.description && (
                    <Text numberOfLines={2} style={styles.courseDescription}>
                      {course.description}
                    </Text>
                  )}

                  <View style={styles.courseMetaRow}>
                    {!!course.duration && (
                      <View style={styles.metaBadge}>
                        <Text style={styles.metaIcon}>⏱</Text>
                        <Text style={styles.metaText}>{course.duration}</Text>
                      </View>
                    )}

                    {!!course.language && (
                      <View style={styles.metaBadge}>
                        <Text style={styles.metaIcon}>🌐</Text>
                        <Text style={styles.metaText}>{course.language}</Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.continueButton}
                    onPress={() => handleContinueCourse(course.id)}
                  >
                    <Text style={styles.continueButtonText}>
                      Continue Learning
                    </Text>

                    <View style={styles.continueArrowContainer}>
                      <Text style={styles.continueArrow}>→</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050A1C",
  },

  centerContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#050A1C",
  },

  glowTopRight: {
    position: "absolute",
    top: -100,
    right: -120,
    width: 300,
    height: 300,
    borderRadius: 300,
    backgroundColor: "rgba(76, 195, 255, 0.1)",
  },

  glowCenterLeft: {
    position: "absolute",
    top: 420,
    left: -130,
    width: 280,
    height: 280,
    borderRadius: 280,
    backgroundColor: "rgba(168, 85, 247, 0.1)",
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 90,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },

  headerTextContainer: {
    flex: 1,
    paddingRight: 16,
  },

  greeting: {
    color: "#AAB2CC",
    fontSize: 14,
    fontWeight: "500",
  },

  name: {
    color: "#FFFFFF",
    fontSize: 29,
    fontWeight: "900",
    marginTop: 5,
  },

  avatar: {
    width: 54,
    height: 54,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(76,195,255,0.35)",
    backgroundColor: "rgba(76,195,255,0.15)",
  },

  avatarText: {
    color: "#4CC3FF",
    fontSize: 21,
    fontWeight: "900",
  },

  heroCard: {
    minHeight: 190,
    borderRadius: 26,
    padding: 21,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  heroContent: {
    flex: 1,
    paddingRight: 12,
  },

  heroEyebrow: {
    color: "#93C5FD",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 23,
    lineHeight: 30,
    fontWeight: "900",
    marginTop: 9,
  },

  heroDescription: {
    color: "#C1CAE0",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 9,
  },

  heroIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
  },

  heroIcon: {
    fontSize: 37,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 38,
    marginBottom: 18,
  },

  sectionEyebrow: {
    color: "#4CC3FF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.3,
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "900",
    marginTop: 5,
  },

  courseCountBadge: {
    minWidth: 34,
    height: 34,
    borderRadius: 12,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(76,195,255,0.13)",
  },

  courseCountText: {
    color: "#4CC3FF",
    fontSize: 13,
    fontWeight: "900",
  },

  loadingContainer: {
    minHeight: 250,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: "#909BB4",
    fontSize: 13,
    marginTop: 14,
  },

  courseList: {
    gap: 20,
  },

  courseCard: {
    overflow: "hidden",
    borderRadius: 23,
    borderWidth: 1,
    borderColor: "rgba(76,195,255,0.15)",
    backgroundColor: "#0F1735",
  },

  courseImageContainer: {
    width: "100%",
    height: 190,
    backgroundColor: "#111A38",
  },

  courseImage: {
    width: "100%",
    height: "100%",
  },

  courseImageOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 75,
    backgroundColor: "rgba(5,10,28,0.25)",
  },

  enrolledBadge: {
    position: "absolute",
    top: 13,
    left: 13,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(5,10,28,0.82)",
  },

  enrolledDot: {
    width: 7,
    height: 7,
    borderRadius: 7,
    marginRight: 7,
    backgroundColor: "#22C55E",
  },

  enrolledBadgeText: {
    color: "#BBF7D0",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.7,
  },

  courseContent: {
    padding: 18,
  },

  courseCategory: {
    color: "#4CC3FF",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  courseTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    lineHeight: 27,
    fontWeight: "900",
    marginTop: 7,
  },

  courseDescription: {
    color: "#929DB7",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 9,
  },

  courseMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginTop: 16,
  },

  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.055)",
  },

  metaIcon: {
    fontSize: 12,
    marginRight: 6,
  },

  metaText: {
    color: "#B6C0D6",
    fontSize: 11,
    fontWeight: "600",
  },

  continueButton: {
    minHeight: 54,
    marginTop: 20,
    borderRadius: 16,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563EB",
  },

  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  continueArrowContainer: {
    position: "absolute",
    right: 11,
    width: 33,
    height: 33,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
  },

  continueArrow: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "800",
  },

  emptyCard: {
    minHeight: 310,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    backgroundColor: "rgba(15,23,53,0.8)",
  },

  emptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(76,195,255,0.1)",
  },

  emptyIcon: {
    fontSize: 35,
  },

  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 18,
  },

  emptyDescription: {
    color: "#929DB7",
    textAlign: "center",
    fontSize: 13,
    lineHeight: 21,
    marginTop: 9,
  },

  exploreGradient: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 22,
  },

  exploreButton: {
    minHeight: 52,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  exploreButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  exploreButtonArrow: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "800",
    marginLeft: 9,
  },

  errorTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "900",
  },

  errorDescription: {
    color: "#9CA7BE",
    textAlign: "center",
    fontSize: 13,
    marginTop: 9,
  },

  errorCard: {
    minHeight: 250,
    borderRadius: 23,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.18)",
    backgroundColor: "rgba(127,29,29,0.12)",
  },

  errorIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "900",
    textAlign: "center",
    lineHeight: 48,
    backgroundColor: "#EF4444",
  },

  errorCardTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 15,
  },

  errorCardDescription: {
    color: "#A9B2C5",
    textAlign: "center",
    fontSize: 13,
    marginTop: 8,
  },

  retryButton: {
    minWidth: 125,
    minHeight: 46,
    borderRadius: 14,
    marginTop: 18,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4CC3FF",
  },

  retryButtonText: {
    color: "#050A1C",
    fontSize: 13,
    fontWeight: "900",
  },
});
