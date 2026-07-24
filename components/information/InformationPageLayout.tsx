import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { ComponentProps, ReactNode } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

interface InformationPageLayoutProps {
  title: string;
  subtitle: string;
  eyebrow?: string;
  icon: IoniconName;
  children: ReactNode;
  lastUpdated?: string;
  footerText?: string;
}

export default function InformationPageLayout({
  title,
  subtitle,
  eyebrow = "AV ART ACADEMY",
  icon,
  children,
  lastUpdated,
  footerText = "AV Art Academy • Learn. Create. Succeed.",
}: InformationPageLayoutProps) {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar style="light" backgroundColor="#050A1C" />

      <View style={styles.glowTopRight} />
      <View style={styles.glowCenterLeft} />
      <View style={styles.glowBottomRight} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.82}
            hitSlop={10}
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={21} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text numberOfLines={1} style={styles.headerTitle}>
              {title}
            </Text>
            <Text numberOfLines={1} style={styles.headerSubtitle}>
              {subtitle}
            </Text>
          </View>

          <View style={styles.headerPlaceholder} />
        </View>

        <LinearGradient
          colors={["#10234B", "#262061", "#4A1D68"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroGlowOne} />
          <View style={styles.heroGlowTwo} />

          <LinearGradient
            colors={["#4CC3FF", "#6366F1", "#A855F7"]}
            style={styles.heroIconGradient}
          >
            <View style={styles.heroIconInner}>
              <Ionicons name={icon} size={31} color="#FFFFFF" />
            </View>
          </LinearGradient>

          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={styles.heroTitle}>{title}</Text>
          <Text style={styles.heroSubtitle}>{subtitle}</Text>

          {lastUpdated ? (
            <View style={styles.updatedBadge}>
              <Ionicons name="time-outline" size={13} color="#C4B5FD" />
              <Text style={styles.updatedText}>
                Last updated: {lastUpdated}
              </Text>
            </View>
          ) : null}
        </LinearGradient>

        <View style={styles.body}>{children}</View>

        <Text style={styles.footer}>{footerText}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050A1C",
  },

  glowTopRight: {
    position: "absolute",
    top: -120,
    right: -120,
    width: 310,
    height: 310,
    borderRadius: 310,
    backgroundColor: "rgba(76,195,255,0.1)",
  },

  glowCenterLeft: {
    position: "absolute",
    top: 420,
    left: -150,
    width: 300,
    height: 300,
    borderRadius: 300,
    backgroundColor: "rgba(168,85,247,0.09)",
  },

  glowBottomRight: {
    position: "absolute",
    right: -150,
    bottom: -150,
    width: 340,
    height: 340,
    borderRadius: 340,
    backgroundColor: "rgba(255,63,167,0.06)",
  },

  content: {
    paddingTop: 12,
    paddingHorizontal: 18,
    paddingBottom: 45,
  },

  header: {
    minHeight: 58,
    marginBottom: 20,
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
    paddingHorizontal: 10,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },

  headerSubtitle: {
    marginTop: 3,
    color: "#7F8AA5",
    fontSize: 9,
    fontWeight: "600",
  },

  headerPlaceholder: {
    width: 42,
  },

  hero: {
    minHeight: 260,
    paddingHorizontal: 22,
    paddingVertical: 26,
    borderRadius: 28,
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  heroGlowOne: {
    position: "absolute",
    top: -55,
    right: -35,
    width: 170,
    height: 170,
    borderRadius: 170,
    backgroundColor: "rgba(76,195,255,0.08)",
  },

  heroGlowTwo: {
    position: "absolute",
    bottom: -70,
    left: -50,
    width: 190,
    height: 190,
    borderRadius: 190,
    backgroundColor: "rgba(168,85,247,0.1)",
  },

  heroIconGradient: {
    width: 72,
    height: 72,
    padding: 2,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  heroIconInner: {
    width: "100%",
    height: "100%",
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111936",
  },

  eyebrow: {
    marginTop: 17,
    color: "#67E8F9",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.4,
  },

  heroTitle: {
    marginTop: 5,
    color: "#FFFFFF",
    fontSize: 27,
    lineHeight: 34,
    fontWeight: "900",
    textAlign: "center",
  },

  heroSubtitle: {
    maxWidth: 310,
    marginTop: 9,
    color: "#B3BDD5",
    fontSize: 13,
    lineHeight: 21,
    textAlign: "center",
  },

  updatedBadge: {
    marginTop: 15,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(196,181,253,0.18)",
    backgroundColor: "rgba(139,92,246,0.1)",
  },

  scrollView: {
    flex: 1,
    backgroundColor: "#050A1C",
  },

  updatedText: {
    color: "#C4B5FD",
    fontSize: 9,
    fontWeight: "800",
  },

  body: {
    marginTop: 7,
  },

  footer: {
    marginTop: 27,
    color: "#65708C",
    fontSize: 10,
    textAlign: "center",
  },
});
