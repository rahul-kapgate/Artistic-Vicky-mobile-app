import { Ionicons } from "@expo/vector-icons";
import { Href, useRouter } from "expo-router";
import React, { ComponentProps } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

interface InformationLink {
  title: string;
  description: string;
  icon: IoniconName;
  color: string;
  pathname: Href;
}

const INFORMATION_LINKS: InformationLink[] = [
  {
    title: "About",
    description: "Know more about AV Art Academy",
    icon: "information-circle-outline",
    color: "#4CC3FF",
    pathname: "/information/about",
  },
  {
    title: "Contact Us",
    description: "Call, email or message our team",
    icon: "chatbubble-ellipses-outline",
    color: "#34D399",
    pathname: "/information/contact-us",
  },
  {
    title: "Privacy Policy",
    description: "How we handle your information",
    icon: "shield-checkmark-outline",
    color: "#A78BFA",
    pathname: "/information/privacy-policy",
  },
  {
    title: "Terms of Use",
    description: "Rules for using the application",
    icon: "document-text-outline",
    color: "#FBBF24",
    pathname: "/information/terms-of-use",
  },
  {
    title: "Refund Policy",
    description: "Payment and refund information",
    icon: "card-outline",
    color: "#FB7185",
    pathname: "/information/refund-policy",
  },
];

export default function InformationLinksCard() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.eyebrow}>ABOUT & SUPPORT</Text>

        <Text style={styles.sectionTitle}>Information and Policies</Text>

        <Text style={styles.sectionDescription}>
          Learn about the academy, contact support and review important
          policies.
        </Text>
      </View>

      <View style={styles.card}>
        {INFORMATION_LINKS.map((item, index) => {
          const isLast = index === INFORMATION_LINKS.length - 1;

          return (
            <View key={item.title}>
              <TouchableOpacity
                activeOpacity={0.78}
                style={styles.row}
                onPress={() => router.push(item.pathname)}
              >
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: `${item.color}18` },
                  ]}
                >
                  <Ionicons name={item.icon} size={21} color={item.color} />
                </View>

                <View style={styles.content}>
                  <Text style={styles.title}>{item.title}</Text>

                  <Text numberOfLines={1} style={styles.description}>
                    {item.description}
                  </Text>
                </View>

                <View style={styles.arrowContainer}>
                  <Ionicons name="chevron-forward" size={18} color="#8290AF" />
                </View>
              </TouchableOpacity>

              {!isLast ? <View style={styles.divider} /> : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
  },

  sectionHeader: {
    marginBottom: 14,
  },

  eyebrow: {
    color: "#4CC3FF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  sectionTitle: {
    marginTop: 5,
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "900",
  },

  sectionDescription: {
    marginTop: 6,
    color: "#7F8AA5",
    fontSize: 11,
    lineHeight: 17,
  },

  card: {
    width: "100%",
    paddingHorizontal: 16,
    borderRadius: 23,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(76,195,255,0.12)",
    backgroundColor: "rgba(15,23,53,0.94)",
  },

  row: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
  },

  iconContainer: {
    width: 43,
    height: 43,
    marginRight: 13,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  content: {
    flex: 1,
    paddingRight: 8,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  description: {
    marginTop: 4,
    color: "#8995AF",
    fontSize: 10,
  },

  arrowContainer: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  divider: {
    height: 1,
    marginLeft: 56,
    backgroundColor: "rgba(255,255,255,0.065)",
  },
});
