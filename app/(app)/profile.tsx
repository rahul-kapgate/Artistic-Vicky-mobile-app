import { getEnrolledCourses, getProfile } from "@/services/user.service";
import { useAuthStore } from "@/store/authStore";
import { formatDate } from "@/utils/date";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Profile() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["courses", profile?.id],
    queryFn: () => getEnrolledCourses(profile!.id),
    enabled: !!profile?.id,
  });

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync("accessToken");
    await SecureStore.deleteItemAsync("refreshToken");

    logout();

    router.replace("/");
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator size="large" color="#4CC3FF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile?.user_name?.charAt(0).toUpperCase()}
          </Text>
        </View>

        <Text style={styles.name}>{profile?.user_name}</Text>
        <Text style={styles.email}>{profile?.email}</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account Information</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{profile?.email}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Mobile</Text>
            <Text style={styles.value}>{profile?.mobile}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Enrolled Courses</Text>
            <Text style={styles.value}>{courses.length}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Joined</Text>
            <Text style={styles.value}>
              {formatDate(profile?.created_at ?? "")}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
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

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#050A1C",
  },

  content: {
    padding: 24,
    alignItems: "center",
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#4CC3FF",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },

  avatarText: {
    color: "#050A1C",
    fontSize: 34,
    fontWeight: "700",
  },

  name: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
    marginTop: 18,
  },

  email: {
    color: "#AAB2CC",
    marginTop: 6,
    marginBottom: 30,
  },

  card: {
    width: "100%",
    backgroundColor: "#0F1735",
    borderRadius: 18,
    padding: 20,
  },

  cardTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },

  label: {
    color: "#AAB2CC",
    fontSize: 15,
  },

  value: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },

  logoutButton: {
    marginTop: 30,
    width: "100%",
    backgroundColor: "#FF4D6D",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },

  logoutText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
});
