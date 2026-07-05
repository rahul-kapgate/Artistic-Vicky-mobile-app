import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  title: string;
  subtitle: string;
  icon: any;
  iconName: string;
  colors: readonly [string, string];
  onPress: () => void;
}

export default function CourseSectionCard({
  title,
  subtitle,
  icon: Icon,
  iconName,
  colors,
  onPress,
}: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.86}
      onPress={onPress}
      style={styles.wrapper}
      accessibilityRole="button"
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.glowCircleLarge} />
        <View style={styles.glowCircleSmall} />

        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Icon name={iconName} size={30} color="#FFFFFF" />
          </View>

          <View style={styles.arrowCircle}>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </View>
        </View>

        <View style={styles.content}>
          <Text numberOfLines={1} style={styles.title}>
            {title}
          </Text>

          <Text numberOfLines={2} style={styles.subtitle}>
            {subtitle}
          </Text>
        </View>

        <View style={styles.footer}>
          <View>
            <Text style={styles.footerLabel}>Open Section</Text>
            <Text style={styles.footerHint}>Tap to continue</Text>
          </View>

          <Ionicons name="chevron-forward" size={22} color="#FFFFFF" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
  },

  card: {
    width: "100%",
    minHeight: 178,
    borderRadius: 26,
    padding: 20,
    justifyContent: "space-between",
    overflow: "hidden",

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",

    shadowColor: "#33D6FF",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },

    elevation: 8,
  },

  glowCircleLarge: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    right: -70,
    top: -70,
    backgroundColor: "rgba(255,255,255,0.12)",
  },

  glowCircleSmall: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    left: -28,
    bottom: -28,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  iconContainer: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },

  arrowCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.16)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },

  content: {
    marginTop: 18,
    marginBottom: 18,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "900",
    marginBottom: 8,
    letterSpacing: -0.3,
  },

  subtitle: {
    color: "rgba(255,255,255,0.84)",
    fontSize: 14.5,
    lineHeight: 22,
    fontWeight: "500",
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.18)",
    paddingTop: 14,
  },

  footerLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  footerHint: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 3,
  },
});
