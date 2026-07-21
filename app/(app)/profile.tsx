import { getEnrolledCourses, getProfile } from "@/services/user.service";
import { useAuthStore } from "@/store/authStore";
import { formatDate } from "@/utils/date";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
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
  const queryClient = useQueryClient();

  const logout = useAuthStore((state) => state.logout);

  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
    isLoading: coursesLoading,
    isError: coursesError,
    refetch: refetchCourses,
  } = useQuery({
    queryKey: ["enrolled-courses", profile?.id],
    queryFn: () => getEnrolledCourses(profile!.id),
    enabled: !!profile?.id,
  });

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    try {
      setIsLoggingOut(true);

      await Promise.all([
        SecureStore.deleteItemAsync("accessToken"),
        SecureStore.deleteItemAsync("refreshToken"),
      ]);

      queryClient.clear();
      logout();

      router.replace("/");
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  const handleRetry = async () => {
    await refetchProfile();

    if (profile?.id) {
      await refetchCourses();
    }
  };

  const handleOpenCourses = () => {
    router.push("/(app)/home");
  };

  const userInitial =
    profile?.user_name?.trim()?.charAt(0)?.toUpperCase() || "S";

  const userName = profile?.user_name?.trim() || "Student";
  const userEmail = profile?.email || "Not available";
  const userMobile = profile?.mobile || "Not available";

  const joinedDate = profile?.created_at
    ? formatDate(profile.created_at)
    : "Not available";

  if (profileLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar style="light" backgroundColor="#050A1C" />

        <LinearGradient
          colors={["#2563EB", "#7C3AED", "#33D6FF"]}
          style={styles.loadingIcon}
        >
          <Ionicons name="person-outline" size={34} color="#FFFFFF" />
        </LinearGradient>

        <ActivityIndicator
          size="large"
          color="#4CC3FF"
          style={styles.loadingIndicator}
        />

        <Text style={styles.loadingText}>Loading your profile...</Text>
      </SafeAreaView>
    );
  }

  if (profileError || !profile) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar style="light" backgroundColor="#050A1C" />

        <View style={styles.errorIconContainer}>
          <Ionicons name="alert-circle-outline" size={42} color="#FF6B9A" />
        </View>

        <Text style={styles.errorTitle}>Unable to load profile</Text>

        <Text style={styles.errorDescription}>
          We could not load your account information. Please check your
          connection and try again.
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.retryButton}
          onPress={handleRetry}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.backTextButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar style="light" backgroundColor="#050A1C" />

      <View style={styles.glowTopRight} />
      <View style={styles.glowCenterLeft} />
      <View style={styles.glowBottomRight} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.85}
            hitSlop={10}
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={21} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>My Profile</Text>
            <Text style={styles.headerSubtitle}>
              Account and learning details
            </Text>
          </View>

          <View style={styles.headerPlaceholder} />
        </View>

        {/* Profile Hero */}
        <LinearGradient
          colors={["#172554", "#312E81", "#581C87"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileHero}
        >
          <View style={styles.heroDecorationOne} />
          <View style={styles.heroDecorationTwo} />

          <LinearGradient
            colors={["#FF3FA7", "#A855F7", "#33D6FF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarGradient}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{userInitial}</Text>
            </View>
          </LinearGradient>

          <Text style={styles.name}>{userName}</Text>

          <View style={styles.emailRow}>
            <Ionicons name="mail-outline" size={15} color="#B8C4DE" />

            <Text numberOfLines={1} style={styles.email}>
              {userEmail}
            </Text>
          </View>

          <View style={styles.activeBadge}>
            <View style={styles.activeDot} />
            <Text style={styles.activeBadgeText}>ACTIVE STUDENT</Text>
          </View>
        </LinearGradient>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.statCard}
            onPress={handleOpenCourses}
          >
            <View style={styles.statIconContainer}>
              <Ionicons name="book-outline" size={23} color="#4CC3FF" />
            </View>

            {coursesLoading ? (
              <ActivityIndicator size="small" color="#4CC3FF" />
            ) : (
              <Text style={styles.statValue}>{enrolledCourses.length}</Text>
            )}

            <Text style={styles.statLabel}>Enrolled Courses</Text>
          </TouchableOpacity>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="calendar-outline" size={23} color="#A78BFA" />
            </View>

            <Text numberOfLines={1} style={styles.statDateValue}>
              {joinedDate}
            </Text>

            <Text style={styles.statLabel}>Member Since</Text>
          </View>
        </View>

        {/* Account Information */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEyebrow}>PERSONAL DETAILS</Text>
          <Text style={styles.sectionTitle}>Account Information</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.informationRow}>
            <View style={styles.informationIcon}>
              <Ionicons name="person-outline" size={20} color="#4CC3FF" />
            </View>

            <View style={styles.informationContent}>
              <Text style={styles.label}>Full Name</Text>
              <Text style={styles.value}>{userName}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.informationRow}>
            <View style={styles.informationIcon}>
              <Ionicons name="mail-outline" size={20} color="#4CC3FF" />
            </View>

            <View style={styles.informationContent}>
              <Text style={styles.label}>Email Address</Text>
              <Text numberOfLines={2} style={styles.value}>
                {userEmail}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.informationRow}>
            <View style={styles.informationIcon}>
              <Ionicons name="call-outline" size={20} color="#4CC3FF" />
            </View>

            <View style={styles.informationContent}>
              <Text style={styles.label}>Mobile Number</Text>
              <Text style={styles.value}>{userMobile}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.informationRow}>
            <View style={styles.informationIcon}>
              <Ionicons name="school-outline" size={20} color="#4CC3FF" />
            </View>

            <View style={styles.informationContent}>
              <Text style={styles.label}>Enrolled Courses</Text>

              {coursesLoading ? (
                <ActivityIndicator
                  size="small"
                  color="#4CC3FF"
                  style={styles.inlineLoader}
                />
              ) : coursesError ? (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => refetchCourses()}
                >
                  <Text style={styles.retryInlineText}>Retry</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.value}>{enrolledCourses.length}</Text>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.informationRow}>
            <View style={styles.informationIcon}>
              <Ionicons
                name="calendar-clear-outline"
                size={20}
                color="#4CC3FF"
              />
            </View>

            <View style={styles.informationContent}>
              <Text style={styles.label}>Joined Date</Text>
              <Text style={styles.value}>{joinedDate}</Text>
            </View>
          </View>
        </View>

        {/* My Courses Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.myCoursesButton}
          onPress={handleOpenCourses}
        >
          <View style={styles.myCoursesLeft}>
            <View style={styles.myCoursesIcon}>
              <Ionicons name="library-outline" size={22} color="#4CC3FF" />
            </View>

            <View>
              <Text style={styles.myCoursesTitle}>My Courses</Text>
              <Text style={styles.myCoursesDescription}>
                Continue your enrolled lessons
              </Text>
            </View>
          </View>

          <Ionicons name="chevron-forward" size={22} color="#8290AF" />
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={isLoggingOut}
          style={[
            styles.logoutButton,
            isLoggingOut && styles.logoutButtonDisabled,
          ]}
          onPress={handleLogout}
        >
          {isLoggingOut ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={21} color="#FFFFFF" />

              <Text style={styles.logoutText}>Logout</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.footerText}>
          AV Art Academy • Learn. Create. Succeed.
        </Text>
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

  loadingIcon: {
    width: 76,
    height: 76,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingIndicator: {
    marginTop: 24,
  },

  loadingText: {
    color: "#9CA7BF",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 14,
  },

  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    backgroundColor: "#050A1C",
  },

  errorIconContainer: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    backgroundColor: "rgba(255,107,154,0.12)",
  },

  errorTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },

  errorDescription: {
    color: "#AAB2CC",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 9,
    marginBottom: 22,
  },

  retryButton: {
    width: "100%",
    minHeight: 52,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4CC3FF",
  },

  retryButtonText: {
    color: "#050A1C",
    fontSize: 15,
    fontWeight: "900",
  },

  backTextButton: {
    paddingVertical: 14,
    marginTop: 8,
  },

  backText: {
    color: "#4CC3FF",
    fontSize: 14,
    fontWeight: "800",
  },

  glowTopRight: {
    position: "absolute",
    top: -110,
    right: -120,
    width: 310,
    height: 310,
    borderRadius: 310,
    backgroundColor: "rgba(76,195,255,0.11)",
  },

  glowCenterLeft: {
    position: "absolute",
    top: 410,
    left: -130,
    width: 290,
    height: 290,
    borderRadius: 290,
    backgroundColor: "rgba(168,85,247,0.1)",
  },

  glowBottomRight: {
    position: "absolute",
    bottom: -150,
    right: -150,
    width: 350,
    height: 350,
    borderRadius: 350,
    backgroundColor: "rgba(255,63,167,0.07)",
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 50,
  },

  header: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
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

  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },

  headerSubtitle: {
    color: "#7F8AA5",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 3,
  },

  headerPlaceholder: {
    width: 42,
  },

  profileHero: {
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 28,
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  heroDecorationOne: {
    position: "absolute",
    top: -45,
    right: -25,
    width: 130,
    height: 130,
    borderRadius: 130,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  heroDecorationTwo: {
    position: "absolute",
    bottom: -55,
    left: -35,
    width: 150,
    height: 150,
    borderRadius: 150,
    backgroundColor: "rgba(51,214,255,0.06)",
  },

  avatarGradient: {
    width: 104,
    height: 104,
    borderRadius: 34,
    padding: 3,
    alignItems: "center",
    justifyContent: "center",
  },

  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#101836",
  },

  avatarText: {
    color: "#FFFFFF",
    fontSize: 39,
    fontWeight: "900",
  },

  name: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 18,
  },

  emailRow: {
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  email: {
    flexShrink: 1,
    color: "#B8C4DE",
    fontSize: 13,
    marginLeft: 7,
  },

  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    marginTop: 17,
    backgroundColor: "rgba(34,197,94,0.12)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.25)",
  },

  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 7,
    marginRight: 7,
    backgroundColor: "#22C55E",
  },

  activeBadgeText: {
    color: "#BBF7D0",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
  },

  statCard: {
    flex: 1,
    minHeight: 145,
    borderRadius: 21,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    backgroundColor: "rgba(15,23,53,0.9)",
  },

  statIconContainer: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    backgroundColor: "rgba(76,195,255,0.1)",
  },

  statValue: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "900",
  },

  statDateValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
  },

  statLabel: {
    color: "#8E99B3",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 6,
  },

  sectionHeader: {
    marginTop: 36,
    marginBottom: 17,
  },

  sectionEyebrow: {
    color: "#4CC3FF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "900",
    marginTop: 5,
  },

  card: {
    width: "100%",
    borderRadius: 23,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: "rgba(76,195,255,0.12)",
    backgroundColor: "rgba(15,23,53,0.95)",
  },

  informationRow: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
  },

  informationIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
    backgroundColor: "rgba(76,195,255,0.1)",
  },

  informationContent: {
    flex: 1,
  },

  label: {
    color: "#8995AF",
    fontSize: 11,
    fontWeight: "600",
  },

  value: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
    marginTop: 4,
  },

  inlineLoader: {
    alignSelf: "flex-start",
    marginTop: 6,
  },

  retryInlineText: {
    color: "#4CC3FF",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 4,
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  myCoursesButton: {
    minHeight: 78,
    borderRadius: 21,
    paddingHorizontal: 16,
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(76,195,255,0.15)",
    backgroundColor: "rgba(15,23,53,0.9)",
  },

  myCoursesLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  myCoursesIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
    backgroundColor: "rgba(76,195,255,0.1)",
  },

  myCoursesTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  myCoursesDescription: {
    color: "#8995AF",
    fontSize: 11,
    marginTop: 4,
  },

  logoutButton: {
    width: "100%",
    minHeight: 56,
    borderRadius: 17,
    marginTop: 26,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    backgroundColor: "#E54862",
    shadowColor: "#FF4D6D",
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 5,
  },

  logoutButtonDisabled: {
    opacity: 0.65,
  },

  logoutText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  footerText: {
    color: "#6F7A95",
    fontSize: 11,
    textAlign: "center",
    marginTop: 25,
  },
});
