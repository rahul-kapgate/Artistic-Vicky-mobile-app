import { getAllCourses } from "@/services/course.service";
import { getEnrolledCourses, getProfile } from "@/services/user.service";
import { Course } from "@/types/course";
import { useQuery } from "@tanstack/react-query";
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
    isError,
    refetch,
  } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
  });

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ["courses", profile?.id],
    queryFn: () => getEnrolledCourses(profile!.id),
    enabled: !!profile?.id,
  });

  const { data: allCourses = [], isLoading: allCoursesLoading } = useQuery({
    queryKey: ["all-courses"],
    queryFn: getAllCourses,
    enabled: !!profile?.id,
  });

  const enrolledCourseIds = new Set(courses.map((course) => String(course.id)));

  const notEnrolledCourses = allCourses.filter(
    (course) => !enrolledCourseIds.has(String(course.id)),
  );

  const hasEnrolledCourses = courses.length > 0;

  if (profileLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CC3FF" />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={{ color: "#fff" }}>Something went wrong.</Text>

        <TouchableOpacity onPress={() => refetch()}>
          <Text style={{ color: "#4CC3FF", marginTop: 12 }}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome Back 👋</Text>
            <Text style={styles.name}>{profile?.user_name}</Text>
          </View>

          <TouchableOpacity
            style={styles.avatar}
            onPress={() => router.push("/(app)/profile")}
          >
            <Text style={styles.avatarText}>
              {profile?.user_name?.[0]?.toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        {coursesLoading ? (
          <ActivityIndicator color="#4CC3FF" />
        ) : hasEnrolledCourses ? (
          <>
            <Text style={styles.sectionTitle}>My Courses</Text>

            {courses.map((course: Course) => (
              <View key={course.id} style={styles.enrolledCourseCard}>
                <Text numberOfLines={2} style={styles.courseTitle}>
                  {course.course_name}
                </Text>

                <Text style={styles.courseCategory}>{course.category}</Text>

                <View style={styles.metaBox}>
                  <Text style={styles.courseMeta}>
                    Duration: {course.duration}
                  </Text>

                  {!!course.language && (
                    <Text style={styles.courseMeta}>
                      Language: {course.language}
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={() =>
                    router.push({
                      pathname: "/(app)/course/dashboard",
                      params: { id: String(course.id) },
                    })
                  }
                >
                  <Text style={styles.continueButtonText}>
                    Continue Learning →
                  </Text>
                </TouchableOpacity>
              </View>
            ))}

            <Text style={[styles.sectionTitle, styles.secondSectionTitle]}>
              Explore More Courses
            </Text>

            {allCoursesLoading ? (
              <ActivityIndicator color="#4CC3FF" />
            ) : notEnrolledCourses.length === 0 ? (
              <Text style={styles.emptyText}>
                You are already enrolled in all available courses.
              </Text>
            ) : (
              notEnrolledCourses.map((course: Course) => (
                <View key={course.id} style={styles.courseCard}>
                  <Image
                    source={{ uri: course.image }}
                    style={styles.courseImage}
                    resizeMode="cover"
                  />

                  <View style={styles.courseContent}>
                    <Text numberOfLines={2} style={styles.courseTitle}>
                      {course.course_name}
                    </Text>

                    <Text style={styles.courseCategory}>{course.category}</Text>

                    <Text style={styles.courseMeta}>
                      Duration: {course.duration}
                    </Text>

                    {!!course.language && (
                      <Text style={styles.courseMeta}>
                        Language: {course.language}
                      </Text>
                    )}

                    <View style={styles.bottomRow}>
                      <Text style={styles.rating}>⭐ {course.rating}</Text>

                      <Text style={styles.price}>₹{course.price}</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.enrollButton}
                      onPress={() =>
                        router.push({
                          pathname: "/(app)/course/[id]",
                          params: { id: String(course.id) },
                        })
                      }
                    >
                      <Text style={styles.enrollButtonText}>Enroll Now</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Recommended Courses</Text>

            {allCoursesLoading ? (
              <ActivityIndicator color="#4CC3FF" />
            ) : allCourses.length === 0 ? (
              <Text style={styles.emptyText}>No courses available.</Text>
            ) : (
              allCourses.map((course: Course) => (
                <View key={course.id} style={styles.courseCard}>
                  <Image
                    source={{ uri: course.image }}
                    style={styles.courseImage}
                    resizeMode="cover"
                  />

                  <View style={styles.courseContent}>
                    <Text numberOfLines={2} style={styles.courseTitle}>
                      {course.course_name}
                    </Text>

                    <Text style={styles.courseCategory}>{course.category}</Text>

                    <Text style={styles.courseMeta}>
                      Duration: {course.duration}
                    </Text>

                    {!!course.language && (
                      <Text style={styles.courseMeta}>
                        Language: {course.language}
                      </Text>
                    )}

                    <View style={styles.bottomRow}>
                      <Text style={styles.rating}>⭐ {course.rating}</Text>

                      <Text style={styles.price}>₹{course.price}</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.enrollButton}
                      onPress={() =>
                        router.push({
                          pathname: "/(app)/course/[id]",
                          params: { id: String(course.id) },
                        })
                      }
                    >
                      <Text style={styles.enrollButtonText}>Enroll Now</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#050A1C",
  },
  content: {
    padding: 20,
    paddingBottom: 80,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  greeting: {
    color: "#AAB2CC",
    fontSize: 15,
  },
  name: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "700",
    marginTop: 6,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#4CC3FF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#050A1C",
    fontSize: 22,
    fontWeight: "700",
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 18,
  },
  emptyText: {
    color: "#AAB2CC",
    textAlign: "center",
    marginTop: 30,
  },
  courseCard: {
    backgroundColor: "#0F1735",
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 20,
  },
  courseImage: {
    width: "100%",
    height: 180,
  },
  courseContent: {
    padding: 16,
  },
  courseTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  courseCategory: {
    color: "#4CC3FF",
    fontWeight: "600",
    marginBottom: 8,
  },
  courseMeta: {
    color: "#AAB2CC",
    marginBottom: 4,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  rating: {
    color: "#FFD700",
    fontWeight: "600",
  },
  price: {
    color: "#4CC3FF",
    fontSize: 18,
    fontWeight: "700",
  },
  enrollButton: {
    marginTop: 18,
    backgroundColor: "#4CC3FF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },

  enrollButtonText: {
    color: "#050A1C",
    fontWeight: "700",
    fontSize: 16,
  },
  continueButton: {
    marginTop: 18,
    backgroundColor: "#22C55E",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  continueButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 16,
  },

  enrolledCourseCard: {
    backgroundColor: "#0F1735",
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(76, 195, 255, 0.18)",
  },

  metaBox: {
    marginTop: 8,
  },

  secondSectionTitle: {
    marginTop: 18,
  },
});
