import { useAuthStore } from "@/store/authStore";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
const { width } = Dimensions.get("window");

export default function LandingScreen() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  const appVersion =
    Constants.expoConfig?.version ||
    Constants.manifest2?.extra?.expoClient?.version ||
    "1.1.0";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar style="light" />

      {/* Background Glows */}
      <View style={styles.glowTopLeft} />
      <View style={styles.glowCenter} />
      <View style={styles.glowBottomRight} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.container}
        >
          <View style={styles.heroSection}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image
                source={require("../assets/images/applogo.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <Text style={styles.versionText}>v{appVersion}</Text>
            </View>
            {/* Title */}
            <Text style={styles.title}>
              Welcome to <Text style={styles.titleAccent}>AV Art Academy</Text>
            </Text>

            {/* Description */}
            <Text style={styles.subtitle}>
              Sketch your success, ace the exam, and bring your artistic dreams
              to life with expert guidance from experienced mentors.
            </Text>

            {/* Buttons */}
            <View style={styles.buttonRow}>
              {isAuthenticated ? (
                <LinearGradient
                  colors={["#FF3FA7", "#A855F7", "#33D6FF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryGradient}
                >
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.primaryButton}
                    onPress={() => router.replace("/(app)/home")}
                  >
                    <Text style={styles.primaryButtonText}>Go to Home</Text>
                  </TouchableOpacity>
                </LinearGradient>
              ) : (
                <>
                  <LinearGradient
                    colors={["#FF3FA7", "#A855F7", "#33D6FF"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryGradient}
                  >
                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={styles.primaryButton}
                      onPress={() => router.push("/(auth)/signup")}
                    >
                      <Text style={styles.primaryButtonText}>Sign Up</Text>
                    </TouchableOpacity>
                  </LinearGradient>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.secondaryButton}
                    onPress={() => router.push("/(auth)/login")}
                  >
                    <Text style={styles.secondaryButtonText}>Login →</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Bottom Tagline */}
            <Text style={styles.footerText}>
              Trusted by aspiring artists across India ✨
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    backgroundColor: "#050A1C",
  },

  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    backgroundColor: "#050A1C",
  },

  /* Background Glows */
  glowTopLeft: {
    position: "absolute",
    top: -80,
    left: -100,
    width: 260,
    height: 260,
    borderRadius: 260,
    backgroundColor: "rgba(111, 66, 193, 0.22)",
  },

  glowCenter: {
    position: "absolute",
    top: 120,
    left: "25%",
    width: 220,
    height: 220,
    borderRadius: 220,
    backgroundColor: "rgba(79, 70, 229, 0.18)",
  },

  glowBottomRight: {
    position: "absolute",
    bottom: -120,
    right: -120,
    width: 320,
    height: 320,
    borderRadius: 320,
    backgroundColor: "rgba(33, 150, 243, 0.16)",
  },

  heroSection: {
    flex: 1,
    justifyContent: "center",
    minHeight: "100%",
    paddingVertical: 40,
  },

  /* Logo */
  logoContainer: {
    alignItems: "center",
    marginBottom: 32,
  },

  logoImage: {
    width: width * 0.35,
    height: width * 0.35,

    borderRadius: 24,
    marginBottom: 10,
  },

  /* Title */
  title: {
    textAlign: "center",
    color: "#FFFFFF",
    fontSize: 42,
    lineHeight: 50,
    fontWeight: "900",
    letterSpacing: -1,
  },

  titleAccent: {
    color: "#4C8DFF",
  },

  titleAccentBlock: {
    textAlign: "center",
    color: "#4CC3FF",
    fontSize: 42,
    lineHeight: 50,
    fontWeight: "900",
    letterSpacing: -1,
    marginBottom: 16,
  },

  /* Subtitle */
  subtitle: {
    textAlign: "center",
    color: "#C9D0E3",
    fontSize: 16,
    lineHeight: 28,
    marginBottom: 40,
    paddingHorizontal: 8,
  },

  /* Buttons */
  buttonRow: {
    width: "100%",
    gap: 14,
  },

  primaryGradient: {
    width: "100%",
    borderRadius: 999,
    overflow: "hidden",
    shadowColor: "#33D6FF",
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 8,
  },

  primaryButton: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  secondaryButton: {
    width: "100%",
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(13,18,45,0.55)",
  },

  secondaryButtonText: {
    color: "#EAF0FF",
    fontSize: 16,
    fontWeight: "700",
  },

  /* Footer */
  footerText: {
    marginTop: 50,
    textAlign: "center",
    color: "#8D9AB8",
    fontSize: 14,
    fontWeight: "500",
  },

  versionText: {
    marginTop: 6,
    color: "#8D9AB8",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});
