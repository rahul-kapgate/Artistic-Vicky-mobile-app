import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "../../store/authStore";

export default function HomeScreen() {
  const router = useRouter();

  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync("accessToken");
      await SecureStore.deleteItemAsync("refreshToken");

      logout();

      router.replace("/");
    } catch (error) {
      console.log("Logout Error:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome Back 👋</Text>
            <Text style={styles.name}>
              {user?.email?.split("@")[0] || "User"}
            </Text>
          </View>

          <TouchableOpacity style={styles.avatar} onPress={handleLogout}>
            <Text style={styles.avatarText}>
              {user?.email?.charAt(0)?.toUpperCase() || "U"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Continue Your Creative Journey</Text>

          <Text style={styles.bannerSubtitle}>
            Learn sketching, perspective drawing, colour theory and aptitude
            preparation with AV Art Academy.
          </Text>

          <TouchableOpacity style={styles.bannerButton}>
            <Text style={styles.bannerButtonText}>Explore Courses</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Courses</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>45</Text>
            <Text style={styles.statLabel}>Lessons</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionEmoji}>🎨</Text>
            <Text style={styles.actionText}>Sketching</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionEmoji}>📐</Text>
            <Text style={styles.actionText}>Perspective</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionEmoji}>🎯</Text>
            <Text style={styles.actionText}>Aptitude</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionEmoji}>🎥</Text>
            <Text style={styles.actionText}>Videos</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Lessons */}
        <Text style={styles.sectionTitle}>Recent Lessons</Text>

        <TouchableOpacity style={styles.lessonCard}>
          <Text style={styles.lessonTitle}>
            Introduction to Perspective Drawing
          </Text>

          <Text style={styles.lessonMeta}>Duration: 20 mins • Beginner</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.lessonCard}>
          <Text style={styles.lessonTitle}>Colour Theory Basics</Text>

          <Text style={styles.lessonMeta}>Duration: 15 mins • Beginner</Text>
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
    padding: 20,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },

  greeting: {
    color: "#AAB2CC",
    fontSize: 14,
  },

  name: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
    marginTop: 4,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#4CC3FF",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    color: "#050A1C",
    fontSize: 18,
    fontWeight: "700",
  },

  banner: {
    backgroundColor: "#0F1735",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  bannerTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 10,
  },

  bannerSubtitle: {
    color: "#AAB2CC",
    lineHeight: 22,
    marginBottom: 16,
  },

  bannerButton: {
    backgroundColor: "#4CC3FF",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  bannerButtonText: {
    color: "#050A1C",
    fontWeight: "700",
  },

  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },

  statCard: {
    flex: 1,
    backgroundColor: "#0F1735",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
  },

  statNumber: {
    color: "#4CC3FF",
    fontSize: 28,
    fontWeight: "700",
  },

  statLabel: {
    color: "#AAB2CC",
    marginTop: 6,
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    marginTop: 8,
  },

  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },

  actionCard: {
    width: "47%",
    backgroundColor: "#0F1735",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
  },

  actionEmoji: {
    fontSize: 30,
    marginBottom: 10,
  },

  actionText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  lessonCard: {
    backgroundColor: "#0F1735",
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
  },

  lessonTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },

  lessonMeta: {
    color: "#AAB2CC",
    fontSize: 13,
  },
  logoutButton: {
    backgroundColor: "#FF4D6D",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },

  logoutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
