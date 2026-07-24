import InformationPageLayout from "@/components/information/InformationPageLayout";
import InformationSection from "@/components/information/InformationSection";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

const HIGHLIGHTS = [
  {
    icon: "people-outline" as const,
    value: "1200+",
    label: "Students",
    color: "#4CC3FF",
  },
  {
    icon: "trophy-outline" as const,
    value: "94%",
    label: "Selection Rate",
    color: "#34D399",
  },
  {
    icon: "play-circle-outline" as const,
    value: "50+",
    label: "Video Lessons",
    color: "#A78BFA",
  },
  {
    icon: "star-outline" as const,
    value: "5★",
    label: "Student Rating",
    color: "#FBBF24",
  },
];

export default function AboutScreen() {
  return (
    <InformationPageLayout
      title="About"
      subtitle="Creativity, mentorship and focused MAH AAC CET preparation"
      icon="color-palette-outline"
    >
      <View style={styles.highlightsGrid}>
        {HIGHLIGHTS.map((item) => (
          <View key={item.label} style={styles.highlightCard}>
            <View
              style={[
                styles.highlightIcon,
                { backgroundColor: `${item.color}18` },
              ]}
            >
              <Ionicons name={item.icon} size={20} color={item.color} />
            </View>

            <Text style={styles.highlightValue}>{item.value}</Text>
            <Text style={styles.highlightLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      <InformationSection
        title="About AV Art Academy"
        icon="school-outline"
        paragraphs={[
          "AV Art Academy is more than just an art platform — it is a creative journey that blends imagination, emotion and technique.",
          "Founded by Vickey, the academy helps students strengthen their artistic fundamentals while preparing confidently for the MAH AAC CET examination.",
        ]}
      />

      <InformationSection
        title="Meet Vickey"
        icon="brush-outline"
        accentColor="#A78BFA"
        paragraphs={[
          "Vickey is the artist and mentor behind AV Art Academy. His approach is rooted in curiosity, regular practice and a deep interest in how visual ideas communicate emotion.",
          "Through practical demonstrations, structured lessons and exam-focused guidance, students are encouraged to develop both technical skill and creative confidence.",
        ]}
      />

      <InformationSection
        title="Why Students Learn With Us"
        icon="sparkles-outline"
        accentColor="#34D399"
        items={[
          {
            title: "Focused preparation",
            text: "Lessons are designed around the drawing, design, visualisation and aptitude skills needed for MAH AAC CET.",
          },
          {
            title: "Learn at your pace",
            text: "Students can revisit video lessons, resources and practice material whenever needed.",
          },
          {
            title: "Practice with purpose",
            text: "Mock tests and previous-year question papers help students understand the exam pattern and review their progress.",
          },
          {
            title: "Creative mentorship",
            text: "The academy combines exam preparation with encouragement to observe, imagine and create with confidence.",
          },
        ]}
      />

      <InformationSection
        title="Our Vision"
        icon="earth-outline"
        accentColor="#FBBF24"
        paragraphs={[
          "Our goal is to make quality art education accessible to students across India and to help every learner see art as a language that can connect people beyond boundaries.",
          "We believe consistent guidance, thoughtful practice and creative freedom can help students turn artistic ambition into meaningful achievement.",
        ]}
      />
    </InformationPageLayout>
  );
}

const styles = StyleSheet.create({
  highlightsGrid: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  highlightCard: {
    width: "48.4%",
    minHeight: 122,
    padding: 14,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
    backgroundColor: "rgba(15,23,53,0.94)",
  },

  highlightIcon: {
    width: 39,
    height: 39,
    marginBottom: 8,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  highlightValue: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "900",
  },

  highlightLabel: {
    marginTop: 4,
    color: "#8995AF",
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
});
