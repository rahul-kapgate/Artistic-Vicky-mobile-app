import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";

interface MentorCardProps {
  name?: string;
  role?: string;
  rating?: number;
  students?: string;
  courses?: string;
  description?: string;
}

export default function MentorCard({
  name = "Vickey Sir",
  role = "MAH AAC CET Expert & BFA Coach",
  rating = 5,
  students = "500+",
  courses = "3",
  description = "Expert MAH AAC CET coach helping students unlock their creative potential and secure BFA admissions across Maharashtra’s top visual arts colleges.",
}: MentorCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.headingRow}>
        <View style={styles.headingIcon}>
          <Ionicons name="school-outline" size={19} color="#33D6FF" />
        </View>

        <View>
          <Text style={styles.heading}>Your Mentor</Text>

          <Text style={styles.headingDescription}>
            Learn from an experienced coach
          </Text>
        </View>
      </View>

      <View style={styles.mentorRow}>
        <LinearGradient
          colors={["#22D3EE", "#3B82F6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatar}
        >
          <Ionicons name="person" size={29} color="#FFFFFF" />
        </LinearGradient>

        <View style={styles.mentorInformation}>
          <Text style={styles.mentorName}>{name}</Text>

          <Text style={styles.mentorRole}>{role}</Text>
        </View>
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Ionicons name="star" size={15} color="#FACC15" />

          <Text style={styles.statValue}>{rating.toFixed(1)}</Text>

          <Text style={styles.statLabel}>Rating</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.stat}>
          <Ionicons name="people-outline" size={16} color="#33D6FF" />

          <Text style={styles.statValue}>{students}</Text>

          <Text style={styles.statLabel}>Students</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.stat}>
          <Ionicons name="book-outline" size={16} color="#A78BFA" />

          <Text style={styles.statValue}>{courses}</Text>

          <Text style={styles.statLabel}>Courses</Text>
        </View>
      </View>

      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
  },

  headingIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(51,214,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(51,214,255,0.20)",
  },

  heading: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },

  headingDescription: {
    color: "#6B7280",
    fontSize: 10,
    marginTop: 3,
  },

  mentorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
  },

  mentorInformation: {
    flex: 1,
  },

  mentorName: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },

  mentorRole: {
    color: "#33D6FF",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },

  stats: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    paddingHorizontal: 9,
    borderRadius: 16,
    backgroundColor: "rgba(5,10,28,0.48)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  stat: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },

  statDivider: {
    width: 1,
    height: 33,
    backgroundColor: "rgba(255,255,255,0.10)",
  },

  statValue: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  statLabel: {
    color: "#6B7280",
    fontSize: 8,
    textTransform: "uppercase",
  },

  description: {
    color: "#AAB2CC",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 17,
  },
});
