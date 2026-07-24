import { Ionicons } from "@expo/vector-icons";
import React, { ComponentProps } from "react";
import {
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

interface ContactActionProps {
  title: string;
  value: string;
  icon: IoniconName;
  color: string;
  url: string;
}

export default function ContactAction({
  title,
  value,
  icon,
  color,
  url,
}: ContactActionProps) {
  const handlePress = async () => {
    const supported = await Linking.canOpenURL(url);

    if (!supported) {
      console.warn(`Unable to open URL: ${url}`);
      return;
    }

    await Linking.openURL(url);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      style={styles.card}
      onPress={handlePress}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text numberOfLines={2} style={styles.value}>
          {value}
        </Text>
      </View>

      <View style={styles.arrow}>
        <Ionicons name="arrow-forward" size={18} color={color} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    minHeight: 76,
    paddingHorizontal: 15,
    marginTop: 11,
    borderRadius: 19,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
    backgroundColor: "rgba(15,23,53,0.94)",
  },

  iconContainer: {
    width: 44,
    height: 44,
    marginRight: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  content: {
    flex: 1,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  value: {
    marginTop: 3,
    color: "#919DB7",
    fontSize: 11,
    lineHeight: 16,
  },

  arrow: {
    width: 35,
    height: 35,
    marginLeft: 8,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.035)",
  },
});
