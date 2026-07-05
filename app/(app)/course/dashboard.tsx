import { getCourseById } from "@/services/course.service";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import CourseSectionCard from "./components/CourseSectionCard";
import { SECTION_CONFIG } from "./components/sectionConfig";

const { width } = Dimensions.get("window");

export default function CourseDashboardScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    data: course,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["course-dashboard", id],
    queryFn: () => getCourseById(id),
  });

  const navigateToSection = (section: string) => {
    switch (section) {
      case "resources":
        router.push({
          pathname: "/(app)/course/resources",
          params: { id },
        });
        break;

      case "videos":
        router.push({
          pathname: "/(app)/course/videos",
          params: { id },
        });
        break;

      case "mock-test":
        router.push({
          pathname: "/(app)/course/mock-tests",
          params: { id },
        });
        break;

      case "pyq-mock-test":
        router.push({
          pathname: "/(app)/course/pyq-tests",
          params: { id },
        });
        break;

      case "live-test":
        router.push({
          pathname: "/(app)/course/live-tests",
          params: { id },
        });
        break;

      default:
        break;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#4CC3FF" />
      </SafeAreaView>
    );
  }

  if (isError || !course) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorText}>Failed to load course.</Text>

        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#050A1C" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header */}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Hero */}

        <LinearGradient colors={["#18275D", "#0B1028"]} style={styles.hero}>
          <Text style={styles.title}>{course.course_name}</Text>

          <Text style={styles.subtitle}>
            Select a section below to access learning materials, tests and PYQs.
          </Text>
        </LinearGradient>

        {/* Section Cards */}

        <View style={styles.sectionContainer}>
          {course.sections?.map((section: string) => {
            const config = SECTION_CONFIG[section];

            if (!config) return null;

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
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const CARD_WIDTH = width - 40;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050A1C",
  },

  content: {
    paddingBottom: 40,
  },

  center: {
    flex: 1,
    backgroundColor: "#050A1C",
    justifyContent: "center",
    alignItems: "center",
  },

  errorText: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 20,
  },

  retryButton: {
    backgroundColor: "#4CC3FF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },

  retryText: {
    color: "#000",
    fontWeight: "700",
  },

  backButton: {
    width: 46,
    height: 46,
    marginLeft: 20,
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 23,
    backgroundColor: "#16234A",
    justifyContent: "center",
    alignItems: "center",
  },

  hero: {
    marginHorizontal: 20,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 28,
    marginBottom: 26,
  },

  title: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 42,
  },

  subtitle: {
    marginTop: 18,
    color: "#C7D2FE",
    textAlign: "center",
    fontSize: 16,
    lineHeight: 26,
  },

  progressContainer: {
    marginHorizontal: 20,
    marginBottom: 30,
  },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  progressTitle: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  progressPercent: {
    color: "#4CC3FF",
    fontWeight: "700",
  },

  progressBar: {
    height: 10,
    borderRadius: 8,
    backgroundColor: "#1D2B55",
    overflow: "hidden",
  },

  progressFill: {
    height: 10,
    backgroundColor: "#4CC3FF",
    borderRadius: 8,
  },

  sectionContainer: {
    alignItems: "center",
  },

  card: {
    width: CARD_WIDTH,
  },
});
