import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MockTestScreen } from "@/features/mock-test/MockTestScreen";
import type { MockTestType } from "@/types/mock-test";

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value)
    ? (value[0]?.trim() ?? "")
    : (value?.trim() ?? "");
}

function isValidTestType(value: string): value is MockTestType {
  return value === "mock" || value === "pyq";
}

function InvalidTestState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar style="light" backgroundColor="#050A1C" />

      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <View style={styles.errorContainer}>
        <View style={styles.errorIconContainer}>
          <Ionicons name="alert-circle-outline" size={42} color="#FF6B9A" />
        </View>

        <Text style={styles.errorTitle}>{title}</Text>

        <Text style={styles.errorDescription}>{description}</Text>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={19} color="#050A1C" />

          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.homeButton}
          onPress={() => router.replace("/(app)/home")}
        >
          <Ionicons name="home-outline" size={18} color="#4CC3FF" />

          <Text style={styles.homeButtonText}>View My Courses</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function TestAttemptRoute() {
  const params = useLocalSearchParams<{
    type?: string | string[];
    id?: string | string[];
    source?: string | string[];
  }>();

  const rawType = firstParam(params.type);
  const resourceId = firstParam(params.id);
  const source = firstParam(params.source);

  if (!isValidTestType(rawType)) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />

        <InvalidTestState
          title="Invalid test type"
          description="The selected test type is not supported. Please return to your course and select the test again."
        />
      </>
    );
  }

  if (!resourceId) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />

        <InvalidTestState
          title="Test not found"
          description="The test identifier is missing. Please return to your course and choose the test again."
        />
      </>
    );
  }

  const type: MockTestType = rawType;

  const showPromo = type === "mock" && source === "free-mock";

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          gestureEnabled: false,
          animation: "fade",
          contentStyle: {
            backgroundColor: "#050A1C",
          },
        }}
      />

      <MockTestScreen
        type={type}
        resourceId={resourceId}
        showPromo={showPromo}
      />
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#050A1C",
  },

  glowTop: {
    position: "absolute",
    top: -120,
    right: -120,
    width: 300,
    height: 300,
    borderRadius: 300,
    backgroundColor: "rgba(76,195,255,0.1)",
  },

  glowBottom: {
    position: "absolute",
    bottom: -150,
    left: -140,
    width: 340,
    height: 340,
    borderRadius: 340,
    backgroundColor: "rgba(124,58,237,0.12)",
  },

  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  errorIconContainer: {
    width: 82,
    height: 82,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,107,154,0.2)",
    backgroundColor: "rgba(255,107,154,0.1)",
  },

  errorTitle: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "900",
    textAlign: "center",
  },

  errorDescription: {
    maxWidth: 390,
    color: "#AAB2CC",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 25,
  },

  backButton: {
    width: "100%",
    minHeight: 54,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#4CC3FF",
  },

  backButtonText: {
    color: "#050A1C",
    fontSize: 15,
    fontWeight: "900",
  },

  homeButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 18,
    marginTop: 10,
  },

  homeButtonText: {
    color: "#4CC3FF",
    fontSize: 14,
    fontWeight: "800",
  },
});
