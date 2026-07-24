import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface TestHistoryCardProps {
  studentId: number;
}

export default function TestHistoryCard({ studentId }: TestHistoryCardProps) {
  const handleOpenHistory = () => {
    router.push({
      pathname: "/course/test-history",
      params: {
        studentId: String(studentId),
        type: "mock",
      },
    });
  };

  return (
    <Pressable
      onPress={handleOpenHistory}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
    >
      <LinearGradient
        colors={["rgba(30, 41, 59, 0.98)", "rgba(30, 27, 75, 0.95)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Decorative glow */}
        <View style={styles.glow} />

        <View style={styles.leftSection}>
          <View style={styles.iconContainer}>
            <Ionicons name="analytics-outline" size={27} color="#67E8F9" />
          </View>

          <View style={styles.content}>
            <Text style={styles.eyebrow}>YOUR PERFORMANCE</Text>

            <Text style={styles.title}>Test History</Text>

            <Text style={styles.description}>
              View your mock tests, PYQ attempts and detailed answer reviews.
            </Text>

            <View style={styles.features}>
              <View style={styles.feature}>
                <Ionicons name="clipboard-outline" size={13} color="#A5B4FC" />

                <Text style={styles.featureText}>Mock Tests</Text>
              </View>

              <View style={styles.featureDivider} />

              <View style={styles.feature}>
                <Ionicons name="time-outline" size={13} color="#A5B4FC" />

                <Text style={styles.featureText}>PYQ Results</Text>
              </View>

              <View style={styles.featureDivider} />

              <View style={styles.feature}>
                <Ionicons
                  name="checkmark-done-outline"
                  size={13}
                  color="#A5B4FC"
                />

                <Text style={styles.featureText}>Review</Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    marginTop: 18,
    borderRadius: 22,
  },

  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },

  card: {
    position: "relative",
    minHeight: 155,
    padding: 18,
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  glow: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    right: -55,
    top: -70,
    backgroundColor: "rgba(34,211,238,0.07)",
  },

  leftSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },

  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34,211,238,0.09)",
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.14)",
  },

  content: {
    flex: 1,
  },

  eyebrow: {
    color: "#22D3EE",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 4,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "800",
  },

  description: {
    marginTop: 5,
    maxWidth: 260,
    color: "#94A3B8",
    fontSize: 11,
    lineHeight: 17,
  },

  features: {
    marginTop: 13,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 7,
  },

  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  featureText: {
    color: "#A5B4FC",
    fontSize: 9,
    fontWeight: "700",
  },

  featureDivider: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#475569",
  },

  arrowContainer: {
    width: 39,
    height: 39,
    marginLeft: 8,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34,211,238,0.08)",
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.12)",
  },
});
