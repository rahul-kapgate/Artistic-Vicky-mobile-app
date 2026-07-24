import { Ionicons } from "@expo/vector-icons";
import React, { ComponentProps } from "react";
import { StyleSheet, Text, View } from "react-native";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export interface InformationListItem {
  title?: string;
  text: string;
}

interface InformationSectionProps {
  title: string;
  icon?: IoniconName;
  paragraphs?: string[];
  items?: InformationListItem[];
  accentColor?: string;
}

export default function InformationSection({
  title,
  icon = "document-text-outline",
  paragraphs = [],
  items = [],
  accentColor = "#4CC3FF",
}: InformationSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.headingRow}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${accentColor}18` },
          ]}
        >
          <Ionicons name={icon} size={19} color={accentColor} />
        </View>

        <Text style={styles.title}>{title}</Text>
      </View>

      {paragraphs.map((paragraph, index) => (
        <Text key={`${title}-paragraph-${index}`} style={styles.paragraph}>
          {paragraph}
        </Text>
      ))}

      {items.length > 0 ? (
        <View style={styles.list}>
          {items.map((item, index) => (
            <View key={`${title}-item-${index}`} style={styles.listItem}>
              <View style={[styles.bullet, { backgroundColor: accentColor }]} />

              <View style={styles.listContent}>
                {item.title ? (
                  <Text style={styles.itemTitle}>{item.title}</Text>
                ) : null}

                <Text style={styles.itemText}>{item.text}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: "100%",
    marginTop: 14,
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
    backgroundColor: "rgba(15,23,53,0.94)",
  },

  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 13,
  },

  iconContainer: {
    width: 38,
    height: 38,
    marginRight: 11,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "900",
  },

  paragraph: {
    color: "#AAB4CC",
    fontSize: 13,
    lineHeight: 21,
    marginBottom: 10,
  },

  list: {
    marginTop: 2,
    gap: 12,
  },

  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  bullet: {
    width: 6,
    height: 6,
    marginTop: 7,
    marginRight: 10,
    borderRadius: 3,
  },

  listContent: {
    flex: 1,
  },

  itemTitle: {
    color: "#F8FAFC",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "800",
    marginBottom: 2,
  },

  itemText: {
    color: "#9AA6C0",
    fontSize: 12,
    lineHeight: 19,
  },
});
