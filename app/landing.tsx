import { useAuthStore } from "@/store/authStore";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const STATS = [
  {
    value: "1200+",
    label: "Students",
  },
  {
    value: "94%",
    label: "Selection Rate",
  },
  {
    value: "50+",
    label: "Video Lessons",
  },
  {
    value: "5★",
    label: "Student Rating",
  },
];

const FEATURES = [
  {
    icon: "✏️",
    title: "Drawing Skills",
    description:
      "Master perspective drawing, sketching, composition and visualisation.",
  },
  {
    icon: "📝",
    title: "Mock Tests",
    description:
      "Practise exam-oriented aptitude tests and previous-year questions.",
  },
  {
    icon: "🎥",
    title: "Video Lessons",
    description:
      "Learn every concept through structured and easy-to-follow lessons.",
  },
  {
    icon: "🎯",
    title: "Expert Guidance",
    description:
      "Prepare with practical strategies and guidance from experienced mentors.",
  },
];

const TOPICS = [
  "Perspective Drawing",
  "Colour Theory",
  "Sketching",
  "Aptitude",
  "3D Visualisation",
  "Portfolio",
];

export default function LandingScreen() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const isSmallScreen = width < 380;

  const appVersion =
    Constants.expoConfig?.version ||
    Constants.manifest2?.extra?.expoClient?.version ||
    "1.1.0";

  const handleExploreCourses = () => {
    router.push("/courses");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar style="light" />

      <LinearGradient
        colors={["#050A1C", "#07112B", "#110A2A"]}
        locations={[0, 0.55, 1]}
        style={styles.flex}
      >
        {/* Background decoration */}
        <View style={styles.glowTopLeft} />
        <View style={styles.glowTopRight} />
        <View style={styles.glowCenter} />
        <View style={styles.glowBottom} />

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.container}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.brandContainer}>
                <Image
                  source={require("../assets/images/applogo.png")}
                  style={styles.headerLogo}
                  resizeMode="contain"
                />

                <View style={styles.brandTextContainer}>
                  <Text style={styles.brandName}>AV Art Academy</Text>
                  <Text style={styles.brandTagline}>
                    Learn. Create. Succeed.
                  </Text>
                </View>
              </View>

              <View style={styles.versionBadge}>
                <Text style={styles.versionText}>v{appVersion}</Text>
              </View>
            </View>

            {/* Hero */}
            <View style={styles.heroSection}>
              <View style={styles.heroBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.heroBadgeText}>
                  India&apos;s MAH AAC CET Coaching
                </Text>
              </View>

              <Text
                style={[
                  styles.title,
                  {
                    fontSize: isSmallScreen ? 36 : 42,
                    lineHeight: isSmallScreen ? 44 : 51,
                  },
                ]}
              >
                Turn your artistic dream into an{" "}
                <Text style={styles.titleAccent}>exam success.</Text>
              </Text>

              <Text style={styles.subtitle}>
                Build strong drawing skills, practise mock tests and prepare for
                art entrance exams with structured guidance from experienced
                mentors.
              </Text>

              {/* Visual card */}
              <LinearGradient
                colors={[
                  "rgba(40,57,110,0.72)",
                  "rgba(38,25,82,0.85)",
                  "rgba(17,22,58,0.9)",
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.journeyCard}
              >
                <View style={styles.journeyTopRow}>
                  <View>
                    <Text style={styles.journeyLabel}>
                      YOUR LEARNING JOURNEY
                    </Text>
                    <Text style={styles.journeyTitle}>
                      Prepare smarter, step by step
                    </Text>
                  </View>

                  <View style={styles.journeyIcon}>
                    <Text style={styles.journeyIconText}>🎨</Text>
                  </View>
                </View>

                <View style={styles.progressTrack}>
                  <LinearGradient
                    colors={["#FF4D9F", "#A855F7", "#38BDF8"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.progressValue}
                  />
                </View>

                <View style={styles.stepsRow}>
                  <View style={styles.stepItem}>
                    <View style={[styles.stepCircle, styles.stepCircleActive]}>
                      <Text style={styles.stepNumber}>1</Text>
                    </View>
                    <Text style={styles.stepText}>Learn</Text>
                  </View>

                  <View style={styles.stepLine} />

                  <View style={styles.stepItem}>
                    <View style={[styles.stepCircle, styles.stepCircleActive]}>
                      <Text style={styles.stepNumber}>2</Text>
                    </View>
                    <Text style={styles.stepText}>Practise</Text>
                  </View>

                  <View style={styles.stepLine} />

                  <View style={styles.stepItem}>
                    <View style={styles.stepCircle}>
                      <Text style={styles.stepNumber}>3</Text>
                    </View>
                    <Text style={styles.stepText}>Succeed</Text>
                  </View>
                </View>

                <View style={styles.topicPreviewRow}>
                  <View style={styles.topicPreview}>
                    <Text style={styles.topicPreviewIcon}>✏️</Text>
                    <Text style={styles.topicPreviewText}>
                      Perspective Drawing
                    </Text>
                  </View>

                  <View style={styles.topicPreview}>
                    <Text style={styles.topicPreviewIcon}>🧠</Text>
                    <Text style={styles.topicPreviewText}>Aptitude Tests</Text>
                  </View>
                </View>
              </LinearGradient>

              {/* Main Explore Courses button */}
              <LinearGradient
                colors={["#FF3F9F", "#A855F7", "#38BDF8"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryGradient}
              >
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.primaryButton}
                  onPress={handleExploreCourses}
                >
                  <Text style={styles.primaryButtonText}>Explore Courses</Text>

                  <View style={styles.buttonArrow}>
                    <Text style={styles.buttonArrowText}>→</Text>
                  </View>
                </TouchableOpacity>
              </LinearGradient>

              {/* Authentication buttons */}
              {isAuthenticated ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.secondaryButton}
                  onPress={() => router.replace("/(app)/home")}
                >
                  <Text style={styles.secondaryButtonText}>Go to My Home</Text>
                  <Text style={styles.secondaryArrow}>→</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.authRow}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.signupButton}
                    onPress={() => router.push("/(auth)/signup")}
                  >
                    <Text style={styles.signupButtonText}>Create Account</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.loginButton}
                    onPress={() => router.push("/(auth)/login")}
                  >
                    <Text style={styles.loginButtonText}>Login</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Statistics */}
            <View style={styles.statsSection}>
              {STATS.map((stat) => (
                <View key={stat.label} style={styles.statCard}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>

            {/* Features */}
            <View style={styles.section}>
              <Text style={styles.sectionEyebrow}>EVERYTHING YOU NEED</Text>
              <Text style={styles.sectionTitle}>
                Complete preparation in one app
              </Text>
              <Text style={styles.sectionDescription}>
                Learn the concepts, practise consistently and track your
                preparation from one place.
              </Text>

              <View style={styles.featuresGrid}>
                {FEATURES.map((feature) => (
                  <View key={feature.title} style={styles.featureCard}>
                    <View style={styles.featureIconContainer}>
                      <Text style={styles.featureIcon}>{feature.icon}</Text>
                    </View>

                    <Text style={styles.featureTitle}>{feature.title}</Text>

                    <Text style={styles.featureDescription}>
                      {feature.description}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Topics */}
            <View style={styles.section}>
              <Text style={styles.sectionEyebrow}>POPULAR TOPICS</Text>
              <Text style={styles.sectionTitle}>Skills you will master</Text>

              <View style={styles.topicChips}>
                {TOPICS.map((topic) => (
                  <View key={topic} style={styles.topicChip}>
                    <View style={styles.topicDot} />
                    <Text style={styles.topicChipText}>{topic}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Bottom CTA */}
            <LinearGradient
              colors={[
                "rgba(39,53,110,0.8)",
                "rgba(57,30,100,0.82)",
                "rgba(17,28,68,0.9)",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bottomCard}
            >
              <Text style={styles.bottomCardIcon}>✨</Text>

              <Text style={styles.bottomCardTitle}>
                Ready to start your preparation?
              </Text>

              <Text style={styles.bottomCardDescription}>
                Find the right course and begin your journey towards your dream
                art college.
              </Text>

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.bottomCardButton}
                onPress={handleExploreCourses}
              >
                <Text style={styles.bottomCardButtonText}>
                  View All Courses
                </Text>
                <Text style={styles.bottomCardArrow}>→</Text>
              </TouchableOpacity>
            </LinearGradient>

            <Text style={styles.footerText}>
              Trusted by aspiring artists across India ✨
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#050A1C",
  },

  flex: {
    flex: 1,
  },

  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },

  glowTopLeft: {
    position: "absolute",
    top: -120,
    left: -140,
    width: 320,
    height: 320,
    borderRadius: 320,
    backgroundColor: "rgba(124, 58, 237, 0.24)",
  },

  glowTopRight: {
    position: "absolute",
    top: 50,
    right: -140,
    width: 300,
    height: 300,
    borderRadius: 300,
    backgroundColor: "rgba(14, 165, 233, 0.16)",
  },

  glowCenter: {
    position: "absolute",
    top: 480,
    left: -100,
    width: 250,
    height: 250,
    borderRadius: 250,
    backgroundColor: "rgba(236, 72, 153, 0.11)",
  },

  glowBottom: {
    position: "absolute",
    bottom: -120,
    right: -120,
    width: 340,
    height: 340,
    borderRadius: 340,
    backgroundColor: "rgba(56, 189, 248, 0.12)",
  },

  header: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  headerLogo: {
    width: 48,
    height: 48,
    borderRadius: 13,
  },

  brandTextContainer: {
    marginLeft: 12,
  },

  brandName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  brandTagline: {
    color: "#8793B0",
    fontSize: 11,
    fontWeight: "500",
    marginTop: 3,
  },

  versionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  versionText: {
    color: "#9CA8C4",
    fontSize: 11,
    fontWeight: "700",
  },

  heroSection: {
    paddingTop: 48,
  },

  heroBadge: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.22)",
    backgroundColor: "rgba(30,64,175,0.16)",
    marginBottom: 22,
  },

  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 7,
    backgroundColor: "#38BDF8",
    marginRight: 8,
  },

  heroBadgeText: {
    color: "#B9D8FF",
    fontSize: 12,
    fontWeight: "700",
  },

  title: {
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "900",
    letterSpacing: -1.2,
  },

  titleAccent: {
    color: "#60A5FA",
  },

  subtitle: {
    color: "#B1BAD0",
    textAlign: "center",
    fontSize: 15,
    lineHeight: 25,
    marginTop: 18,
    paddingHorizontal: 4,
  },

  journeyCard: {
    borderRadius: 26,
    padding: 20,
    marginTop: 30,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    shadowColor: "#000000",
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },

  journeyTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  journeyLabel: {
    color: "#8290B4",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },

  journeyTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 7,
    maxWidth: 230,
  },

  journeyIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  journeyIconText: {
    fontSize: 24,
  },

  progressTrack: {
    height: 7,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.08)",
    marginTop: 24,
  },

  progressValue: {
    width: "70%",
    height: "100%",
    borderRadius: 999,
  },

  stepsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 18,
  },

  stepItem: {
    alignItems: "center",
  },

  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#28304E",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  stepCircleActive: {
    backgroundColor: "#6366F1",
    borderColor: "#8B8FFF",
  },

  stepNumber: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  stepText: {
    color: "#ADB7CF",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 7,
  },

  stepLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.14)",
    marginHorizontal: 8,
    marginTop: 15,
  },

  topicPreviewRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 22,
  },

  topicPreview: {
    flex: 1,
    minHeight: 58,
    borderRadius: 15,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  topicPreviewIcon: {
    fontSize: 18,
    marginRight: 8,
  },

  topicPreviewText: {
    flex: 1,
    color: "#E8ECF7",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
  },

  primaryGradient: {
    width: "100%",
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#A855F7",
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 8,
  },

  primaryButton: {
    minHeight: 58,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  buttonArrow: {
    position: "absolute",
    right: 14,
    width: 34,
    height: 34,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
  },

  buttonArrowText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },

  secondaryButton: {
    width: "100%",
    minHeight: 54,
    borderRadius: 18,
    paddingHorizontal: 20,
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
    backgroundColor: "rgba(13,18,45,0.7)",
  },

  secondaryButtonText: {
    color: "#EAF0FF",
    fontSize: 15,
    fontWeight: "700",
  },

  secondaryArrow: {
    color: "#60A5FA",
    fontSize: 20,
    marginLeft: 10,
  },

  authRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },

  signupButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.4)",
    backgroundColor: "rgba(30,64,175,0.18)",
  },

  signupButtonText: {
    color: "#DCEBFF",
    fontSize: 14,
    fontWeight: "800",
  },

  loginButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  statsSection: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 42,
  },

  statCard: {
    width: "48%",
    minHeight: 94,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  statValue: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "900",
  },

  statLabel: {
    color: "#8D99B5",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 6,
  },

  section: {
    marginTop: 58,
  },

  sectionEyebrow: {
    color: "#60A5FA",
    textAlign: "center",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.7,
  },

  sectionTitle: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 28,
    lineHeight: 35,
    fontWeight: "900",
    marginTop: 9,
  },

  sectionDescription: {
    color: "#969FBA",
    textAlign: "center",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
    paddingHorizontal: 10,
  },

  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 26,
  },

  featureCard: {
    width: "48%",
    minHeight: 198,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    backgroundColor: "rgba(14,22,52,0.78)",
  },

  featureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(96,165,250,0.12)",
  },

  featureIcon: {
    fontSize: 22,
  },

  featureTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 15,
  },

  featureDescription: {
    color: "#929DB8",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 8,
  },

  topicChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginTop: 24,
  },

  topicChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.055)",
  },

  topicDot: {
    width: 6,
    height: 6,
    borderRadius: 6,
    backgroundColor: "#38BDF8",
    marginRight: 8,
  },

  topicChipText: {
    color: "#D9E1F3",
    fontSize: 12,
    fontWeight: "700",
  },

  bottomCard: {
    marginTop: 58,
    borderRadius: 28,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  bottomCardIcon: {
    fontSize: 30,
  },

  bottomCardTitle: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 23,
    lineHeight: 30,
    fontWeight: "900",
    marginTop: 14,
  },

  bottomCardDescription: {
    color: "#A5AEC4",
    textAlign: "center",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
  },

  bottomCardButton: {
    minHeight: 50,
    marginTop: 22,
    paddingHorizontal: 22,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  bottomCardButtonText: {
    color: "#11152E",
    fontSize: 14,
    fontWeight: "900",
  },

  bottomCardArrow: {
    color: "#11152E",
    fontSize: 19,
    marginLeft: 9,
    fontWeight: "700",
  },

  footerText: {
    color: "#7F8AA6",
    textAlign: "center",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 32,
  },
});
