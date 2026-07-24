import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface TestHistoryCardProps {
  studentId: number;
}

export default function TestHistoryCard({ studentId }: TestHistoryCardProps) {
  const router = useRouter();

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
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.card}
      onPress={handleOpenHistory}
    >
      <View style={styles.left}>
        <View style={styles.iconContainer}>
          <Ionicons name="stats-chart-outline" size={23} color="#A78BFA" />
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Test History</Text>

          <Text numberOfLines={1} style={styles.description}>
            Review mock tests and PYQ results
          </Text>
        </View>
      </View>

      <View style={styles.arrowContainer}>
        <Ionicons name="chevron-forward" size={20} color="#A78BFA" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    minHeight: 78,
    marginTop: 12,
    paddingHorizontal: 16,
    borderRadius: 21,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(15,23,53,0.9)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.16)",
  },

  left: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  iconContainer: {
    width: 45,
    height: 45,
    marginRight: 13,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(167,139,250,0.1)",
  },

  content: {
    flex: 1,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  description: {
    marginTop: 4,
    color: "#8995AF",
    fontSize: 11,
  },

  arrowContainer: {
    width: 37,
    height: 37,
    marginLeft: 10,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(167,139,250,0.07)",
  },
});
