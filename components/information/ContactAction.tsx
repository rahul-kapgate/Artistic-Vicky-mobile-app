import { useAppAlert } from "@/components/ui/AppAlertProvider";
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
  const { alert } = useAppAlert();

  const handlePress = async () => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error(`Unable to open URL: ${url}`, error);

      let message = "This action could not be opened on your device.";

      let alertIcon: IoniconName = "alert-circle-outline";

      if (url.startsWith("tel:")) {
        message =
          "No phone application was found. Calling may not work inside an Android emulator. Please test it on a physical device.";

        alertIcon = "call-outline";
      } else if (url.startsWith("mailto:")) {
        message = "No email application was found on your device.";

        alertIcon = "mail-outline";
      } else if (url.includes("wa.me")) {
        message =
          "Unable to open WhatsApp. Please make sure WhatsApp or a web browser is available.";

        alertIcon = "logo-whatsapp";
      }

      alert(
        "Unable to Open",
        message,
        [
          {
            text: "Got It",
            style: "default",
          },
        ],
        {
          tone: "warning",
          icon: alertIcon,
          cancelable: true,
        },
      );
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      style={styles.card}
      onPress={() => void handlePress()}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: `${color}18`,
          },
        ]}
      >
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
