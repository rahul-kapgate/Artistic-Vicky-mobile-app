import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { width } = Dimensions.get("window");

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
      activeOpacity={0.9}
      onPress={onPress}
      style={styles.wrapper}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Top Row */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Icon name={iconName} size={32} color="#FFFFFF" />
          </View>

          <Ionicons
            name="arrow-forward-circle"
            size={28}
            color="rgba(255,255,255,0.9)"
          />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>

          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Open Section</Text>

          <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const CARD_WIDTH = width - 40;

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 20,
  },

  card: {
    width: CARD_WIDTH,
    minHeight: 180,
    borderRadius: 24,
    padding: 22,
    justifyContent: "space-between",

    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 8,
    },

    elevation: 8,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  iconContainer: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },

  content: {
    marginVertical: 18,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 10,
  },

  subtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 15,
    lineHeight: 22,
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.18)",
    paddingTop: 16,
  },

  footerText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
