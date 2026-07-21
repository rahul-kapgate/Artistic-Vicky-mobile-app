import CourseReviews from "@/components/course/CourseReviews";
import MentorCard from "@/components/course/MentorCard";
import { TestListSkeleton } from "@/components/skeletons/TestListSkeleton";
import { getCourseById } from "@/services/course.service";
import { Course } from "@/types/course";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 56) / 2;

export default function CourseDetailScreen() {
  const router = useRouter();

  const { id } = useLocalSearchParams<{
    id?: string | string[];
  }>();

  const courseId = Array.isArray(id) ? id[0] : id;

  /*
   * Fetch course details only after enrollment has been confirmed.
   */
  const {
    data: course,
    isLoading: courseLoading,
    isError: courseError,
    refetch: refetchCourse,
  } = useQuery<Course>({
    queryKey: ["public-course-detail", courseId],
    queryFn: () => getCourseById(courseId!),
    enabled: !!courseId,
  });

  const handleContinueLearning = () => {
    if (!courseId) {
      return;
    }

    router.push({
      pathname: "/(app)/course/dashboard",
      params: {
        id: String(courseId),
      },
    });
  };

  const handleGoToMyCourses = () => {
    router.replace("/(app)/home");
  };

  const isLoading = courseLoading;

  if (isLoading) {
    return <TestListSkeleton grouped cardCount={6} />;
  }

  /*
   * Invalid or missing route parameter.
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
          <Text style={styles.retryText}>Go to My Courses</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  /*
   * Course detail request failed.
   */
  if (courseError || !course) {
    return (
      <SafeAreaView style={styles.center} edges={["top", "bottom"]}>
        <StatusBar style="light" backgroundColor="#050A1C" />

        <View style={styles.errorIconBox}>
          <Ionicons name="alert-circle-outline" size={42} color="#FF6B9A" />
        </View>

        <Text style={styles.errorTitle}>Course not found</Text>

        <Text style={styles.errorDescription}>
          We couldn&apos;t load this course. Please try again.
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.retryButton}
          onPress={() => refetchCourse()}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.backTextButton}
          onPress={handleGoToMyCourses}
        >
          <Text style={styles.backText}>View My Courses</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const courseType =
    course.course_type === "masterclass"
      ? "Masterclass"
      : course.course_type === "regular"
        ? "Regular Course"
        : "Online";

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar style="light" backgroundColor="#050A1C" />

      <View style={styles.glowTopLeft} />
      <View style={styles.glowCenter} />
      <View style={styles.glowBottomRight} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Course hero */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: course.image }}
            style={styles.heroImage}
            resizeMode="cover"
          />

          <LinearGradient
            colors={["rgba(5,10,28,0.18)", "rgba(5,10,28,0.45)", "#050A1C"]}
            style={styles.overlay}
          />

          <View style={styles.heroHeader}>
            <TouchableOpacity
              activeOpacity={0.85}
              hitSlop={10}
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.enrolledBadge}>
              <View style={styles.enrolledDot} />

              <Text style={styles.enrolledBadgeText}>ENROLLED</Text>
            </View>
          </View>

          <View style={styles.titleContainer}>
            {!!course.category && (
              <View style={styles.categoryPill}>
                <MaterialCommunityIcons
                  name="shape-outline"
                  size={15}
                  color="#33D6FF"
                />

                <Text style={styles.categoryPillText}>{course.category}</Text>
              </View>
            )}

            <Text style={styles.title}>{course.course_name}</Text>

            <Text style={styles.heroSubtitle}>
              Continue learning with structured content, expert guidance and
              practice-based preparation.
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* Course information */}
          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <View style={styles.infoIconBox}>
                <Ionicons name="time-outline" size={23} color="#4CC3FF" />
              </View>

              <Text style={styles.infoLabel}>Duration</Text>

              <Text numberOfLines={2} style={styles.infoValue}>
                {course.duration || "N/A"}
              </Text>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoIconBox}>
                <Ionicons name="language-outline" size={23} color="#4CC3FF" />
              </View>

              <Text style={styles.infoLabel}>Language</Text>

              <Text numberOfLines={2} style={styles.infoValue}>
                {course.language || "N/A"}
              </Text>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.ratingIconBox}>
                <Ionicons name="star" size={23} color="#FFD700" />
              </View>

              <Text style={styles.infoLabel}>Rating</Text>

              <Text numberOfLines={2} style={styles.infoValue}>
                {course.rating || "N/A"}
              </Text>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoIconBox}>
                <Ionicons name="school-outline" size={23} color="#4CC3FF" />
              </View>

              <Text style={styles.infoLabel}>Course Type</Text>

              <Text numberOfLines={2} style={styles.infoValue}>
                {courseType}
              </Text>
            </View>
          </View>

          {/* About course */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.headingIconBox}>
                <Ionicons
                  name="document-text-outline"
                  size={22}
                  color="#FFFFFF"
                />
              </View>

              <Text style={styles.heading}>About this Course</Text>
            </View>

            <Text style={styles.description}>
              {course.description ||
                "No description available for this course."}
            </Text>
          </View>

          {/* Student reviews */}
          <CourseReviews courseId={course.id} />

          {/* Mentor information */}
          <View style={styles.mentorSection}>
            <MentorCard />
          </View>

          {/* Continue learning */}
          <LinearGradient
            colors={["#111B45", "#0B1028"]}
            style={styles.ctaCard}
          >
            <View style={styles.ctaTextBox}>
              <Text style={styles.ctaTitle}>Continue your learning</Text>

              <Text style={styles.ctaSubtitle}>
                Open your course dashboard and continue from your enrolled
                lessons.
              </Text>
            </View>

            <LinearGradient
              colors={["#2563EB", "#7C3AED", "#33D6FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.enrollGradient}
            >
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.enrollButton}
                onPress={handleContinueLearning}
              >
                <Text style={styles.enrollButtonText}>Continue Learning</Text>

                <Ionicons name="arrow-forward" size={19} color="#FFFFFF" />
              </TouchableOpacity>
            </LinearGradient>
          </LinearGradient>
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

  scrollContent: {
    paddingBottom: 44,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#050A1C",
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

  heroContainer: {
    height: 360,
    position: "relative",
    overflow: "hidden",
  },

  heroImage: {
    width: "100%",
    height: "100%",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
  },

  heroHeader: {
    position: "absolute",
    top: 18,
    left: 18,
    right: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  backButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(5,10,28,0.65)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  enrolledBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.35)",
    backgroundColor: "rgba(5,10,28,0.78)",
  },

  enrolledDot: {
    width: 8,
    height: 8,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: "#22C55E",
  },

  enrolledBadgeText: {
    color: "#BBF7D0",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  titleContainer: {
    position: "absolute",
    bottom: 26,
    left: 20,
    right: 20,
  },

  categoryPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(51, 214, 255, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(51, 214, 255, 0.22)",
    marginBottom: 12,
  },

  categoryPillText: {
    color: "#33D6FF",
    fontSize: 12,
    fontWeight: "900",
  },

  title: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900",
    lineHeight: 39,
    letterSpacing: -0.5,
  },

  heroSubtitle: {
    color: "#C7D2FE",
    fontSize: 15,
    lineHeight: 23,
    marginTop: 10,
    maxWidth: "94%",
  },

  content: {
    paddingHorizontal: 18,
    marginTop: 20,
  },

  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  infoCard: {
    width: CARD_WIDTH,
    backgroundColor: "rgba(15, 23, 53, 0.95)",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(76, 195, 255, 0.14)",
  },

  infoIconBox: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "rgba(76, 195, 255, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  ratingIconBox: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "rgba(255, 215, 0, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  infoLabel: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
  },

  infoValue: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
  },

  card: {
    backgroundColor: "rgba(15, 23, 53, 0.95)",
    borderRadius: 24,
    padding: 20,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "rgba(76, 195, 255, 0.14)",
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },

  headingIconBox: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "rgba(124, 58, 237, 0.35)",
    justifyContent: "center",
    alignItems: "center",
  },

  heading: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "900",
  },

  description: {
    color: "#CBD5E1",
    fontSize: 15.5,
    lineHeight: 27,
  },

  mentorSection: {
    marginTop: 18,
  },

  ctaCard: {
    borderRadius: 24,
    padding: 18,
    marginTop: 18,
    borderWidth: 1,
    borderColor: "rgba(76, 195, 255, 0.16)",
  },

  ctaTextBox: {
    marginBottom: 16,
  },

  ctaTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 6,
  },

  ctaSubtitle: {
    color: "#AAB2CC",
    fontSize: 14,
    lineHeight: 21,
  },

  enrollGradient: {
    borderRadius: 999,
    overflow: "hidden",
    shadowColor: "#33D6FF",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 10,
  },

  enrollButton: {
    minHeight: 56,
    paddingVertical: 15,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },

  enrollButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.3,
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

  lockIconBox: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "rgba(76, 195, 255, 0.12)",
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

  backTextButton: {
    marginTop: 14,
    paddingVertical: 12,
  },

  backText: {
    color: "#33D6FF",
    fontSize: 15,
    fontWeight: "800",
  },
});
