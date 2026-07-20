import { StyleSheet, View } from "react-native";

import { ScreenSkeleton } from "./ScreenSkeleton";
import { SkeletonBox } from "./SkeletonBox";

export function HomeScreenSkeleton() {
  return (
    <ScreenSkeleton>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <SkeletonBox width={110} height={14} borderRadius={7} />
          <SkeletonBox
            width={170}
            height={30}
            borderRadius={10}
            style={styles.name}
          />
        </View>

        <SkeletonBox width={56} height={56} borderRadius={28} />
      </View>

      {/* Section title */}
      <SkeletonBox
        width={145}
        height={24}
        borderRadius={9}
        style={styles.sectionTitle}
      />

      {/* Enrolled course card */}
      <View style={styles.enrolledCard}>
        <SkeletonBox width="72%" height={20} borderRadius={8} />
        <SkeletonBox
          width={100}
          height={14}
          borderRadius={7}
          style={styles.line}
        />
        <SkeletonBox
          width={145}
          height={13}
          borderRadius={6}
          style={styles.line}
        />
        <SkeletonBox
          width="100%"
          height={48}
          borderRadius={14}
          style={styles.button}
        />
      </View>

      {/* Second section */}
      <SkeletonBox
        width={210}
        height={24}
        borderRadius={9}
        style={styles.secondSection}
      />

      {/* Course cards */}
      {[1, 2].map((item) => (
        <View key={item} style={styles.courseCard}>
          <SkeletonBox width="100%" height={180} borderRadius={0} />

          <View style={styles.courseContent}>
            <SkeletonBox width="75%" height={20} borderRadius={8} />

            <SkeletonBox
              width={105}
              height={14}
              borderRadius={7}
              style={styles.line}
            />

            <SkeletonBox
              width={140}
              height={13}
              borderRadius={6}
              style={styles.line}
            />

            <View style={styles.bottomRow}>
              <SkeletonBox width={70} height={16} borderRadius={7} />
              <SkeletonBox width={60} height={20} borderRadius={7} />
            </View>

            <SkeletonBox
              width="100%"
              height={48}
              borderRadius={12}
              style={styles.button}
            />
          </View>
        </View>
      ))}
    </ScreenSkeleton>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 86,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },

  headerText: {
    flex: 1,
  },

  name: {
    marginTop: 9,
  },

  sectionTitle: {
    marginBottom: 18,
  },

  enrolledCard: {
    padding: 18,
    marginBottom: 30,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(76,195,255,0.18)",
  },

  secondSection: {
    marginBottom: 18,
  },

  courseCard: {
    overflow: "hidden",
    marginBottom: 20,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  courseContent: {
    padding: 16,
  },

  line: {
    marginTop: 10,
  },

  bottomRow: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  button: {
    marginTop: 18,
  },
});
