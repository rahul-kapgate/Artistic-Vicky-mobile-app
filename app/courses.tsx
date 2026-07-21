import { getAllCourses } from "@/services/course.service";
import { useAuthStore } from "@/store/authStore";
import { Course } from "@/types/course";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
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

function CourseCard({
  course,
  onPress,
}: {
  course: Course;
  onPress: () => void;
}) {
  const router = useRouter();
  const [imageFailed, setImageFailed] = useState(false);

  const hasDiscount =
    Number(course.price_without_discount) > Number(course.price);

  const handleOpenCourse = (courseId: string | number) => {
    router.push({
      pathname: "/course/[id]",
      params: {
        id: String(courseId),
      },
    });
  };

  return (
    <View style={styles.courseCard}>
      <View style={styles.courseImageContainer}>
        {!imageFailed && course.image ? (
          <Image
            source={{ uri: course.image }}
            style={styles.courseImage}
            resizeMode="cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <LinearGradient
            colors={["#1E3A8A", "#6D28D9", "#BE185D"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.imagePlaceholder}
          >
            <Text style={styles.imagePlaceholderIcon}>🎨</Text>
            <Text style={styles.imagePlaceholderText}>AV Art Academy</Text>
          </LinearGradient>
        )}

        <View style={styles.imageOverlay} />

        <View style={styles.courseTypeBadge}>
          <Text style={styles.courseTypeText}>
            {course.course_type === "masterclass"
              ? "MASTERCLASS"
              : "ONLINE COURSE"}
          </Text>
        </View>

        {!!course.rating && (
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>★ {course.rating}</Text>
          </View>
        )}
      </View>

      <View style={styles.courseContent}>
        {!!course.category && (
          <Text style={styles.courseCategory}>{course.category}</Text>
        )}

        <Text style={styles.courseTitle}>{course.course_name}</Text>

        {!!course.description && (
          <Text style={styles.courseDescription} numberOfLines={3}>
            {course.description}
          </Text>
        )}

        <View style={styles.metaRow}>
          {!!course.duration && (
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>⏱</Text>
              <Text style={styles.metaText}>{course.duration}</Text>
            </View>
          )}

          {!!course.language && (
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>🌐</Text>
              <Text style={styles.metaText}>{course.language}</Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.bottomRow}>
          <View>
            <Text style={styles.priceLabel}>Course fee</Text>

            <View style={styles.priceRow}>
              {hasDiscount && (
                <Text style={styles.oldPrice}>
                  ₹{course.price_without_discount}
                </Text>
              )}

              <Text style={styles.price}>₹{course.price}</Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.viewButton}
            onPress={() => handleOpenCourse(course.id)}
          >
            <Text style={styles.viewButtonText}>View Course</Text>
            <Text style={styles.viewButtonArrow}>→</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function CoursesScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const {
    data: courses = [],
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery<Course[]>({
    queryKey: ["public-courses"],
    queryFn: getAllCourses,
  });

  const handleOpenCourse = (course: Course) => {
    router.push({
      pathname: "/course/[id]",
      params: {
        id: String(course.id),
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar style="light" />

      <LinearGradient
        colors={["#050A1C", "#07112B", "#100922"]}
        style={styles.container}
      >
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Explore Courses</Text>
            <Text style={styles.headerSubtitle}>AV Art Academy</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.accountButton}
            onPress={() =>
              isAuthenticated
                ? router.push("/(app)/home")
                : router.push("/(auth)/login")
            }
          >
            <Text style={styles.accountButtonText}>
              {isAuthenticated ? "Home" : "Login"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Page introduction */}
          <View style={styles.introSection}>
            <View style={styles.introBadge}>
              <Text style={styles.introBadgeText}>MAH AAC CET PREPARATION</Text>
            </View>

            <Text style={styles.introTitle}>
              Find the course that matches your{" "}
              <Text style={styles.introTitleAccent}>artistic goal.</Text>
            </Text>

            <Text style={styles.introDescription}>
              Explore structured courses designed to improve drawing,
              visualisation, aptitude and exam performance.
            </Text>
          </View>

          {/* Benefits */}
          <View style={styles.benefitsRow}>
            <View style={styles.benefitCard}>
              <Text style={styles.benefitIcon}>🎥</Text>
              <Text style={styles.benefitTitle}>Video Lessons</Text>
            </View>

            <View style={styles.benefitCard}>
              <Text style={styles.benefitIcon}>📝</Text>
              <Text style={styles.benefitTitle}>Mock Tests</Text>
            </View>

            <View style={styles.benefitCard}>
              <Text style={styles.benefitIcon}>🎯</Text>
              <Text style={styles.benefitTitle}>Exam Focused</Text>
            </View>
          </View>

          <View style={styles.courseSectionHeader}>
            <View>
              <Text style={styles.courseSectionEyebrow}>AVAILABLE COURSES</Text>

              <Text style={styles.courseSectionTitle}>
                Start learning today
              </Text>
            </View>

            {!isLoading && !isError && (
              <View style={styles.courseCountBadge}>
                <Text style={styles.courseCountText}>{courses.length}</Text>
              </View>
            )}
          </View>

          {/* Loading */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#60A5FA" />

              <Text style={styles.loadingText}>
                Loading available courses...
              </Text>
            </View>
          ) : isError ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorIcon}>!</Text>

              <Text style={styles.errorTitle}>Unable to load courses</Text>

              <Text style={styles.errorDescription}>
                Please check your connection and try again.
              </Text>

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.retryButton}
                disabled={isRefetching}
                onPress={() => refetch()}
              >
                {isRefetching ? (
                  <ActivityIndicator color="#050A1C" />
                ) : (
                  <Text style={styles.retryButtonText}>Try Again</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : courses.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🎨</Text>
              <Text style={styles.emptyTitle}>No courses available</Text>
              <Text style={styles.emptyDescription}>
                New courses will appear here soon.
              </Text>
            </View>
          ) : (
            <View style={styles.courseList}>
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onPress={() => handleOpenCourse(course)}
                />
              ))}
            </View>
          )}

          {!isAuthenticated && courses.length > 0 && (
            <LinearGradient
              colors={["rgba(41,55,115,0.86)", "rgba(69,35,117,0.88)"]}
              style={styles.signupCard}
            >
              <Text style={styles.signupCardIcon}>✨</Text>

              <Text style={styles.signupCardTitle}>
                Ready to begin learning?
              </Text>

              <Text style={styles.signupCardDescription}>
                Create your account to enrol in courses, watch lessons and track
                your progress.
              </Text>

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.signupCardButton}
                onPress={() => router.push("/(auth)/signup")}
              >
                <Text style={styles.signupCardButtonText}>
                  Create Free Account
                </Text>
                <Text style={styles.signupCardArrow}>→</Text>
              </TouchableOpacity>
            </LinearGradient>
          )}

          <Text style={styles.footerText}>
            Learn art. Build confidence. Achieve your goal.
          </Text>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#050A1C",
  },

  container: {
    flex: 1,
  },

  glowTop: {
    position: "absolute",
    top: -130,
    right: -120,
    width: 300,
    height: 300,
    borderRadius: 300,
    backgroundColor: "rgba(59,130,246,0.16)",
  },

  glowBottom: {
    position: "absolute",
    bottom: -150,
    left: -150,
    width: 360,
    height: 360,
    borderRadius: 360,
    backgroundColor: "rgba(168,85,247,0.14)",
  },

  header: {
    minHeight: 70,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
    backgroundColor: "rgba(5,10,28,0.75)",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  backButtonText: {
    color: "#FFFFFF",
    fontSize: 32,
    lineHeight: 34,
    marginTop: -3,
  },

  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  headerSubtitle: {
    color: "#7F8CA9",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 3,
  },

  accountButton: {
    minWidth: 58,
    height: 40,
    paddingHorizontal: 13,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.22)",
    backgroundColor: "rgba(37,99,235,0.13)",
  },

  accountButtonText: {
    color: "#BFD8FF",
    fontSize: 12,
    fontWeight: "800",
  },

  content: {
    paddingHorizontal: 18,
    paddingBottom: 36,
  },

  introSection: {
    paddingTop: 42,
    alignItems: "center",
  },

  introBadge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.22)",
    backgroundColor: "rgba(30,64,175,0.16)",
  },

  introBadgeText: {
    color: "#93C5FD",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },

  introTitle: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 34,
    lineHeight: 42,
    fontWeight: "900",
    letterSpacing: -0.9,
    marginTop: 18,
  },

  introTitleAccent: {
    color: "#60A5FA",
  },

  introDescription: {
    color: "#A3ADC4",
    textAlign: "center",
    fontSize: 14,
    lineHeight: 23,
    marginTop: 14,
    paddingHorizontal: 6,
  },

  benefitsRow: {
    flexDirection: "row",
    gap: 9,
    marginTop: 30,
  },

  benefitCard: {
    flex: 1,
    minHeight: 86,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 7,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  benefitIcon: {
    fontSize: 21,
  },

  benefitTitle: {
    color: "#DCE4F4",
    textAlign: "center",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 8,
  },

  courseSectionHeader: {
    marginTop: 46,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  courseSectionEyebrow: {
    color: "#60A5FA",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },

  courseSectionTitle: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "900",
    marginTop: 6,
  },

  courseCountBadge: {
    minWidth: 34,
    height: 34,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(96,165,250,0.14)",
  },

  courseCountText: {
    color: "#93C5FD",
    fontSize: 13,
    fontWeight: "900",
  },

  loadingContainer: {
    minHeight: 240,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: "#8995B0",
    fontSize: 13,
    marginTop: 15,
  },

  courseList: {
    gap: 20,
  },

  courseCard: {
    overflow: "hidden",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    backgroundColor: "#0D1633",
  },

  courseImageContainer: {
    height: 195,
    backgroundColor: "#101A38",
  },

  courseImage: {
    width: "100%",
    height: "100%",
  },

  imagePlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  imagePlaceholderIcon: {
    fontSize: 43,
  },

  imagePlaceholderText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 10,
  },

  imageOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
    backgroundColor: "rgba(5,10,28,0.25)",
  },

  courseTypeBadge: {
    position: "absolute",
    top: 13,
    left: 13,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(5,10,28,0.78)",
  },

  courseTypeText: {
    color: "#DDE7FA",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.7,
  },

  ratingBadge: {
    position: "absolute",
    top: 13,
    right: 13,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(5,10,28,0.78)",
  },

  ratingText: {
    color: "#FACC15",
    fontSize: 11,
    fontWeight: "800",
  },

  courseContent: {
    padding: 18,
  },

  courseCategory: {
    color: "#60A5FA",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  courseTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    lineHeight: 28,
    fontWeight: "900",
    marginTop: 7,
  },

  courseDescription: {
    color: "#96A1BA",
    fontSize: 13,
    lineHeight: 21,
    marginTop: 10,
  },

  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginTop: 16,
  },

  metaItem: {
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
    color: "#B2BDD3",
    fontSize: 11,
    fontWeight: "600",
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.075)",
    marginVertical: 18,
  },

  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  priceLabel: {
    color: "#7F8AA5",
    fontSize: 10,
    fontWeight: "600",
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  oldPrice: {
    color: "#77819A",
    fontSize: 12,
    textDecorationLine: "line-through",
    marginRight: 7,
  },

  price: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "900",
  },

  viewButton: {
    minHeight: 45,
    paddingHorizontal: 16,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563EB",
  },

  viewButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  viewButtonArrow: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    marginLeft: 7,
  },

  errorCard: {
    borderRadius: 23,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.2)",
    backgroundColor: "rgba(127,29,29,0.12)",
  },

  errorIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "900",
    textAlign: "center",
    lineHeight: 48,
    backgroundColor: "#EF4444",
  },

  errorTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 16,
  },

  errorDescription: {
    color: "#A8B1C5",
    textAlign: "center",
    fontSize: 13,
    marginTop: 8,
  },

  retryButton: {
    minWidth: 130,
    minHeight: 45,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    backgroundColor: "#FFFFFF",
  },

  retryButtonText: {
    color: "#050A1C",
    fontSize: 13,
    fontWeight: "900",
  },

  emptyCard: {
    minHeight: 220,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  emptyIcon: {
    fontSize: 42,
  },

  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 13,
  },

  emptyDescription: {
    color: "#8994AD",
    fontSize: 13,
    marginTop: 7,
  },

  signupCard: {
    marginTop: 28,
    borderRadius: 24,
    padding: 23,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  signupCardIcon: {
    fontSize: 28,
  },

  signupCardTitle: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 21,
    fontWeight: "900",
    marginTop: 12,
  },

  signupCardDescription: {
    color: "#A5AEC3",
    textAlign: "center",
    fontSize: 13,
    lineHeight: 21,
    marginTop: 9,
  },

  signupCardButton: {
    minHeight: 48,
    marginTop: 19,
    paddingHorizontal: 20,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  signupCardButtonText: {
    color: "#11152E",
    fontSize: 13,
    fontWeight: "900",
  },

  signupCardArrow: {
    color: "#11152E",
    fontSize: 18,
    marginLeft: 8,
  },

  footerText: {
    color: "#77839E",
    textAlign: "center",
    fontSize: 11,
    marginTop: 32,
  },
});
