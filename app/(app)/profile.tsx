import InformationLinksCard from "@/components/profile/InformationLinksCard";
import TestHistoryCard from "@/components/profile/TestHistoryCard";
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
    enabled: Boolean(profile?.id),
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
    const profileResult = await refetchProfile();
    const refreshedProfile = profileResult.data;

    if (refreshedProfile?.id) {
      await refetchCourses();
    }
  };

  const handleOpenCourses = () => {
    router.push("/(app)/home");
  };

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

      {/* Background glows */}
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

        {/* Profile hero */}
        <LinearGradient
          colors={["#111C3E", "#20205B", "#3B1B64"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileHero}
        >
          <View style={styles.heroDecorationOne} />
          <View style={styles.heroDecorationTwo} />

          <View style={styles.profileTopRow}>
            {/* Replaced first-letter avatar with profile icon */}
            <LinearGradient
              colors={["#4CC3FF", "#6366F1", "#A855F7"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.profileIconGradient}
            >
              <View style={styles.profileIconInner}>
                <Ionicons name="person-outline" size={34} color="#FFFFFF" />
              </View>
            </LinearGradient>

            <View style={styles.profileMainContent}>
              <View style={styles.nameRow}>
                <Text numberOfLines={2} style={styles.name}>
                  {userName}
                </Text>

                {profile.is_admin ? (
                  <View style={styles.adminBadge}>
                    <Ionicons
                      name="shield-checkmark"
                      size={11}
                      color="#FDE68A"
                    />

                    <Text style={styles.adminBadgeText}>ADMIN</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.emailRow}>
                <Ionicons name="mail-outline" size={14} color="#AAB6D3" />

                <Text numberOfLines={1} style={styles.email}>
                  {userEmail}
                </Text>
              </View>

              <View style={styles.profileMetaRow}>
                <View style={styles.activeBadge}>
                  <View style={styles.activeDot} />

                  <Text style={styles.activeBadgeText}>ACTIVE STUDENT</Text>
                </View>

                <View style={styles.joinedBadge}>
                  <Ionicons name="calendar-outline" size={12} color="#C4B5FD" />

                  <Text style={styles.joinedBadgeText}>
                    Joined {joinedDate}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Quick stats */}
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
            <View style={[styles.statIconContainer, styles.memberStatIcon]}>
              <Ionicons name="calendar-outline" size={23} color="#A78BFA" />
            </View>

            <Text numberOfLines={2} style={styles.statDateValue}>
              {joinedDate}
            </Text>

            <Text style={styles.statLabel}>Member Since</Text>
          </View>
        </View>

        {/* Account information */}
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

        {/* Learning actions */}
        <View style={styles.actionSectionHeader}>
          <Text style={styles.sectionEyebrow}>LEARNING</Text>

          <Text style={styles.actionSectionTitle}>Your Learning Activity</Text>
        </View>

        {/* My Courses */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.myCoursesButton}
          onPress={handleOpenCourses}
        >
          <View style={styles.myCoursesLeft}>
            <View style={styles.myCoursesIcon}>
              <Ionicons name="library-outline" size={22} color="#4CC3FF" />
            </View>

            <View style={styles.myCoursesContent}>
              <Text style={styles.myCoursesTitle}>My Courses</Text>

              <Text numberOfLines={1} style={styles.myCoursesDescription}>
                Continue your enrolled lessons
              </Text>
            </View>
          </View>

          <View style={styles.myCoursesArrow}>
            <Ionicons name="chevron-forward" size={20} color="#4CC3FF" />
          </View>
        </TouchableOpacity>

        {/* Test history */}
        <TestHistoryCard studentId={profile.id} />

        <InformationLinksCard />

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
    alignItems: "center",
    justifyContent: "center",
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
    marginTop: 14,
    color: "#9CA7BF",
    fontSize: 14,
    fontWeight: "600",
  },

  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#050A1C",
  },

  errorIconContainer: {
    width: 78,
    height: 78,
    marginBottom: 18,
    borderRadius: 39,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,107,154,0.12)",
  },

  errorTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },

  errorDescription: {
    marginTop: 9,
    marginBottom: 22,
    color: "#AAB2CC",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
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
    marginTop: 8,
    paddingVertical: 14,
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
    right: -150,
    bottom: -150,
    width: 350,
    height: 350,
    borderRadius: 350,
    backgroundColor: "rgba(255,63,167,0.07)",
  },

  content: {
    paddingTop: 12,
    paddingBottom: 50,
    paddingHorizontal: 20,
  },

  header: {
    minHeight: 58,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
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
    marginTop: 3,
    color: "#7F8AA5",
    fontSize: 10,
    fontWeight: "600",
  },

  headerPlaceholder: {
    width: 42,
  },

  profileHero: {
    width: "100%",
    minHeight: 150,
    padding: 20,
    borderRadius: 25,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  heroDecorationOne: {
    position: "absolute",
    top: -70,
    right: -45,
    width: 180,
    height: 180,
    borderRadius: 180,
    backgroundColor: "rgba(76,195,255,0.07)",
  },

  heroDecorationTwo: {
    position: "absolute",
    bottom: -80,
    left: -50,
    width: 190,
    height: 190,
    borderRadius: 190,
    backgroundColor: "rgba(168,85,247,0.08)",
  },

  profileTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  profileIconGradient: {
    width: 76,
    height: 76,
    padding: 2,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4CC3FF",
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 5,
  },

  profileIconInner: {
    width: "100%",
    height: "100%",
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111936",
  },

  profileMainContent: {
    flex: 1,
    marginLeft: 16,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },

  name: {
    flexShrink: 1,
    color: "#FFFFFF",
    fontSize: 21,
    lineHeight: 27,
    fontWeight: "900",
  },

  adminBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(245,158,11,0.13)",
    borderWidth: 1,
    borderColor: "rgba(253,230,138,0.24)",
  },

  adminBadgeText: {
    color: "#FDE68A",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.6,
  },

  emailRow: {
    maxWidth: "100%",
    marginTop: 7,
    flexDirection: "row",
    alignItems: "center",
  },

  email: {
    flex: 1,
    marginLeft: 6,
    color: "#AAB6D3",
    fontSize: 12,
  },

  profileMetaRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 7,
  },

  activeBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34,197,94,0.11)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.2)",
  },

  activeDot: {
    width: 6,
    height: 6,
    marginRight: 6,
    borderRadius: 6,
    backgroundColor: "#22C55E",
  },

  activeBadgeText: {
    color: "#BBF7D0",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.7,
  },

  joinedBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(139,92,246,0.11)",
    borderWidth: 1,
    borderColor: "rgba(196,181,253,0.17)",
  },

  joinedBadgeText: {
    color: "#C4B5FD",
    fontSize: 8,
    fontWeight: "800",
  },

  statsRow: {
    marginTop: 18,
    flexDirection: "row",
    gap: 12,
  },

  statCard: {
    flex: 1,
    minHeight: 138,
    padding: 15,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    backgroundColor: "rgba(15,23,53,0.9)",
  },

  statIconContainer: {
    width: 43,
    height: 43,
    marginBottom: 10,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(76,195,255,0.1)",
  },

  memberStatIcon: {
    backgroundColor: "rgba(167,139,250,0.1)",
  },

  statValue: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "900",
  },

  statDateValue: {
    color: "#FFFFFF",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "900",
    textAlign: "center",
  },

  statLabel: {
    marginTop: 6,
    color: "#8E99B3",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },

  sectionHeader: {
    marginTop: 34,
    marginBottom: 17,
  },

  sectionEyebrow: {
    color: "#4CC3FF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  sectionTitle: {
    marginTop: 5,
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "900",
  },

  card: {
    width: "100%",
    paddingHorizontal: 18,
    borderRadius: 23,
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
    marginRight: 13,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
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
    marginTop: 4,
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
  },

  inlineLoader: {
    alignSelf: "flex-start",
    marginTop: 6,
  },

  retryInlineText: {
    marginTop: 4,
    color: "#4CC3FF",
    fontSize: 13,
    fontWeight: "800",
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  actionSectionHeader: {
    marginTop: 30,
    marginBottom: 13,
  },

  actionSectionTitle: {
    marginTop: 4,
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "900",
  },

  myCoursesButton: {
    width: "100%",
    minHeight: 78,
    paddingHorizontal: 16,
    borderRadius: 21,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(76,195,255,0.15)",
    backgroundColor: "rgba(15,23,53,0.9)",
  },

  myCoursesLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  myCoursesIcon: {
    width: 45,
    height: 45,
    marginRight: 13,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(76,195,255,0.1)",
  },

  myCoursesContent: {
    flex: 1,
  },

  myCoursesTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  myCoursesDescription: {
    marginTop: 4,
    color: "#8995AF",
    fontSize: 11,
  },

  myCoursesArrow: {
    width: 37,
    height: 37,
    marginLeft: 10,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(76,195,255,0.07)",
  },

  logoutButton: {
    width: "100%",
    minHeight: 56,
    marginTop: 26,
    borderRadius: 17,
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
    marginTop: 25,
    color: "#6F7A95",
    fontSize: 11,
    textAlign: "center",
  },
});
